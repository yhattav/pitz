import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useStore } from "zustand";
import { createSettingsStore } from "./store";
import type { SettingController, SettingsConfig, SettingValue } from "./types";

// Create the settings store instance
const settingsStore = createSettingsStore();
export { settingsStore }; // Export the store instance

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

const SettingsContext = createContext<SettingsContextValue | null>(null);

interface SettingsProviderProps {
  children: React.ReactNode;
  config?: SettingsConfig;
  controllers?: SettingController[];
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
  config = {},
  controllers = [],
}) => {
  // Update store's config whenever it changes
  useEffect(() => {
    console.log(
      "[SETTINGS] Updating store config with storage:",
      !!config.storage
    );
    settingsStore.setState((state) => ({
      ...state,
      config,
    }));
  }, [config]);

  // Register controllers and initialize values
  useEffect(() => {
    const initializeSettings = async () => {
      console.log("[SETTINGS] Starting initialization");

      // Register all controllers first
      controllers.forEach((controller) => {
        console.log(`[SETTINGS] Registering controller: ${controller.key}`);
        settingsStore.getState().registerController(controller);
      });

      // If we have storage, try to load values
      if (config.storage) {
        const storedValues: Record<string, SettingValue> = {};
        const defaultValues: Record<string, SettingValue> = {};

        // Collect stored values and defaults
        for (const controller of controllers) {
          const storedValue = await config.storage.get(controller.key);
          console.log(`[SETTINGS] Loading value for ${controller.key}:`, {
            stored: storedValue,
            default: controller.defaultValue,
          });

          // Only use stored value if it's not null/undefined
          if (storedValue !== null && storedValue !== undefined) {
            storedValues[controller.key] = storedValue as SettingValue;
          }
          defaultValues[controller.key] = controller.defaultValue;
        }

        // Set initial values, preferring valid stored values over defaults
        const finalValues = {
          ...defaultValues, // Start with all defaults
          ...Object.fromEntries(
            // Override with valid stored values
            Object.entries(storedValues).filter(
              ([, value]) => value !== null && value !== undefined
            )
          ),
        } as Record<string, SettingValue>;

        // Validate that we have no null/undefined values
        const hasNullValues = Object.entries(finalValues).some(
          ([, value]) => value === null || value === undefined
        );

        if (hasNullValues) {
          console.error(
            "[SETTINGS] Found null/undefined values in final values:",
            Object.entries(finalValues)
              .filter(([, v]) => v === null || v === undefined)
              .map(([k]) => k)
          );
        }

        console.log("[SETTINGS] Final values to be set:", finalValues);
        await settingsStore.getState().setValues(finalValues);

        // Save back any values that were restored from defaults
        for (const [key, value] of Object.entries(finalValues)) {
          if (!storedValues[key] && value !== null && value !== undefined) {
            console.log(`[SETTINGS] Saving default value for ${key}:`, value);
            await config.storage.set(key, value as SettingValue);
          }
        }
      } else {
        // No storage, just use defaults
        const defaultValues = controllers.reduce<Record<string, SettingValue>>(
          (acc, controller) => {
            acc[controller.key] = controller.defaultValue;
            return acc;
          },
          {}
        );
        console.log("[SETTINGS] No storage, using defaults:", defaultValues);
        await settingsStore.getState().setValues(defaultValues);
      }
    };

    initializeSettings().catch((error) => {
      console.error("[SETTINGS] Error during initialization:", error);
    });

    return () => {
      console.log("[SETTINGS] Cleaning up controllers");
      controllers.forEach((controller) => {
        settingsStore.getState().unregisterController(controller.key);
      });
    };
  }, [controllers, config.storage]);

  const contextValue = useMemo<SettingsContextValue>(
    () => ({
      getValue: <T extends SettingValue>(key: string) =>
        settingsStore.getState().values[key] as T | undefined,
      setValue: settingsStore.getState().setValue,
      setValues: settingsStore.getState().setValues,
      resetToDefault: settingsStore.getState().resetToDefault,
      resetAllToDefaults: settingsStore.getState().resetAllToDefaults,
      registerController: settingsStore.getState().registerController,
      unregisterController: settingsStore.getState().unregisterController,
      isLoading: settingsStore.getState().isLoading,
      error: settingsStore.getState().error,
    }),
    []
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
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
