# Integration and quality assurance

## Sources merged
- Member 2 `Member2_Data.zip`: preprocessing, 2,072 filtered sales, community-year summaries and 266 candidate pairs. These replace V5.2's earlier 2,076-sale/267-pair data.
- Member 3 `Dubais_Invisible_Twins_V5_2 part 3 included.zip`: `js/twin-constellation.js` and `js/every-sale.js`, linked from the existing app.
- Member 4 `Dubais_Invisible_Twins_V5_2_Fixed - Maitha.zip`: `js/twin-dna-and-budget.js`, the D3 Twin DNA, budget and apartment animation functions. The copy in Member 3's package was byte-identical.
- Member 1: restored original V5 camera transitions, non-modal guidance, added chapter cues, direct-link navigation, reconciled data, corrected gap denominator, removed misleading source-count text.

## Checks performed
- JSON files parse, and their record counts match Member 2's CSVs.
- JavaScript syntax checked with Node.js.
- Matching eligibility and sample-size rules checked programmatically.
- Source-to-summary medians and prices independently checked.
- HTML references and direct-link section IDs checked.

## Browser testing limitation
A headless Chromium browser test was attempted, but the execution environment blocked access to its local HTTP server. Therefore end-to-end rendering and remote map tile availability are **not verified**. Before submission, test all interactions on Chrome and Edge using Live Server. Do not claim complete browser verification.

## Required manual tests
1. Open via Live Server, verify all four D3 SVG charts and the map.
2. Select each year and several starting communities; compare dropdown must show eligible candidates only.
3. Click a Constellation dot; all four views and apartment illustrations must update.
4. Hover Every Sale dots and toggle median/IQR controls.
5. Change Twin DNA metric repeatedly; verify labels, units and smooth transitions.
6. Drag budget slider repeatedly; verify values and no duplicate SVGs.
7. Check guidance stays light and does not block the charts; close and reopen it.
8. Open direct URLs ending `#find`, `#evidence`, `#dna`, `#budget`.
9. Check mobile width, reduced motion and disconnected map tiles.
10. Check browser console for errors and rehearse the 10-minute demonstration.
