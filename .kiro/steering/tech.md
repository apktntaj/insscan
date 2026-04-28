# Tech Stack

## Framework & Runtime

- **Next.js 14** with App Router
- **React 18** for UI components
- **Node.js** runtime

## Styling & UI

- **Tailwind CSS** for utility-first styling
- **DaisyUI** component library (themes: light, night, bumblebee)
- **React Icons** for iconography

## Key Libraries

- **axios** - HTTP client for API requests
- **pdfjs-dist** / **react-pdf** - PDF parsing and rendering
- **xlsx** (SheetJS) - Excel file generation and parsing
- **@prisma/client** - Database ORM (configured but not actively used in current codebase)
- **next-auth** - Authentication (configured but not actively used)

## External APIs

- **INSW API** - Indonesian National Single Window for HS code data, tariffs, and LARTAS regulations
  - CMS endpoints (requires token): Search and detailed commodity data
  - Public endpoints (no auth): Fallback for basic HS code info

## Environment Variables

- `INSW_CMS_TOKEN` / `INSW_BEARER_TOKEN` - Authentication for INSW CMS endpoints
- `INSW_PUBLIC_ONLY_MODE` - Skip authenticated endpoints, use public only
- `INSW_USE_LOCAL_MOCK` - Enable local mock data for development
- `INSW_MOCK_ONLY_MODE` - Use only mock data, no live API calls
- `INSW_MOCK_FILE_PATH` - Custom path to mock JSON file
- `INSW_REQUEST_DELAY_MIN_MS` / `INSW_REQUEST_DELAY_MAX_MS` - Rate limiting delays
- `INSW_REQUEST_ERROR_COOLDOWN_MS` - Cooldown after errors

## Common Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## Build Configuration

- **Webpack customizations**: Canvas and encoding modules disabled for PDF.js compatibility
- **Memory cache** in dev mode to avoid filesystem cache errors
- **CORS headers** enabled for all API routes
- **Path aliases**: `@/*` maps to project root
