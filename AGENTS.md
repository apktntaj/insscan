# Project Instructions - Pesisir (insscan)

## Tech Stack & Architecture
- **Framework**: Next.js 14 (App Router) with React 18 (Client components use `"use client"`).
- **Architecture**: Vertical Slice Architecture with a framework-independent core:
  - `core/<slice>/`: TypeScript domain logic, use cases, pure services, and outbound boundaries. Never import Next.js, React, browser APIs, or infrastructure.
  - `infrastructure/<slice>/`: Concrete third-party implementations of core boundaries. May depend on core, but never on `app/`, Next.js, or React.
  - `app/features/<slice>/`: Next.js adapters, composition roots, components, and hooks grouped by feature.
  - `app/shared/`: Shared application UI, configuration, and browser-specific infrastructure.
  - `app/api/` and route pages: Thin Next.js delivery entry points.
  - Dependency direction: `app -> core`, `app composition -> infrastructure -> core`; never `core -> app/infrastructure`.
- **Styling**: Tailwind CSS + DaisyUI.

## Development Commands
- Run development server: `npm run dev`
- Run tests: `npm test`
- Run linter: `npm run lint`
- Build project: `npm run build`

## Coding Guidelines
- **TypeScript**: New production code must use `.ts`/`.tsx` with strict typing. Remaining legacy JavaScript must be migrated slice-by-slice; do not add new `.js`/`.jsx` source files. Keep code clean and well-documented in Indonesian or English as appropriate for domain logic (Indonesian customs terminology like *LARTAS*, *HS Code*, *PPJK*).
- **Conciseness**: Keep responses and explanations clear, concise, and focused on practical solutions.
