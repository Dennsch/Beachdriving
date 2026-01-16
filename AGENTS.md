# AGENTS.md - Coding Guidelines for Agentic Development

This document provides essential guidelines for coding agents working on the Beachdriving project.

## Project Overview
- **Type**: React 18 + TypeScript web application
- **Purpose**: Beach safety forecasting app (weather, tides, safety assessment)
- **Main Tech Stack**: React, TypeScript, Axios, date-fns, React Scripts

## Build, Lint, and Test Commands

### Starting Development
```bash
npm start              # Start development server (uses API proxy)
npm run start:mock     # Start with mock data (REACT_APP_USE_MOCK_DATA=true)
npm run build          # Production build
```

### Testing
```bash
npm test               # Run tests in watch mode
npm test -- --watch=false  # Run tests once (CI mode)
npm test -- App.test   # Run single test file (add .test.tsx/.test.ts extension)
npm test -- --testNamePattern="test name"  # Run tests matching pattern
```

### Code Quality
- **Linting**: React App ESLint config (extends react-app, react-app/jest)
- **Type Checking**: TypeScript strict mode enabled
- No dedicated lint command; errors caught during build/test

## Code Style Guidelines

### TypeScript & Type Safety
- **Strict mode enabled** in tsconfig.json - all strict checks active
- Use explicit types for function parameters and returns
- Avoid `any` type; use `unknown` with type guards if needed
- Use interfaces for object shapes (prefer over type aliases for exports)
- Use enums or string literals for limited values (e.g., `'safe' | 'hurry' | 'unsafe'`)

### Imports & Module Organization
- Import React and hooks from "react" first
- Group imports: React/external libs → internal types → internal services/components → CSS
- Use absolute imports relative to src/ (no ../../../ patterns)
- Always import types from `./types` for domain models
- Order: named imports first, then default imports

Example:
```typescript
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Location, WeatherData, LocationData } from "./types";
import { WeatherServiceFactory } from "./services/weatherServiceFactory";
import "./App.css";
```

### Component Naming & File Structure
- Components: PascalCase (e.g., `LocationCard.tsx`)
- Services: camelCase with Service suffix (e.g., `willyWeatherService.ts`)
- Utilities/Helpers: camelCase (e.g., `localStorageCache.ts`)
- React components: Export as `React.FC<Props>` for consistency
- Props interfaces: `ComponentNameProps` (e.g., `LocationCardProps`)

### Error Handling Patterns
- **API errors**: Use Axios interceptors (see willyWeatherService.ts)
- **Specific error codes**: Handle 401 (auth), 403 (forbidden), timeouts, network errors
- **User-facing errors**: Always provide meaningful error messages in `state.error`
- **Service methods**: Throw descriptive Error objects, never silent failures
- **Try-catch blocks**: Use in async functions, log errors with context
- **Fallback mechanisms**: Use LocalStorageCache for offline resilience

Example pattern:
```typescript
try {
  const data = await weatherService.getWeatherData(locationId);
  setData(data);
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  setError(`Failed to load weather: ${message}`);
}
```

### State Management
- Use React hooks (`useState`, `useEffect`, `useCallback`, `useContext`)
- Singleton services: Use factory pattern (e.g., `WeatherServiceFactory.getWeatherService()`)
- Avoid prop drilling: Use context for global state if needed
- Memoize callbacks with `useCallback` if passed to child components
- Define state at the highest component that needs it

### Formatting & Conventions
- **Line length**: No hard limit, but keep under 120 chars for readability
- **Semicolons**: Required (TypeScript default)
- **Quotes**: Double quotes for JSX/React, single for JS strings (prettier-like)
- **Indentation**: 2 spaces (React Scripts default)
- **Naming**:
  - Constants: UPPER_SNAKE_CASE (e.g., `QUEENSLAND_TIMEZONE`)
  - Functions: camelCase
  - Types/Interfaces: PascalCase
  - CSS classes: kebab-case

### Data Types & Interfaces
- Define domain models in `./src/types.ts`
- Use discriminated unions for variants: `'safe' | 'hurry' | 'unsafe'` for status
- Include metadata in interfaces (e.g., `DataSourceInfo` for cache tracking)
- Optional fields: Use `?` (e.g., `error?: string`)
- Avoid nested object literals; extract to interfaces

### Services & Factories
- Implement factory pattern for service instantiation (see `weatherServiceFactory.ts`)
- Services should handle caching, retry logic, and error normalization
- Use axios for HTTP with configured timeouts (10s) and interceptors
- Mock implementations for testing (see `mockDataService.ts`)

### Component Patterns
- Functional components only (React 18+)
- Use hooks for lifecycle (useEffect replaces componentDidMount/Will/Did)
- Extract complex logic into custom hooks or services
- Inline handlers for simple cases; extract to useCallback for callbacks
- Always provide loading and error states in UI

### Testing Considerations
- Test files: `*.test.ts` or `*.test.tsx` in same directory or `__tests__/` folder
- Jest + React Testing Library (via React Scripts)
- Mock external services in tests (see mockDataService pattern)
- Test both happy path and error scenarios

## Key Files & Patterns

- **`src/types.ts`**: Central location for all TypeScript interfaces
- **`src/services/`**: Business logic (weather, tides, safety, caching)
- **`src/components/`**: React components
- **`src/App.tsx`**: Main component; orchestrates services and state
- **Cache pattern**: `LocalStorageCache` for offline resilience
- **Safety logic**: `SafetyService` calculates safe windows based on weather/tides

## Common Gotchas

1. **API Key**: Hardcoded in willyWeatherService.ts; don't commit real keys
2. **Timezone**: Queensland uses Australia/Brisbane; date-fns-tz required
3. **Proxy**: Development uses `/v2` proxy; production uses `/api` routes
4. **Cache expiry**: Check `LocalStorageCache` logic; default TTL in milliseconds
5. **Mock mode**: Controlled by `REACT_APP_USE_MOCK_DATA` environment variable

## Environment Variables
```
REACT_APP_USE_MOCK_DATA=true/false  # Toggle mock data (default: false)
NODE_ENV=development/production     # Affects API endpoint routing
```

See `.env.example` for template.
