# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Selected Design Direction

- The BYOKey Lab home page follows the second generated direction: trust, provider choice, local key storage, and plain-language data flow.
- The BYOKey Speak for English product page follows the first generated direction: Quick Assist, conversational speed, and an immediate product demonstration.
- Use a bright, low-contrast papyrus paper texture as the shared page background while preserving white interactive surfaces and the existing green/red/cyan functional palette.
- Cost estimates must state their token and exchange-rate assumptions and link to provider pricing because model prices can change.
- Security copy must distinguish local encrypted storage from runtime exposure and provider-side processing; do not describe client-side BYOK as risk-free.
- Speak pricing must label 10/50 daily round-trip estimates as 30-day monthly totals and visually recommend Gemini 2.5 Flash-Lite.
- Speak hero typography should use expressive hierarchy: a lifted gold BYOKey word, blue brush accent for Speak, smaller "for", and red/white/blue English treatment.
- Quick Assist demos must visibly show that an AI request occurs before a suggestion appears.
- Use the user-selected transparent keyhole-and-stars logo as the current brand asset. Preserve the complete wordmark and tagline in the parent hero, and crop only transparent whitespace when adapting it to compact header or footer slots.
- The home page should include the BYOK app diagram as a browser-friendly image generated from the PDF source, with the original PDF available as a secondary link.
- The API setup guide page should embed provider-specific PDF guides in the browser for Gemini and OpenAI/GPT; Claude remains marked as "作成中" until its guide PDF exists.
- Keep Cloudflare deployment and configuration behind explicit user confirmation.
