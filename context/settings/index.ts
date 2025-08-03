// Core exports
export * from "./types";
export { createSettingsStore } from "./store";
export { LocalStorageAdapter } from "./storage";

// React bindings
export {
  SettingsProvider,
  useSettings,
  useSettingValue,
  useIsSettingRelevant,
} from "./context";

// Re-export commonly used types
export type {
  SettingController,
  SettingsStorage,
  SettingsConfig,
  SettingValueType,
} from "./types";
