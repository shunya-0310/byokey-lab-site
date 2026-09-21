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
- The API setup guide page should embed provider-specific PDF guides in the browser for Gemini, OpenAI/GPT, and Claude.
- Keep Cloudflare deployment and configuration behind explicit user confirmation.
- On mobile, opening the software keyboard must not shrink or fade the 1868 game's Katsu portrait; preserve the dialogue subject's scale while the player types.
- In the 1868 game, a negotiation ends only when the player explicitly chooses "決着を求める". A player question must receive a direct, contextual answer from Katsu before the conversation advances.
- In the 1868 game, "決着を求める" asks Katsu for a decision; a NOT_READY answer returns to dialogue and must never show an ending. Only an accepted agreement after the new-government decision, or Katsu explicitly breaking off talks, may reach an ending.
- In the 1868 game, the Negotiation Ledger is the single source of truth for issue status, the player proposal, and Katsu's latest acceptance, reservation, or conflict. Settlement and its reflection must reconcile the recent transcript with this ledger and may never re-request an issue that Katsu has explicitly accepted unless a later explicit conflict supersedes it.
- In the 1868 game, proposal and response events are the ledger's source of truth. Gemini extracts only events and evidence for the current turn; the client-side deterministic reducer derives issue state, proposal status, dependencies, pending focus, notes, settlement eligibility, and reflection. Regex may lint an event against an explicit contradiction, but must never decide an agreement. Do not re-read past dialogue to re-decide an established agreement.
- In the 1868 game, individual issue agreement and overall settlement are separate phases. Normal dialogue may resolve a specific clause or a written package of clauses, but it must not declare the entire negotiation closed. When the player requests settlement, the engine treats the canonical resolved/unresolved ledger as fact and makes Katsu's package-deal decision. Only after Katsu accepts may government acceptance, promise credibility, and internal consistency determine the ending; they must never reopen a resolved issue.
