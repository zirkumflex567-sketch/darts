# Prompt 08: Statistiken und Historie

## Auftrag
Implementiere Statistiken, Historien-Ansichten und Berechnungen für X01.

## Anforderungen
- Statistiken pro Match und Leg
- Durchschnitt (3-Dart-Average)
- Checkout-Rate
- Trefferquote
- Historie mit Filter nach Modus und Datum

## Definitionen
- 3-Dart-Average = (Summe aller Punkte) / (Anzahl geworfener Darts) * 3
- Trefferquote = (Anzahl Darts mit Punkten > 0) / (Anzahl geworfener Darts)
- Checkout-Versuch: ein Visit, bei dem der Restscore zu Beginn <= 170 ist
- Checkout-Rate = erfolgreiche Checkouts / Checkout-Versuche

## UI-Anforderungen
- Historienliste mit Matchdatum, Modus, Ergebnis
- Detailansicht pro Match mit Stats und Leg-Historie
- Filter nach Datum und Modus

## Implementierungsdetails
- Berechnung in `src/domain/stats/`
- UI unter `src/ui/screens/HistoryScreen.tsx` und `MatchDetailScreen.tsx`
- Tests unter `tests/domain/stats/`

## Output-Format
- Code-Diff
- Tests für Statistiken

## Akzeptanzkriterien
- Statistiken sind reproduzierbar.
- Historie bleibt nach App-Neustart erhalten.
