# Virtue Catalog Injection Notes

- Primary editable catalog file: `src/data/virtue/catalog.ts`
- Data access abstraction: `src/data/virtue/provider.ts`
- App schema: `src/types/virtue.ts`

## How to add your own apps
1. Add app objects to `virtueCatalog.apps` in `catalog.ts`.
2. Ensure each app `category` matches one of the category IDs in `virtueCatalog.categories`.
3. Optionally set `featured: true` or `updateAvailable: true` to populate Discover/Updates.

This app intentionally ships with an empty catalog by default.
