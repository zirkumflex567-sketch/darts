# Prompt 11: Monetarisierung und Feature-Gates

## Auftrag
Füge Feature-Gates für Premium-Modi hinzu, ohne echte Payment-Integration.

## Anforderungen
- Entitlement-Service mit Mock-Status
- UI-Hinweise für gesperrte Features
- Fallback-Flow bei gesperrtem Zugriff
- Persistenter Mock-Status (lokal)

## Beispiele für Gates
- Bestimmte Trainingsmodi
- Online-Video-Option
- Erweiterte Statistiken

## Implementierungsdetails
- Entitlement-Service unter `src/data/entitlements/`
- Optionaler lokaler Speicher über AsyncStorage
- UI-Hinweise als Standard-Modal

## Output-Format
- Code-Diff
- Kurzbeschreibung der Entitlement-Logik

## Akzeptanzkriterien
- Kein Crash bei gesperrten Features.
- Hinweistext ist klar und eindeutig.
