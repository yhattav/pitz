import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { SettingController, SettingsConfig, SettingValue } from "./types";
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

type SettingsStore = SettingsState & SettingsActions;

const createSettingsSlice = (
  set: (
    partial:
      | Partial<SettingsStore>
      | ((state: SettingsStore) => Partial<SettingsStore>),
    replace?: boolean
  ) => void,
  get: () => SettingsStore
) => {
  const initialState: SettingsState = {
    values: {},
    controllers: {},
    config: {},
    isLoading: false,
    error: null,
  };

  const throttledSet = throttle(set, 100);

  return {
    ...initialState,
    setValue: async <T extends SettingValue>(key: string, value: T) => {
      const state = get();
      try {
        console.log(`[STORE] Setting value for ${key}:`, value);
        if (state.config.storage) {
          console.log(`[STORE] Saving to storage: ${key}`);
          await state.config.storage.set(key, value);
        }
        throttledSet((state) => ({
          values: { ...state.values, [key]: value },
          error: null,
        }));
      } catch (error) {
        console.error(`[STORE] Error setting value for ${key}:`, error);
        set({
          error: error instanceof Error ? error : new Error("Unknown error"),
        });
        throw error;
      }
    },
    setValues: async (updates: Record<string, SettingValue>) => {
      const state = get();
      try {
        console.log("[STORE] Setting multiple values:", Object.keys(updates));
        if (state.config.storage) {
          console.log("[STORE] Saving multiple values to storage");
          await Promise.all(
            Object.entries(updates).map(([key, value]) =>
              state.config.storage!.set(key, value)
            )
          );
        }
        throttledSet((state) => ({
          values: { ...state.values, ...updates },
          error: null,
        }));
      } catch (error) {
        console.error("[STORE] Error setting multiple values:", error);
        set({
          error: error instanceof Error ? error : new Error("Unknown error"),
        });
        throw error;
      }
    },
    resetToDefault: async (key: string) => {
      const state = get();
      const controller = state.controllers[key];
      if (!controller) {
        console.warn(`[STORE] No controller found for key: ${key}`);
        return;
      }

      try {
        const defaultValue = controller.defaultValue;
        console.log(`[STORE] Resetting ${key} to default:`, defaultValue);
        if (state.config.storage) {
          console.log(`[STORE] Saving default value to storage: ${key}`);
          await state.config.storage.set(key, defaultValue);
        }
        throttledSet((state) => ({
          values: { ...state.values, [key]: defaultValue },
          error: null,
        }));
      } catch (error) {
        console.error(`[STORE] Error resetting value for ${key}:`, error);
        set({
          error: error instanceof Error ? error : new Error("Unknown error"),
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
        console.log("[STORE] Resetting all values to defaults");
        if (state.config.storage) {
          console.log("[STORE] Saving all default values to storage");
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
        console.error("[STORE] Error resetting all values:", error);
        set({
          error: error instanceof Error ? error : new Error("Unknown error"),
        });
        throw error;
      }
    },
    registerController: (controller: SettingController) => {
      set((state) => ({
        controllers: {
          ...state.controllers,
          [controller.key]: controller,
        },
      }));
    },
    unregisterController: (key: string) => {
      set((state) => ({
        controllers: Object.fromEntries(
          Object.entries(state.controllers).filter(([k]) => k !== key)
        ),
      }));
    },
  };
};

export const createSettingsStore = (config: SettingsConfig = {}) =>
  create<SettingsStore>()(
    subscribeWithSelector(
      devtools((set, get) => ({
        ...createSettingsSlice(
          set as (
            partial:
              | Partial<SettingsStore>
              | ((state: SettingsStore) => Partial<SettingsStore>),
            replace?: boolean
          ) => void,
          get
        ),
        config,
      }))
    )
  );
