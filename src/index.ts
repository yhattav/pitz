/**
 * Pitz - A TypeScript Library
 */

export { default as utils } from './utils';

// Example function - replace with your actual library code
export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export function add(a: number, b: number): number {
  return a + b;
}

// Export types
export type GreetingOptions = {
  prefix?: string;
  suffix?: string;
};

export function greetWithOptions(name: string, options: GreetingOptions = {}): string {
  const { prefix = 'Hello', suffix = '!' } = options;
  return `${prefix}, ${name}${suffix}`;
}