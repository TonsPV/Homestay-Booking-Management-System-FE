# Homestay Booking Management System Frontend

## Backend Contract

The Backend OpenAPI snapshot is stored at
`../homestay-booking-management-system-api/openapi/openapi.json`.

After the Backend contract changes, regenerate its TypeScript types:

```bash
npm run contract:generate
```

Generated files live in `src/api/generated` and must not be edited manually.
The Backend runtime documentation is available at
`http://localhost:3000/api/docs`.

## Amenity Flow

- Admin manages the shared catalog at `/management/amenities`.
- Admin assigns an exact Amenity set from `/management/room-types`.
- Public room search sends repeated `amenityIds` query parameters.
- Room cards and detail pages render Amenities returned inside `roomType`; the
  frontend does not maintain a hard-coded catalog.

## Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```
