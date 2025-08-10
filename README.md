# Pitz

A framework-agnostic settings management library with TypeScript support, built with Vite and tested with Vitest.

## Features

- 🚀 **Framework-agnostic** - Works with React, Vue, Svelte, or vanilla JavaScript
- 🔧 **Type-safe** - Full TypeScript support with Zod validation
- 📝 **Builder Pattern** - Fluent API for easy configuration
- 🎯 **Conditional Logic** - Settings can depend on other settings with relevance functions
- 💾 **Multiple Storage Options** - Memory, LocalStorage, IndexedDB adapters
- ⚡ **Performance Optimized** - Throttled updates and selective subscriptions
- 🧪 **Thoroughly Tested** - Comprehensive test suite with Vitest
- 📦 **Multiple Formats** - ESM and UMD builds for different environments

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

## Quick Start

```typescript
import { z } from 'zod';
import { 
  SettingsBuilder, 
  createSettingsStore, 
  MemoryStorageAdapter,
  RelevanceTemplates 
} from 'pitz';

// 1. Define your settings configuration (builder with object params)
const config = new SettingsBuilder()
  .setting('graphics.quality')
    .select({
      title: 'Graphics Quality',
      description: 'Set the graphics quality level',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'High', value: 'high' }
      ],
      category: 'Graphics'
    })
    .defaultValue('high')
  .setting('audio.enabled')
    .toggle({ title: 'Audio Enabled', description: 'Enable all audio', category: 'Audio' })
    .defaultValue(true)
  .setting('audio.volume')
    .slider({ title: 'Volume', description: 'Audio volume', min: 0, max: 100, step: 1, unit: '%', category: 'Audio' })
    .defaultValue(50)
    .dependsOn(RelevanceTemplates.dependsOn('audio.enabled'))
  .setting('user.name')
    .input({ title: 'Player Name', description: 'Your display name', category: 'User' })
    .defaultValue('Player')
    .schema(z.string().min(1).max(20))
  .tab('graphics', 'Graphics', '🎨')
    .group('Settings')
      .settings(['graphics.quality'])
  .tab('audio', 'Audio', '🔊')
    .group('General')
      .settings(['audio.enabled', 'audio.volume'])
  .tab('user', 'User', '👤')
    .group('Profile')
      .settings(['user.name'])
  .buildWithValidation();

// 2. Create store with storage
const store = createSettingsStore({
  storage: new MemoryStorageAdapter(),
  debug: true
});

// 3. Register settings and initialize
for (const definition of config.definitions) {
  store.getState().registerController({
    ...definition,
    title: definition.ui?.title || definition.key,
    description: definition.ui?.description || '',
    category: definition.ui?.category
  });
}

// Set defaults
const defaults = config.definitions.reduce((acc, def) => {
  acc[def.key] = def.defaultValue;
  return acc;
}, {});
await store.getState().setValues(defaults);

// 4. Use the settings
await store.getState().setValue('graphics.quality', 'low');
await store.getState().setValue('user.name', 'John');

console.log(store.getState().values);
// { graphics.quality: 'low', audio.enabled: true, audio.volume: 50, user.name: 'John' }
```

## Core Concepts

### Settings Definitions
Define your settings with type safety and validation:

```typescript
.setting('myKey')
  .toggle('My Toggle', 'Description', 'Category')  // Boolean setting
  .slider('My Slider', 'Description', 0, 100)      // Number setting with range
  .select('My Select', 'Description', options)     // Enum setting
  .input('My Input', 'Description')                // String setting
  .color('My Color', 'Description')                // Color setting
  .defaultValue(true)
  .schema(z.boolean())                             // Zod validation
```

### Conditional Logic
Settings can depend on other settings:

```typescript
.setting('advanced.setting')
  .dependsOn(RelevanceTemplates.dependsOn('feature.enabled'))  // Show only if feature.enabled is true
  .dependsOn(RelevanceTemplates.equals('mode', 'advanced'))    // Show only if mode equals 'advanced'
  .dependsOn(RelevanceTemplates.allOf(                        // Multiple conditions
    RelevanceTemplates.dependsOn('feature.enabled'),
    RelevanceTemplates.greaterThan('level', 5)
  ))
```

### Storage Adapters
Choose your storage backend:

```typescript
// In-memory (for testing)
new MemoryStorageAdapter()

// Browser localStorage
new LocalStorageAdapter({ prefix: 'myapp:' })

// IndexedDB for larger data
new IndexedDBStorageAdapter({ dbName: 'myapp-settings' })

// Custom storage
class CustomAdapter implements SettingsStorage {
  async get(key: string) { /* ... */ }
  async set(key: string, value: any) { /* ... */ }
  // ...
}
```

## Object-First Authoring (Alternative to Builder)

You can author settings without the builder by creating controllers directly and passing them to your app’s integration:

```ts
const controllers = [
  { key: 'ui.theme', type: 'enum', defaultValue: 'dark',
    ui: { title: 'Theme', description: 'Choose theme', category: 'UI', controlType: 'select',
      controlProps: { options: [{ label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }] },
      i18nKey: 'settings.ui.theme' } },
  { key: 'ui.scale', type: 'number', defaultValue: 1,
    ui: { title: 'Scale', description: 'UI scale', category: 'UI', controlType: 'slider',
      controlProps: { min: 0.5, max: 2, step: 0.1 }, hint: 'Try 1.25' } },
];
```

Custom keys are allowed on controllers and ui (e.g., i18nKey, hint) for app-specific needs.

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