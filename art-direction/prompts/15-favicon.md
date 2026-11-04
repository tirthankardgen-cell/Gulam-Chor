# 15 · Browser / touch icon

**Save:** `public/art/generated/favicon.png`

**Canvas:** 1024 × 1024, square PNG. Opaque deep-green background.

**Reference:** The approved emblem from prompt 14.

**Use:** Browser tab icon and touch icon through Next.js metadata.

## Generation prompt

Create a simplified tiny-size application icon derived from the supplied original Gulam Chor emblem. A single warm cream playing-card silhouette on a solid deep neem-green square #293D35, containing one bold muted-brass or dark-teal spade. A tiny terracotta moustache notch may remain only if it is legible at 16px; prioritize the spade/card silhouette over detail. Preserve the hand-printed Indian household-deck character, lightly imperfect contours, and matte warm palette. No rear card if it makes the tiny icon ambiguous.

Place the mark inside the central 68–72% of the canvas with balanced clear margins. Very few shapes, strong light/dark contrast, uniform background, centered visual mass. The full image must also look intentional as a square touch icon. Do not pre-round the overall canvas: the device applies its own mask. Avoid fine texture, hairline borders, multiple small ornaments, or inset details that vanish on a browser tab.

No letters, Hindi words, rank numbers, full wordmark, crown, poker chip, gambling imagery, gradient, glossy app tile, 3D lighting, complex portrait, watermark, white border outside the square, or copied logo. Original mark consistent with the hand-painted courtyard and deck.

## Review before saving

Preview explicitly at 16px, 32px, 48px, and 180px. If the moustache looks like noise, remove it at this size. The card and spade should remain recognizable. Save as PNG; `npm run art:sync` connects it to the existing metadata automatically. No manual route edits are required.
