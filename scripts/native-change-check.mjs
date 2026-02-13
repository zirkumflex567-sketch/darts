#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const args = process.argv.slice(2);

const sinceIndex = args.indexOf('--since');
const sinceRef = sinceIndex >= 0 ? args[sinceIndex + 1] : null;
const failOnRebuild = args.includes('--fail-on-rebuild');

if (sinceIndex >= 0 && !sinceRef) {
  console.error('Usage: node scripts/native-change-check.mjs [--since <git-ref>] [--fail-on-rebuild]');
  process.exit(2);
}

const NATIVE_PATH_RULES = [
  { pattern: /^android\//, reason: 'Android native project changed' },
  { pattern: /^ios\//, reason: 'iOS native project changed' },
  { pattern: /^app\.json$/, reason: 'Expo app config changed' },
  { pattern: /^app\.config\.(js|cjs|mjs|ts|json)$/, reason: 'Expo app config changed' },
  { pattern: /^plugins\//, reason: 'Expo config plugin files changed' },
  { pattern: /^react-native\.config\.(js|cjs|mjs|ts)$/, reason: 'React Native native config changed' },
  { pattern: /^Podfile$/, reason: 'iOS Podfile changed' },
  { pattern: /^Podfile\.lock$/, reason: 'iOS Podfile.lock changed' },
  { pattern: /^Gemfile$/, reason: 'Ruby native build config changed' },
  { pattern: /^Gemfile\.lock$/, reason: 'Ruby native build config changed' },
];

const NATIVE_PACKAGE_PATTERNS = [
  /^expo($|-|\/)/,
  /^@expo\//,
  /^react-native($|-|\/)/,
  /^@react-native\//,
  /^vision-camera-resize-plugin$/,
  /^react-native-fast-tflite$/,
  /^react-native-vision-camera$/,
];

function runGit(command) {
  try {
    return execSync(command, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function normalizeFile(filePath) {
  return filePath.replaceAll('\\', '/').replace(/^\.\//, '');
}

function unique(items) {
  return [...new Set(items)];
}

function isNativePackageName(name) {
  return NATIVE_PACKAGE_PATTERNS.some((pattern) => pattern.test(name));
}

function parseJsonOrNull(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readHeadFileOrNull(filePath, refForDiff = null) {
  const ref = refForDiff ?? 'HEAD';
  const out = runGit(`git show ${ref}:${filePath}`);
  return out;
}

function collectChangedFiles() {
  if (sinceRef) {
    const out = runGit(`git diff --name-only --diff-filter=ACMR ${sinceRef}...HEAD`);
    if (!out) return [];
    return unique(
      out
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map(normalizeFile)
    );
  }

  const out = runGit('git status --porcelain');
  if (!out) return [];

  return unique(
    out
      .split('\n')
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .map((line) => {
        const payload = line.slice(3).trim();
        const arrowIndex = payload.lastIndexOf(' -> ');
        const filePath = arrowIndex >= 0 ? payload.slice(arrowIndex + 4) : payload;
        return normalizeFile(filePath);
      })
  );
}

function dependencyDiff(beforePkg, afterPkg, keys) {
  const changes = [];
  for (const key of keys) {
    const before = beforePkg?.[key] ?? {};
    const after = afterPkg?.[key] ?? {};
    const names = unique([...Object.keys(before), ...Object.keys(after)]);
    for (const name of names) {
      const prev = before[name];
      const next = after[name];
      if (prev === next) continue;
      changes.push({
        section: key,
        name,
        before: prev ?? null,
        after: next ?? null,
      });
    }
  }
  return changes;
}

function lockNativeDiff(beforeLock, afterLock) {
  const beforePackages = beforeLock?.packages ?? {};
  const afterPackages = afterLock?.packages ?? {};
  const names = new Set();

  for (const key of Object.keys(beforePackages)) {
    if (!key.startsWith('node_modules/')) continue;
    names.add(key.slice('node_modules/'.length));
  }
  for (const key of Object.keys(afterPackages)) {
    if (!key.startsWith('node_modules/')) continue;
    names.add(key.slice('node_modules/'.length));
  }

  const changes = [];
  for (const name of names) {
    if (!isNativePackageName(name)) continue;
    const beforeInfo = beforePackages[`node_modules/${name}`];
    const afterInfo = afterPackages[`node_modules/${name}`];
    const beforeVersion = beforeInfo?.version ?? null;
    const afterVersion = afterInfo?.version ?? null;
    if (beforeVersion === afterVersion) continue;
    changes.push({ name, before: beforeVersion, after: afterVersion });
  }
  return changes;
}

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(path.join(cwd, filePath), 'utf8');
  } catch {
    return null;
  }
}

function buildResult(changedFiles) {
  const reasons = [];

  for (const file of changedFiles) {
    for (const rule of NATIVE_PATH_RULES) {
      if (rule.pattern.test(file)) {
        reasons.push(`${rule.reason}: ${file}`);
      }
    }
  }

  const packageJsonChanged = changedFiles.includes('package.json');
  if (packageJsonChanged) {
    const currentRaw = safeReadFile('package.json');
    const beforeRaw = readHeadFileOrNull('package.json', sinceRef ?? null);
    const current = currentRaw ? parseJsonOrNull(currentRaw) : null;
    const before = beforeRaw ? parseJsonOrNull(beforeRaw) : null;

    if (!current || !before) {
      reasons.push('package.json changed and could not compare dependency changes safely');
    } else {
      const depChanges = dependencyDiff(before, current, [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
      ]);
      const nativeDepChanges = depChanges.filter((change) => isNativePackageName(change.name));
      for (const change of nativeDepChanges) {
        reasons.push(
          `native package changed (${change.section}): ${change.name} ${change.before ?? '(none)'} -> ${change.after ?? '(removed)'}`
        );
      }
    }
  }

  const lockChanged = changedFiles.includes('package-lock.json');
  if (lockChanged && !packageJsonChanged) {
    const currentRaw = safeReadFile('package-lock.json');
    const beforeRaw = readHeadFileOrNull('package-lock.json', sinceRef ?? null);
    const current = currentRaw ? parseJsonOrNull(currentRaw) : null;
    const before = beforeRaw ? parseJsonOrNull(beforeRaw) : null;

    if (!current || !before) {
      reasons.push('package-lock.json changed and native package diff could not be determined safely');
    } else {
      const nativeLockChanges = lockNativeDiff(before, current);
      for (const change of nativeLockChanges) {
        reasons.push(
          `native lock package changed: ${change.name} ${change.before ?? '(none)'} -> ${change.after ?? '(removed)'}`
        );
      }
    }
  }

  return {
    rebuildRequired: reasons.length > 0,
    reasons: unique(reasons),
  };
}

function printResult(result, changedFiles) {
  const header = result.rebuildRequired ? 'REBUILD: YES' : 'REBUILD: NO';
  console.log(header);
  console.log(`Changed files checked: ${changedFiles.length}`);

  if (result.reasons.length > 0) {
    console.log('Reasons:');
    for (const reason of result.reasons) {
      console.log(`- ${reason}`);
    }
  } else {
    console.log('No native trigger changes detected.');
  }

  if (sinceRef) {
    console.log(`Mode: git diff ${sinceRef}...HEAD`);
  } else {
    console.log('Mode: working tree (staged + unstaged + untracked)');
  }
}

const changedFiles = collectChangedFiles();
const result = buildResult(changedFiles);
printResult(result, changedFiles);

if (failOnRebuild && result.rebuildRequired) {
  process.exit(1);
}
