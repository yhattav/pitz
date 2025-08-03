/**
 * Framework-agnostic settings store using Zustand
 * Can be used with React, Vue, Svelte, or vanilla JavaScript
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { SettingController, SettingsConfig, SettingValue } from './types';
import { throttle } from './utils';

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
  setConfig: (config: SettingsConfig) => void;
  subscribe: (callback: (state: SettingsState) => void) => () => void;
}

export type SettingsStore = SettingsState & SettingsActions;

const createSettingsSlice = (
  set: (
    partial:
      | Partial<SettingsStore>
      | ((state: SettingsStore) => Partial<SettingsStore>),
    replace?: boolean
  ) => void,
  get: () => SettingsStore,
  config: SettingsConfig
) => {
  const initialState: SettingsState = {
    values: {},
    controllers: {},
    config: {},
    isLoading: false,
    error: null,
  };

  // Create throttled setter for performance
  const throttleMs = config.throttleMs || 100;
  const throttledSet = throttle(set, throttleMs);

  return {
    ...initialState,
    
    setValue: async <T extends SettingValue>(key: string, value: T) => {
      const state = get();
      try {
        if (state.config.debug) {
          console.log(`[PITZ] Setting value for ${key}:`, value);
        }

        // Validate with schema if available
        const controller = state.controllers[key];
        if (controller?.schema) {
          try {
            controller.schema.parse(value);
          } catch (error) {
            console.error(`[PITZ] Validation failed for ${key}:`, error);
            throw new Error(`Invalid value for ${key}: ${error}`);
          }
        }

        // Save to storage if configured
        if (state.config.storage) {
          if (state.config.debug) {
            console.log(`[PITZ] Saving to storage: ${key}`);
          }
          await state.config.storage.set(key, value);
        }

        // Update state
        throttledSet((state) => ({
          values: { ...state.values, [key]: value },
          error: null,
        }));
      } catch (error) {
        console.error(`[PITZ] Error setting value for ${key}:`, error);
        set({
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
        throw error;
      }
    },

    setValues: async (updates: Record<string, SettingValue>) => {
      const state = get();
      try {
        if (state.config.debug) {
          console.log('[PITZ] Setting multiple values:', Object.keys(updates));
        }

        // Validate all values first
        for (const [key, value] of Object.entries(updates)) {
          const controller = state.controllers[key];
          if (controller?.schema) {
            try {
              controller.schema.parse(value);
            } catch (error) {
              throw new Error(`Invalid value for ${key}: ${error}`);
            }
          }
        }

        // Save to storage if configured
        if (state.config.storage) {
          if (state.config.debug) {
            console.log('[PITZ] Saving multiple values to storage');
          }
          await Promise.all(
            Object.entries(updates).map(([key, value]) =>
              state.config.storage!.set(key, value)
            )
          );
        }

        // Update state
        throttledSet((state) => ({
          values: { ...state.values, ...updates },
          error: null,
        }));
      } catch (error) {
        console.error('[PITZ] Error setting multiple values:', error);
        set({
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
        throw error;
      }
    },

    resetToDefault: async (key: string) => {
      const state = get();
      const controller = state.controllers[key];
      if (!controller) {
        console.warn(`[PITZ] No controller found for key: ${key}`);
        return;
      }

      try {
        const defaultValue = controller.defaultValue;
        if (state.config.debug) {
          console.log(`[PITZ] Resetting ${key} to default:`, defaultValue);
        }

        if (state.config.storage) {
          await state.config.storage.set(key, defaultValue);
        }

        throttledSet((state) => ({
          values: { ...state.values, [key]: defaultValue },
          error: null,
        }));
      } catch (error) {
        console.error(`[PITZ] Error resetting value for ${key}:`, error);
        set({
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
        throw error;
      }
    },

    resetAllToDefaults: async () => {
      const state = get();
      const defaultValues = Object.entries(state.controllers).reduce<
        Record<string, SettingValue>
      >(
        (acc, [key, controller]) => ({
          ...acc,
          [key]: controller.defaultValue,
        }),
        {}
      );

      try {
        if (state.config.debug) {
          console.log('[PITZ] Resetting all values to defaults');
        }

        if (state.config.storage) {
          await Promise.all(
            Object.entries(defaultValues).map(([key, value]) =>
              state.config.storage!.set(key, value)
            )
          );
        }

        throttledSet(() => ({
          values: defaultValues,
          error: null,
        }));
      } catch (error) {
        console.error('[PITZ] Error resetting all values:', error);
        set({
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
        throw error;
      }
    },

    registerController: (controller: SettingController) => {
      if (get().config.debug) {
        console.log(`[PITZ] Registering controller: ${controller.key}`);
      }
      set((state) => ({
        controllers: {
          ...state.controllers,
          [controller.key]: controller,
        },
      }));
    },

    unregisterController: (key: string) => {
      if (get().config.debug) {
        console.log(`[PITZ] Unregistering controller: ${key}`);
      }
      set((state) => ({
        controllers: Object.fromEntries(
          Object.entries(state.controllers).filter(([k]) => k !== key)
        ),
      }));
    },

    setConfig: (config: SettingsConfig) => {
      if (config.debug) {
        console.log('[PITZ] Updating store config');
      }
      set((state) => ({
        ...state,
        config: { ...state.config, ...config },
      }));
    },

    subscribe: (callback: (state: SettingsState) => void) => {
      // For framework-agnostic usage
      return get().subscribe(callback);
    },
  };
};

export const createSettingsStore = (config: SettingsConfig = {}) =>
  create<SettingsStore>()(
    subscribeWithSelector(
      devtools(
        (set, get) => ({
                  ...createSettingsSlice(
          set as (
            partial:
              | Partial<SettingsStore>
              | ((state: SettingsStore) => Partial<SettingsStore>),
            replace?: boolean
          ) => void,
          get,
          config
        ),
          config,
        }),
        {
          name: 'pitz-settings',
        }
      )
    )
  );

// Export a default store instance for simple usage
export const defaultSettingsStore = createSettingsStore();