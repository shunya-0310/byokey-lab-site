# Design QA

## Comparison Targets

- Home source visual truth: `C:\Users\shuny\.codex\generated_images\019f58fe-5b82-73c1-8854-ef2f645486a9\exec-21eca4b6-b55e-4ab2-be9b-72b85081278c.png`
- Home implementation: `D:\ドキュメント\Codex\byokey-lab-site\qa-home-1440x1024.png`
- Speak source visual truth: `C:\Users\shuny\.codex\generated_images\019f58fe-5b82-73c1-8854-ef2f645486a9\exec-4057d807-e339-424a-8635-098ecdd28fea.png`
- Speak implementation: `D:\ドキュメント\Codex\byokey-lab-site\qa-speak-1440x1024-v2.png`
- Viewport: 1440 x 1024 desktop, 390 x 844 mobile
- State: default light theme; Quick Assist before insertion; API setup before connection test

## Evidence

- Full-view comparisons: `qa-home-comparison.png`, `qa-speak-comparison.png`
- Focused comparisons: `qa-home-focus-comparison.png`, `qa-speak-focus-comparison.png`
- Mobile captures: `qa-home-390x844.png`, `qa-speak-390x844.png`
- The source and browser-rendered implementation were combined side by side before review.

## Findings

No actionable P0, P1, or P2 issues remain.

- Fonts and typography: The implementation preserves the reference's heavy sans-serif hierarchy, readable Japanese body type, zero letter-spacing, and compact UI labels. System fallbacks are intentional to avoid a render-blocking font dependency.
- Spacing and layout rhythm: The home page keeps the selected trust-first rhythm while changing the hero from a Speak product pitch to the parent BYOKey Lab brand. The Speak page preserves the reference's copy-to-product balance and exposes the next trust band in the desktop first viewport.
- Colors and visual tokens: White, ink black, trust green, assist yellow, and correction red match the selected directions. No gradient or decorative blob treatment was introduced.
- Image quality and asset fidelity: The core product experience is rendered as functional UI instead of a flattened screenshot. Lucide supplies the standard UI icons. The decorative phone frame and avatar photo were intentionally omitted to keep the product surface inspectable and avoid ornamental device chrome.
- Copy and content: Home copy is adapted to the BYOKey Lab parent brand. Speak copy, Quick Assist behavior, local-storage explanation, provider choice, one-time-purchase positioning, and separate API fees remain aligned with the brief.

## Comparison History

1. Initial Speak desktop capture: P2, the first viewport ended in empty white space and did not reveal the next section.
2. Fix: removed the forced viewport-height hero and increased controlled bottom spacing.
3. Revised capture: `qa-speak-1440x1024-v2.png` shows the complete product demo and a visible trust-band continuation without overlap or clipping.

## Interaction And Responsive Checks

- Provider selection, masked-key visibility control, and simulated connection success were tested.
- Quick Assist insertion was tested and preserved the existing draft content.
- Mobile navigation was opened and confirmed visible.
- `/`, `/speak/english/`, `/guide/api/`, and `/privacy/` rendered at mobile width without horizontal overflow.
- Browser console errors checked: none.
- Production build checked with `npm run build`: passed.

## Follow-up Polish

- P3: Replace the temporary letter provider marks with approved official brand assets after confirming each provider's trademark requirements.
- P3: Add final Google Play badge assets only after the store listing URL exists.

final result: passed
