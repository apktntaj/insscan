# Project Structure

This project follows **Clean Architecture** principles with clear separation of concerns.

## Directory Layout

```
app/
├── adapters/           # Interface adapters layer
│   ├── controllers/    # Request handlers, orchestrate use cases
│   └── presenters/     # Transform entities to view models
├── api/                # Next.js API routes (HTTP layer)
├── core/               # Business logic (framework-independent)
│   ├── entities/       # Domain models and business rules
│   ├── ports/          # Interfaces for external dependencies
│   └── use-cases/      # Application business rules
├── infrastructure/     # External services and adapters
│   ├── excel/          # Excel generation service
│   ├── mocks/          # Mock data for development
│   └── services/       # External API clients (INSW)
└── presentation/       # UI layer
    ├── components/     # React components
    │   ├── common/     # Reusable UI components
    │   └── features/   # Feature-specific components
    └── config/         # UI configuration

docs/                   # Documentation
public/                 # Static assets
```

## Architecture Layers

### Core Layer (Domain)
- **Entities**: Pure business objects (e.g., `hs-code.js`)
- **Use Cases**: Application-specific business rules (e.g., `fetch-hs-code-data.js`)
- **Ports**: Interfaces defining contracts for external dependencies (e.g., `hs-code-gateway.port.js`)

### Adapters Layer
- **Controllers**: Handle HTTP requests, call use cases, return responses
- **Presenters**: Transform domain entities to API/UI formats

### Infrastructure Layer
- **Services**: Implement port interfaces with real external services
- **Excel**: File generation utilities
- **Mocks**: Development data

### Presentation Layer
- **Components**: React UI components organized by common/features
- **Pages**: Next.js route components (e.g., `blscann/page.jsx`, `inscann/page.jsx`)

### API Layer
- Next.js API routes that wire controllers to HTTP endpoints

## Dependency Flow

```
Presentation → API Routes → Controllers → Use Cases → Entities
                                ↓
                          Infrastructure (via Ports)
```

Dependencies point inward. Core layer has no dependencies on outer layers.

## Naming Conventions

- **Files**: kebab-case (e.g., `hs-code.controller.js`)
- **Components**: PascalCase (e.g., `HsCodeScanner.jsx`)
- **Functions**: camelCase (e.g., `fetchByCode`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `INSW_CMS_TOKEN`)

## Component Organization

- Common components are generic and reusable (Button, Input, Alert, etc.)
- Feature components are domain-specific (HsCodeScanner, HsCodeTable)
- All components export through `presentation/components/index.js`

## Key Patterns

- **Dependency Injection**: Use cases receive gateways as parameters
- **Factory Functions**: Controllers and use cases created via factory functions
- **Port/Adapter**: External services implement port interfaces
- **Singleton Exports**: Controllers exported as singletons for convenience
