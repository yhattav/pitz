# Settings System Library Extraction Context

## Overview
This document contains all the essential code and structure from the star-sim project needed to create a reusable settings library.

## Core Types (from src/lib/settings/types.ts)

```typescript
export interface CoreSettingDefinition {
  key: string;
  type: "number" | "boolean" | "string" | "enum";
  defaultValue: any;
  schema?: z.ZodSchema;
}

export interface SettingUIConfig {
  title: string;
  description: string;
  category: string;
  controlType: "slider" | "toggle" | "select" | "input" | "color";
  controlProps?: {
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    options?: { label: string; value: string }[];
    showHex?: boolean;
  };
  isDev?: boolean;
  isAdvanced?: boolean;
}

export interface SettingStructureItem {
  key: string;
  overrides?: Partial<SettingUIConfig>;
  isRelevant?: (settings: Record<string, any>) => boolean;
}

export interface SettingsGroup {
  title: string;
  description?: string;
  settings: SettingStructureItem[];
}

export interface SettingsTab {
  id: string;
  label: string;
  icon: string;
  groups: SettingsGroup[];
}

export interface SettingsUIStructure {
  tabs: SettingsTab[];
}

export interface SettingController extends CoreSettingDefinition {
  title: string;
  description: string;
  category: string;
  isDev?: boolean;
  isAdvanced?: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { label: string; value: string }[];
}
```

## Example Settings Definitions

```typescript
// From core-settings.ts - Visual Settings Example
const visualSettings: CoreSettingDefinition[] = [
  {
    key: "visual.particleCloud.enabled",
    type: "boolean",
    defaultValue: true,
  },
  {
    key: "visual.particleCloud.intensity",
    type: "number",
    defaultValue: 50,
    schema: z.number().min(0).max(200),
  },
  {
    key: "visual.sky.topColor",
    type: "string",
    defaultValue: "#0077ff",
    schema: z.string().regex(/^#[0-9a-f]{6}$/i),
  }
];

// From settings-ui-map.ts - UI Configuration Example
const settingsUIMap = {
  "visual.particleCloud.enabled": {
    title: "Show Speed Particles",
    description: "Show particles around the projectile to visualize its speed",
    category: "Visualization",
    controlType: "toggle",
  },
  "visual.particleCloud.intensity": {
    title: "Particle Intensity",
    description: "Number of particles to show around the projectile",
    category: "Visualization",
    controlType: "slider",
    controlProps: {
      min: 0,
      max: 200,
      step: 1,
    },
  },
  "visual.sky.topColor": {
    title: "Sky Color",
    description: "Color of the sky at the top",
    category: "Sky",
    controlType: "color",
    controlProps: {
      showHex: true,
    },
    isDev: true,
  }
};
```

## Settings Structure Example

```typescript
// From settings-ui-structure.ts
const defaultSettingsStructure: SettingsUIStructure = {
  tabs: [
    {
      id: "graphics",
      label: "Graphics",
      icon: "FaPalette",
      groups: [
        {
          title: "Visual Effects",
          settings: [
            { key: "visual.particleCloud.enabled" },
            {
              key: "visual.particleCloud.intensity",
              isRelevant: (settings) => settings["visual.particleCloud.enabled"],
            },
          ],
        },
        {
          title: "Sky & Atmosphere",
          description: "Control the appearance of the sky and atmospheric effects",
          settings: [
            { key: "visual.sky.topColor" },
          ],
        },
      ],
    },
  ],
};
```

## Key Components Structure

### SettingsPanel Component (Simplified)
```typescript
interface SettingsPanelProps {
  structure?: SettingsUIStructure;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  structure = defaultSettingsStructure,
}) => {
  const { getValue, setValue } = useSettings();
  const [activeTab, setActiveTab] = useState(structure.tabs[0]?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Core logic for rendering tabs, groups, and individual settings
  // Controls include: SliderControl, ToggleControl, SelectControl, ColorControl
};
```

### Settings Hook
```typescript
// Core settings management hook
export function useSettings() {
  const getValue = (key: string) => { /* implementation */ };
  const setValue = (key: string, value: any) => { /* implementation */ };
  const resetToDefaults = () => { /* implementation */ };
  
  return { getValue, setValue, resetToDefaults };
}
```

## Control Components

### SliderControl
```typescript
interface SliderControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}
```

### ToggleControl
```typescript
interface ToggleControlProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}
```

### SelectControl
```typescript
interface SelectControlProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}
```

## Key Features to Extract

1. **Type Safety**: Full TypeScript support with Zod validation
2. **Flexible UI**: Multiple control types with customizable props
3. **Hierarchical Organization**: Tabs → Groups → Settings
4. **Conditional Logic**: Settings can be shown/hidden based on other settings
5. **Search & Filtering**: Built-in search and dev/advanced mode filtering
6. **Persistence**: localStorage integration for saving settings
7. **Validation**: Real-time validation with error handling
8. **Theming**: Support for light/dark themes

## Library API Design Goals

```typescript
// Desired usage in consuming applications
import { SettingsPanel, defineSettings, createStructure } from 'react-settings-panel';

const settings = defineSettings([
  {
    key: "graphics.quality",
    type: "enum",
    defaultValue: "high",
    validation: z.enum(["low", "medium", "high"]),
    ui: {
      title: "Graphics Quality",
      category: "Graphics",
      control: { type: "select", options: [...] }
    }
  }
]);

const structure = createStructure({
  tabs: [...]
});

function App() {
  return (
    <SettingsPanel 
      definitions={settings}
      structure={structure}
      storageKey="my-app-settings"
    />
  );
}
```

## Dependencies to Include
- React 16.8+ (hooks)
- Zod for validation
- Lucide React for icons (or make icons configurable)

## File Structure for Library
```
src/
├── index.ts                 # Main exports
├── types/                   # All TypeScript definitions
├── components/
│   ├── SettingsPanel.tsx
│   ├── controls/            # Individual control components
│   └── ui/                  # Reusable UI components
├── hooks/
│   ├── useSettings.ts
│   └── useSettingsStorage.ts
├── utils/
│   ├── validation.ts
│   └── storage.ts
└── styles/                  # Optional CSS modules
```

## Real Implementation Details

### Actual Types (from src/lib/settings/types.ts)

```typescript
import { z } from "zod";

export type SettingValueType =
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "object"
  | "array";

export type SettingValue = string | number | boolean;

export interface CoreSettingDefinition<T extends SettingValue = SettingValue> {
  key: string;
  type: SettingValueType;
  defaultValue: T;
  schema?: z.ZodType<T>;
  isRelevant?: (settings: Record<string, SettingValue>) => boolean;
  version?: string;
}

export interface SettingUIConfig {
  key: string;
  title: string;
  description: string;
  category: string;
  tab?: string;
  order?: number;
  isDev?: boolean;
  isAdvanced?: boolean;
  controlType?: "slider" | "toggle" | "select" | "input" | "color";
  controlProps?: {
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    options?: { label: string; value: string }[];
    showAlpha?: boolean;
    showHex?: boolean;
    showRGB?: boolean;
    showHSL?: boolean;
  };
}

export interface SettingsStorage {
  get: <T extends SettingValue>(key: string) => Promise<T | null>;
  set: <T extends SettingValue>(key: string, value: T) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

export interface SettingsConfig {
  storage?: SettingsStorage;
  encryptionKey?: string;
  defaultValues?: Record<string, SettingValue>;
  debug?: boolean;
  throttleMs?: number;
}

export interface SettingsUIMap {
  [key: string]: Omit<SettingUIConfig, "key">;
}

export interface SettingStructureItem {
  key: string;
  order?: number;
  overrides?: Partial<Omit<SettingUIConfig, "key">>;
  isRelevant?: (settings: Record<string, string | number | boolean>) => boolean;
}
```

### Settings Context Implementation (from src/lib/settings/context.tsx)

```typescript
import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useStore } from "zustand";
import { createSettingsStore } from "./store";

interface SettingsContextValue {
  getValue: <T extends SettingValue>(key: string) => T | undefined;
  setValue: <T extends SettingValue>(key: string, value: T) => Promise<void>;
  setValues: (updates: Record<string, SettingValue>) => Promise<void>;
  resetToDefault: (key: string) => Promise<void>;
  resetAllToDefaults: () => Promise<void>;
  registerController: (controller: SettingController) => void;
  unregisterController: (key: string) => void;
  isLoading: boolean;
  error: Error | null;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
  config = {},
  controllers = [],
}) => {
  // Implementation includes:
  // - Store config updates
  // - Controller registration 
  // - Storage loading/saving
  // - Default value handling
  // - Error handling
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export const useSettingValue = <T,>(key: string): T | undefined => {
  return useStore(settingsStore, (state) => state.values[key] as T);
};

export const useIsSettingRelevant = (key: string): boolean => {
  const store = useStore(settingsStore);
  const controller = store.controllers[key];
  const values = store.values;

  if (!controller) return true;
  if (!controller.isRelevant) return true;

  return controller.isRelevant(values);
};
```

### Zustand Store Implementation (from src/lib/settings/store.ts)

```typescript
import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { throttle } from "lodash-es";

interface SettingsState {
  values: Record<string, SettingValue>;
  controllers: Record<string, SettingController>;
  config: SettingsConfig;
  isLoading: boolean;
  error: Error | null;
}

interface SettingsActions {
  setValue: <T extends SettingValue>(key: string, value: T) => Promise<void>;
  setValues: (updates: Record<string, SettingValue>) => Promise<void>;
  resetToDefault: (key: string) => Promise<void>;
  resetAllToDefaults: () => Promise<void>;
  registerController: (controller: SettingController) => void;
  unregisterController: (key: string) => void;
}

export const createSettingsStore = (config: SettingsConfig = {}) =>
  create<SettingsStore>()(
    subscribeWithSelector(
      devtools((set, get) => ({
        // Store implementation with:
        // - Throttled updates for performance
        // - Async storage integration
        // - Error handling
        // - Controller registration
        // - Value validation
      }))
    )
  );
```

### Key Implementation Features

1. **State Management**: 
   - Zustand store with devtools support
   - Throttled updates to prevent excessive re-renders
   - Selective subscriptions for performance

2. **Storage Integration**: 
   - Async storage interface for persistence
   - Automatic save/load from storage
   - Graceful fallback to defaults

3. **Validation**: 
   - Zod schemas for runtime validation
   - Type-safe value handling
   - Error reporting for invalid values

4. **Conditional Logic**: 
   - `isRelevant` functions for dynamic UI
   - Settings can depend on other settings
   - Real-time relevance checking

5. **Error Handling**: 
   - Graceful fallbacks and error reporting
   - Console logging for debugging
   - Non-blocking error recovery

6. **Performance**: 
   - Minimal re-renders with selective subscriptions
   - Throttled storage writes
   - Optimized state updates

### Control Components Pattern

Each control follows this pattern:
```typescript
interface ControlProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  // Control-specific props
}

export const SliderControl: React.FC<SliderControlProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  disabled = false,
}) => {
  return (
    <div className="control-container">
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      <span>{value}{unit}</span>
    </div>
  );
};
```

## Framework Agnostic Architecture Strategy

### Two-Package Approach

#### Package 1: `settings-ts` (Core - Framework Agnostic)
```
src/
├── types.ts              ✅ Pure TypeScript interfaces
├── store.ts              ✅ Zustand (works with React, Vue, Svelte, vanilla JS)
├── storage.ts            ✅ Pure JavaScript + localStorage
├── relevance.ts          ✅ Pure functions for isRelevant evaluation
├── templates.ts          ✅ Reusable relevance patterns
├── builders.ts           ✅ Configuration builder pattern
└── index.ts              ✅ Framework-agnostic exports only
```

#### Package 2: `react-settings` (React Bindings)
```
src/
├── context.tsx           ❌ React Context, hooks, JSX
├── components/
│   ├── SettingsPanel.tsx ❌ React components
│   └── controls/         ❌ React control components
├── hooks/
│   └── useRelevance.ts   ❌ React hooks for relevance
└── index.ts              ❌ React-specific exports
```

### Framework Agnostic Core Implementation

#### Relevance Engine (Pure Functions)
```typescript
// relevance.ts - Goes in settings-ts core
export class RelevanceEngine {
  static evaluate(
    settingKey: string, 
    structure: SettingStructure,
    definitions: SettingDefinition[],
    currentValues: Record<string, any>
  ): boolean {
    // Check definition-level relevance
    const definition = definitions.find(d => d.key === settingKey);
    if (definition?.isRelevant && !definition.isRelevant(currentValues)) {
      return false;
    }
    
    // Check structure-level relevance  
    const structureItem = this.findInStructure(settingKey, structure);
    if (structureItem?.isRelevant && !structureItem.isRelevant(currentValues)) {
      return false;
    }
    
    return true;
  }
  
  static getVisibleSettings(
    structure: SettingStructure,
    definitions: SettingDefinition[],
    currentValues: Record<string, any>
  ): string[] {
    // Return all visible setting keys based on relevance
    const allKeys = this.extractAllKeys(structure);
    return allKeys.filter(key => 
      this.evaluate(key, structure, definitions, currentValues)
    );
  }
}
```

#### Relevance Templates (Framework Agnostic)
```typescript
// templates.ts - Goes in settings-ts core
export const RelevanceTemplates = {
  // Common patterns from your codebase
  dependsOn: (parentKey: string) => 
    (settings: Record<string, any>) => !!settings[parentKey],
    
  equals: (key: string, value: any) =>
    (settings: Record<string, any>) => settings[key] === value,
    
  // From your projectile settings
  isGuided: () => 
    (settings: Record<string, any>) => settings["projectile.type"] === "guided",
    
  // From your post-processing settings  
  postProcessingEnabled: () =>
    (settings: Record<string, any>) => settings["graphics.postProcessing.enabled"],
    
  bloomEnabled: () =>
    (settings: Record<string, any>) => 
      settings["graphics.postProcessing.enabled"] &&
      settings["graphics.postProcessing.bloom.enabled"],
    
  // Combinators
  allOf: (...conditions: Array<(settings: Record<string, any>) => boolean>) =>
    (settings: Record<string, any>) => conditions.every(fn => fn(settings)),
    
  anyOf: (...conditions: Array<(settings: Record<string, any>) => boolean>) =>
    (settings: Record<string, any>) => conditions.some(fn => fn(settings)),
};
```

#### Configuration Builder Pattern
```typescript
// builders.ts - Goes in settings-ts core
export class SettingsBuilder {
  private definitions: SettingDefinition[] = [];
  private structure: SettingStructure = { tabs: [] };
  
  setting(key: string) {
    return new SettingBuilder(key, this);
  }
  
  tab(id: string, label: string) {
    return new TabBuilder(id, label, this);
  }
  
  build() {
    return {
      definitions: this.definitions,
      structure: this.structure
    };
  }
}

class SettingBuilder {
  constructor(private key: string, private parent: SettingsBuilder) {}
  
  type(type: SettingValueType) {
    // Implementation
    return this;
  }
  
  defaultValue(value: any) {
    // Implementation  
    return this;
  }
  
  dependsOn(relevanceFn: (settings: Record<string, any>) => boolean) {
    // Add isRelevant function
    return this;
  }
  
  // Return to parent builder
  setting(key: string) {
    return this.parent.setting(key);
  }
  
  tab(id: string, label: string) {
    return this.parent.tab(id, label);
  }
}
```

### User Configuration Examples

#### Your Current Pattern (Extracted)
```typescript
// User creates this - framework agnostic configuration
const projectileSettings = new SettingsBuilder()
  .setting("projectile.type")
    .type("enum")
    .defaultValue("guided")
    .options(["passive", "guided"])
    
  .setting("projectile.seeker.turnSpeed")
    .type("number")
    .defaultValue(100)
    .range(0, 360)
    .dependsOn(RelevanceTemplates.equals("projectile.type", "guided"))
    
  .setting("projectile.seeker.maxSeekAngle")
    .type("number") 
    .defaultValue(120)
    .range(0, 180)
    .dependsOn(RelevanceTemplates.equals("projectile.type", "guided"))
    
  .tab("projectile", "Projectile")
    .group("Control")
      .settings(["projectile.type"])
    .group("Seeker", "Settings for guided projectiles only")
      .settings([
        "projectile.seeker.turnSpeed",
        "projectile.seeker.maxSeekAngle" 
      ])
      
  .build();
```

#### Graphics Settings Example  
```typescript
const graphicsSettings = new SettingsBuilder()
  .setting("graphics.postProcessing.enabled")
    .type("boolean")
    .defaultValue(true)
    
  .setting("graphics.postProcessing.bloom.enabled")
    .type("boolean")
    .defaultValue(true)
    .dependsOn(RelevanceTemplates.postProcessingEnabled())
    
  .setting("graphics.postProcessing.bloom.intensity")
    .type("number")
    .defaultValue(1.5)
    .range(0, 5)
    .dependsOn(RelevanceTemplates.bloomEnabled())
    
  .tab("graphics", "Graphics")
    .group("Post-Processing")
      .settings([
        "graphics.postProcessing.enabled",
        "graphics.postProcessing.bloom.enabled", 
        "graphics.postProcessing.bloom.intensity"
      ])
      
  .build();
```

### Framework Binding Examples

#### React Hook (react-settings package)
```typescript
// useRelevance.ts - React-specific
export const useIsRelevant = (settingKey: string): boolean => {
  const currentValues = useStore(settingsStore, s => s.values);
  const definitions = useStore(settingsStore, s => s.definitions);
  const structure = useStore(settingsStore, s => s.structure);
  
  return useMemo(() => 
    RelevanceEngine.evaluate(settingKey, structure, definitions, currentValues),
    [settingKey, structure, definitions, currentValues]
  );
};
```

#### Vue Composable (vue-settings package)
```typescript
// useRelevance.ts - Vue-specific
export const useIsRelevant = (settingKey: string) => {
  const { values, definitions, structure } = useSettingsStore();
  
  return computed(() => 
    RelevanceEngine.evaluate(
      settingKey, 
      structure.value, 
      definitions.value, 
      values.value
    )
  );
};
```

#### Svelte Store (svelte-settings package)
```typescript
// relevance.ts - Svelte-specific
export const createRelevanceStore = (settingsStore) => {
  return derived(
    [settingsStore],
    ([$settings]) => (settingKey: string) => 
      RelevanceEngine.evaluate(
        settingKey, 
        $settings.structure, 
        $settings.definitions, 
        $settings.values
      )
  );
};
```

### Key Architectural Decisions

1. **isRelevant functions are pure** - They go in the core package
2. **Structure definitions are data** - Framework agnostic JSON-like objects
3. **Relevance evaluation is pure logic** - Separate from UI reactivity
4. **Templates provide reusable patterns** - Common use cases pre-built
5. **Builder pattern for configuration** - Type-safe, fluent API
6. **Framework bindings handle reactivity** - Hooks, composables, stores
7. **Clean export separation** - Core exports no React/Vue/Svelte code

### Migration Strategy
1. Extract core types and relevance engine first
2. Create settings-ts package with builder pattern
3. Test with vanilla JS examples
4. Create react-settings package using the core
5. Migrate existing settings one category at a time
6. Full migration once both packages are stable 