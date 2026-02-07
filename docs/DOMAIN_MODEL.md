# Domain Model (MVP)

Stand: 2026-02-07

## Entitaeten und Felder

### User
- id: string (uuid)
- displayName: string
- createdAt: string (ISO)

### Player
- id: string (uuid)
- name: string
- isBot: boolean
- createdAt: string (ISO)

### Match
- id: string (uuid)
- mode: `X01` | `CRICKET`
- rules: GameRules
- players: Player[]
- legs: Leg[]
- currentLegId: string
- status: `ACTIVE` | `FINISHED`
- startedAt: string (ISO)
- finishedAt?: string (ISO)

### Leg
- id: string (uuid)
- matchId: string
- legIndex: number
- startingPlayerId: string
- visits: Visit[]
- status: `ACTIVE` | `FINISHED`
- winnerPlayerId?: string
- startedAt: string (ISO)
- finishedAt?: string (ISO)

### Visit
- id: string (uuid)
- legId: string
- playerId: string
- index: number
- throws: Throw[]
- createdAt: string (ISO)
- isBust: boolean

### Throw
- id: string (uuid)
- visitId: string
- segment: number (1-20, 25 fuer Bull)
- multiplier: `S` | `D` | `T`
- score: number
- createdAt: string (ISO)
- source: `AUTO` | `MANUAL`

### GameRules
- x01StartScore?: number (210-1501)
- x01DoubleOut?: boolean
- cricketVariant?: `STANDARD` | `CUT_THROAT`

### GameMode
- `X01` | `CRICKET`

### Stats
- id: string (uuid)
- matchId: string
- playerId: string
- threeDartAverage: number
- checkoutAttempts: number
- checkoutSuccess: number
- checkoutRate: number
- hitRate: number
- totalDarts: number
- totalScore: number

## Beziehungen
- Match 1..N Leg
- Leg 1..N Visit
- Visit 1..N Throw
- Player 1..N Visit
- Match 1..N Stats (pro Player)

## Events und State-Transitions

### X01/Cricket Events
- `MATCH_STARTED`
- `LEG_STARTED`
- `VISIT_APPLIED`
- `VISIT_BUSTED`
- `LEG_FINISHED`
- `MATCH_FINISHED`
- `VISIT_UNDONE`

Jeder Event enthaelt:
- type
- timestamp
- matchId
- legId
- playerId
- payload (mode-spezifisch)

## X01 Regeln (Schrittform)
1. Match startet mit `x01StartScore` fuer jeden Spieler.
2. Ein Visit enthaelt bis zu drei Wuerfe.
3. Jeder Wurf hat Score = Segment * Multiplikator (Bull: 25 oder 50).
4. Der aktuelle Restscore reduziert sich um die Summe der Wuerfe.
5. Bust tritt ein, wenn Restscore < 0 oder Restscore == 1 bei Double-Out oder Restscore < 2 bei Double-Out.
6. Bei Bust wird der Restscore auf den Wert vor dem Visit zurueckgesetzt, der Visit ist gueltig, aber `isBust=true`.
7. Wenn Double-Out aktiv ist, muss der finale Wurf ein Double sein (Multiplikator `D`).
8. Leg endet nur, wenn Restscore exakt 0 erreicht wird und Double-Out Regel eingehalten ist.
9. Match endet, wenn definierte Anzahl Legs gewonnen ist (MVP: 1 Leg).

## Cricket Regeln (Schrittform)

### Zielzahlen
- 15, 16, 17, 18, 19, 20, 25 (Bull)

### Standard Cricket
1. Jede Zahl muss drei mal getroffen werden, um sie zu schliessen.
2. Treffer zaehlen pro Spieler.
3. Wenn ein Spieler eine Zahl geschlossen hat und andere Spieler sie nicht geschlossen haben, zaehlen weitere Treffer als Punkte (Segment * Multiplikator).
4. Leg endet, wenn ein Spieler alle Zahlen geschlossen hat und mindestens gleich viele Punkte wie alle anderen hat.

### Cut-Throat
1. Gleiches Schliess-Prinzip wie Standard.
2. Wenn ein Spieler eine Zahl geschlossen hat und andere nicht, werden die Punkte den anderen Spielern gutgeschrieben.
3. Leg endet, wenn ein Spieler alle Zahlen geschlossen hat und die niedrigste Punktzahl haelt.

## Validierungen und Fehlerfaelle
- Segment ausserhalb 1-20/25 ist ungueltig.
- Multiplikator `T` fuer Bull ist ungueltig.
- Wurfanzahl > 3 pro Visit ist ungueltig.
- Double-Out verletzt -> kein Leg-Ende, Bust je nach Restscore.

## Undo-Strategie
- Undo entfernt den letzten Visit.
- Alle daraus resultierenden Events werden entfernt.
- Der Leg-Status und Restscore werden auf den vorherigen Zustand zurueckgesetzt.
- Bei Undo eines Leg-Endes wird `LEG_FINISHED` entfernt und das Leg wird wieder `ACTIVE`.

## Persistenz-Hinweise
- IDs als UUIDv4
- Events koennen optional gespeichert werden (MVP optional)
- Versionierung: `schemaVersion` auf Match-Ebene
