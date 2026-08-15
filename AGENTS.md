# Project Instructions - Pesisir (insscan)

## Tech Stack & Architecture
- **Framework**: Next.js 14 (App Router) with React 18 (Client components use `"use client"`).
- **Architecture**: Clean Architecture — maintain strict separation between layers:
  - `app/core/`: Business logic, entities, use cases, ports.
  - `app/adapters/`: Controllers and presenters.
  - `app/infrastructure/`: External services, INSW API, IndexedDB, Excel (`xlsx`), PDF parsing, Gemini AI.
  - `app/presentation/`: React components, hooks, views.
- **Styling**: Tailwind CSS + DaisyUI.

## Development Commands
- Run development server: `npm run dev`
- Run tests: `npm test`
- Run linter: `npm run lint`
- Build project: `npm run build`

## Coding Guidelines
- **TypeScript / JavaScript**: Maintain type safety where TypeScript is used; keep code clean and well-documented in Indonesian or English as appropriate for domain logic (Indonesian customs terminology like *LARTAS*, *HS Code*, *PPJK*).
- **Conciseness**: Keep responses and explanations clear, concise, and focused on practical solutions.
