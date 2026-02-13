# Prompt 03: Domain Model und Regeln

## Auftrag
Definiere ein präzises Datenmodell und Regelwerk für X01 und Cricket, passend zur Architektur.

## Kontext
- Basis: `docs/APP_DOC.md`
- Architektur: `docs/ARCHITECTURE.md`
- Tech: TypeScript, Module unter `src/domain/`

## Anforderungen
- Entitäten mit Feldern, Datentypen und Pflichtfeldern
- Beziehungen und Kardinalitäten
- Event-Struktur für Spieländerungen
- Validierungen und Fehlerfälle
- Undo-Mechanik
- Versionierung des Models für Persistenz

## Benötigte Entitäten
- User
- Match
- Leg
- Visit
- Throw
- Player
- GameMode
- GameRules
- Stats

## X01-Regeln
- Startwerte 210–1501
- Double-Out optional
- Bust-Logik vollständig definiert
- Ungültige Würfe müssen konsistent behandelt werden

## Cricket-Regeln
- Standard Cricket
- Cut-Throat
- Klare Definition der Zahlenbereiche und Schließ-Logik
- Darstellung geschlossener Segmente je Spieler

## Output-Format
- Erstelle `docs/DOMAIN_MODEL.md`.

## Struktur von `docs/DOMAIN_MODEL.md`
- Entitätenliste mit Feldern und Datentypen
- Beziehungen
- Events und State-Transitions
- X01-Regeln in Schrittform
- Cricket-Regeln in Schrittform
- Undo-Strategie
- Persistenz-Hinweise (Key-Strategie, IDs, Version)

## Akzeptanzkriterien
- Jede Regel ist implementierbar.
- Kein Schritt bleibt unklar.
- Änderungen werden in Events nachvollziehbar.
