# Prompt 01: Architektur und Scope-Definition

## Auftrag
Erstelle eine klare Architektur- und Scope-Definition für die MVP-App. Die Architektur muss so präzise sein, dass alle folgenden Implementierungs-Prompts ohne Rückfragen funktionieren.

## Kontext
- Grundlage: `docs/APP_DOC.md`
- MVP-Ziel: X01, Autoscoring-Stub, manuelle Korrektur, lokale Stats, Offline-First
- Online-Play und Monetarisierung später, aber als optionale Module vorgesehen

## Vorgaben
- Stack: React Native (Expo)
- Sprache: TypeScript
- Plattform: Android + iOS + Web
- Navigation: React Navigation
- State-Management: Zustand
- Persistenz: expo-sqlite
- Tests: Jest + React Native Testing Library

## Anforderungen
- Definiere die App in klaren Modulen.
- Lege die Grenzen zwischen Domain-Logik, Datenhaltung und UI fest.
- Beschreibe Datenflüsse für Scoring, Korrektur und Persistenz.
- Dokumentiere Nicht-Ziele.
- Lege eine MVP-Prioritätenliste in klarer Reihenfolge fest.

## Konkrete Inhalte, die du liefern musst
- Komponentenübersicht mit Zweck und Verantwortlichkeit
- Datenfluss Scoring: Wurf erkannt, Korrektur, Engine-Update, Persistenz
- Datenfluss History: Spielabschluss, Statistiken, Listenansicht
- State-Management-Ansatz und Begründung
- Persistenz-Strategie und Begründung
- Schnittstelle Autoscoring-Stub und wie diese in den UI-Flow hängt
- Technische Abhängigkeiten mit Versionsvorschlag

## Output-Format
- Erstelle oder aktualisiere `docs/ARCHITECTURE.md`.

## Struktur von `docs/ARCHITECTURE.md`
- Kurzüberblick
- Ziele
- Nicht-Ziele
- Komponenten und Verantwortlichkeiten
- Datenflüsse in Textform
- Module und Schnittstellen
- MVP-Prioritäten
- Risiken und offene Annahmen

## Akzeptanzkriterien
- Jedes Modul hat klare Aufgaben.
- Datenflüsse sind Schritt für Schritt beschrieben.
- Keine Platzhalter oder offene TODOs.
