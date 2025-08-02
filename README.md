# Pitz

A TypeScript library built with Vite and tested with Vitest.

## Features

- 🚀 Built with Vite for fast development and building
- 🧪 Tested with Vitest for comprehensive testing
- 📦 TypeScript support with full type definitions
- 🌐 Framework agnostic - works with any JavaScript framework
- 📋 ESLint configuration for code quality
- 🔧 Multiple output formats (ESM, UMD)

## Development

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm

### Installation

```bash
npm install
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build the library for production
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run typecheck` - Check TypeScript types
- `npm run lint` - Lint the code
- `npm run lint:fix` - Lint and fix issues

### Project Structure

```
pitz/
├── src/
│   ├── index.ts          # Main entry point
│   └── utils/
│       └── index.ts      # Utility functions
├── tests/
│   ├── index.test.ts     # Tests for main functions
│   └── utils.test.ts     # Tests for utility functions
├── dist/                 # Built files (generated)
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project configuration
```

## Usage

After building the library, you can import and use it:

```typescript
import { greet, add, utils } from 'pitz';

// Basic functions
console.log(greet('World')); // "Hello, World!"
console.log(add(2, 3)); // 5

// Utility functions
console.log(utils.isEmpty('')); // true
console.log(utils.capitalize('hello')); // "Hello"
```

## Building

The library is built using Vite and outputs:

- `dist/index.es.js` - ES module format
- `dist/index.umd.js` - UMD format for browser use
- `dist/index.d.ts` - TypeScript type definitions

## Testing

Tests are written using Vitest and can be found in the `tests/` directory. Run tests with:

```bash
npm test
```

## License

MIT