/**
 * Pitz - A Framework-Agnostic Settings Management Library
 */

// Core types and interfaces
export * from './types';

// Store and state management
export { createSettingsStore } from './store';

// Storage implementations
export { LocalStorageAdapter, MemoryStorageAdapter, IndexedDBStorageAdapter } from './storage';

// Relevance engine and templates
export { RelevanceEngine } from './relevance';
export { RelevanceTemplates } from './templates';

// Builder pattern for configuration
export { SettingsBuilder } from './builder';

// Utilities
export * from './utils';