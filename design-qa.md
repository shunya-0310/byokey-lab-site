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

## 2026-07-21 Logo Crop, Quick Assist Flow, And Footer Review

- Replaced the temporary JPEG logo asset with the user-supplied transparent PNG at `src/assets/byokey-lab-logo.png`.
- Reframed the shared header/footer mark to show only the keyhole without leaking the tagline below the crop.
- Reframed the parent hero lockup so the `BYOKey Lab` descender and complete `The Key is in your hand` tagline remain visible.
- Made the Quick Assist draft read-only and implemented the requested sequence: ask AI, show suggestion, insert expression, send message, receive coach reply.
- Changed the final CTA headline to `鍵はあなたの手の中に。` and removed the redundant footer tagline while retaining privacy and API guide links.
- Checked the parent page at 1280 x 720 and 390 x 844. No document-level horizontal overflow was found.
- Tested the complete five-step Quick Assist interaction and confirmed that the fixed draft cannot be edited.
- Browser console warnings and errors: none. Production build: passed.

final result: passed

## 2026-07-20 Annotated Speak Review

- Added FAQ to the global header navigation.
- Reworked the Speak hero typography with a lifted gold BYOKey word, blue brush accent for Speak, smaller "for", and a legible red-white-blue English treatment.
- Removed non-functional A2 badges from the conversation preview and Quick Assist card.
- Changed Quick Assist to demonstrate idle, AI processing, suggestion, and inserted states.
- Clarified that the 10/50 daily round-trip prices are 30-day monthly estimates.
- Highlighted Gemini 3.1 Flash-Lite from the model column through both monthly totals and added recommendation crowns and explanatory copy. Gemini 2.5 Flash remains listed with its announced October 2026 shutdown window.
- Updated the trust band, Quick Assist section, coach section, FAQ introduction, and hero copy from the annotated review.
- Generated five independent BYOKey Lab logo concepts under `design/logo-concepts/`; no concept has been applied to the site pending selection.

## 2026-07-20 Speak Content And Papyrus Update

- Added a nine-model pricing simulator covering Google, OpenAI, and Anthropic at 10 and 50 round trips per day. The exchange rate is editable and every pricing source is linked.
- Added security, API and billing, and general FAQ groups. Security claims distinguish Android Keystore encryption, private local storage, runtime memory, provider-side processing, and provider retention policies.
- Expanded the API setup guide with provider-specific prerequisites, billing requirements, step-by-step setup, official documentation links, and the OpenAI mobile-key warning.
- Replaced the decorative CEFR controls with a working single-selection control. Changing the level updates the visible conversation behavior description.
- Added the generated `src/assets/papyrus-texture.png` as a bright, low-contrast tiled page background. Removed fixed background attachment after it caused Chromium full-page screenshot compositing artifacts.
- Rechecked at 1440 x 1024 and 390 x 844. Desktop and mobile layouts have no document-level horizontal overflow; the mobile pricing table scrolls only inside its own wrapper.
- Tested CEFR B2 selection, exchange-rate recalculation, FAQ expansion, and provider-guide switching.
- Browser console errors checked: none during the interaction pass.

final result: passed

## 2026-07-21 Annotated Parent-Site Review

- Replaced the parent hero message with the broader BYOKey Lab proposition: connecting familiar apps to user-selected LLMs and growing new experiences across users, app developers, and providers.
- Replaced the clickable provider/key/chat demo with a static three-step explanation. The cards now explain provider choice, encrypted device setup, and direct app-to-LLM use without suggesting that the website accepts API keys.
- Reframed the principles section around `ユーザー` and `アプリ開発者`. The copy now distinguishes local app storage from provider-side transmission and avoids claiming that developers have no privacy responsibilities.
- Reworked the first-product title into a three-line Speak-style lockup and added the coach's preceding question to the compact Quick Assist demo.
- Fixed the principles headline to two semantic lines so `次へ行ける。` does not orphan a final character.
- Generated and saved the new pre-dawn hand-and-key logo concept as `design/logo-concepts/06-dawn-hand-key.png`. It contains exactly three dominant stars and smaller seed stars; it has not been applied to the site pending approval.
- Rechecked desktop at 1280 x 720 and mobile at 390 x 844. No document-level horizontal overflow or browser console warnings/errors were found.
- Retested the compact Quick Assist request state and confirmed that the English expression result appears.

final result: passed

## 2026-07-21 Final Keyhole Logo Adoption

- Adopted the user-supplied brass keyhole and star-field logo without modifying the source artwork. The site asset is `src/assets/byokey-lab-logo.jpg`.
- Applied the complete logo lockup to the parent-site hero and a CSS-cropped keyhole plus wordmark treatment to the shared header and footer.
- Reworked the site palette around the logo's pre-dawn navy, violet, brass, and warm paper tones. Existing red, cyan, and Quick Assist yellow remain as functional accents so the interface does not become a single-hue design.
- Compared the original logo and the 1280 x 720 parent-site render together. The keyhole proportions, star field, metallic frame, wordmark, and tagline remain visibly intact; only the source image's outer border and excess whitespace are cropped.
- Tightened the parent hero so the first viewport keeps the logo prominent while revealing the start of the next section.
- Rechecked the parent and Speak pages at 1280 x 720 and 390 x 844. The API guide was also checked at 390 x 844. No document-level horizontal overflow was found.
- Retested mobile navigation and the Quick Assist request/result flow. Browser console warnings and errors: none.
- Production build checked with `npm run build`: passed.

final result: passed
