# HomeFind realtor inventory — image generation

The realtor app (`src/apps/realtor`) renders a catalog of properties for sale and
for rent. Every listing uses a **distinct cover image** — no image or property is
reused. The cover art was generated with [Higgsfield](https://higgsfield.ai) using
the `nano_banana` text-to-image model.

## What's here

- `archetypes.json` — the palette of architectural archetypes (style, candidate
  cities/streets/buildings, price/size/year bands, marketing copy and feature
  lists) used to synthesize diverse, realistic listings.
- `image-manifest.json` — the generated cover images actually shipped, one entry
  per file in `public/assets/realtor/gen-*.jpg` (`key` = archetype, `n` = variant).

## How the covers were generated

Each archetype was rendered as **4 variant images** (`count: 4`) at `3:2` aspect
ratio with a prompt of the form:

```
Professional real estate exterior listing photo of a <archetype description>,
<setting>, <lighting>, wide angle MLS photography, no people, no text, photorealistic
```

Images were downloaded, resized to 1200px wide and re-encoded as progressive
JPEG (quality 82) before being committed.

## Regenerating / extending the inventory

1. Pick archetypes from `archetypes.json` (or add new ones).
2. For each, call Higgsfield `generate_image` with `model: nano_banana`,
   `aspect_ratio: "3:2"`, `count: 4`, and the prompt template above.
3. Save each result as `public/assets/realtor/gen-<key>-<n>.jpg`.
4. Rebuild `src/apps/realtor/listings.ts` so every new cover becomes exactly one
   listing (vary city/price/beds/status across an archetype's variants). Keep the
   invariant: **each cover string appears in exactly one listing.**

The 25 archetypes shipped so far (100 targeted images, 99 delivered) cover
mid-century, Victorian, brownstone, Tudor, Craftsman, Cape Cod, Greek revival,
adobe, Mediterranean, French chateau, log cabin, A-frame, glass box, brutalist,
Scandinavian, modern farmhouse, desert modern, stilt beach house, tropical modern,
Spanish colonial, Georgian, Dutch colonial, Prairie, Art Deco and Cotswold styles.
The remaining archetypes in `archetypes.json` are staged for future batches.
