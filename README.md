# E-commerce Auditor

A Next.js and TypeScript advertising-analytics prototype with dashboard views and Meta API integration.

[Hosted prototype](https://ecommerceauditor.vercel.app)

## Status and sample data

Prototype. This repository currently contains advertising-report CSV exports. Their provenance and suitability for public reuse are under review; do not treat them as licensed synthetic fixtures or as proof of business results. Use your own authorized data or synthetic examples when evaluating the app.

## Development

```sh
npm ci
npm run dev
```

Open http://localhost:3000. For a production build:

```sh
npm run build
npm start
```

The UI reaching a hosted URL does not establish that an authenticated Meta integration is configured or that audit recommendations have been validated. Configure credentials locally and never commit access tokens or private advertising data.
