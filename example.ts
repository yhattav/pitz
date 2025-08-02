/**
 * Example usage of the Pitz library
 * This file can be used for development and testing
 */

import { greet, add, greetWithOptions, utils } from './src/index';

console.log('🚀 Pitz Library Example');
console.log('========================');

// Basic greeting
console.log('Basic greeting:', greet('Developer'));

// Math operations
console.log('Addition:', add(5, 3));

// Greeting with options
console.log('Custom greeting:', greetWithOptions('Alice', { 
  prefix: 'Welcome', 
  suffix: ' to our library!' 
}));

// Utility functions
console.log('\n🔧 Utility Functions:');
console.log('isEmpty(""):', utils.isEmpty(''));
console.log('isEmpty("hello"):', utils.isEmpty('hello'));
console.log('isString(42):', utils.isString(42));
console.log('isString("hello"):', utils.isString('hello'));
console.log('isNumber("42"):', utils.isNumber('42'));
console.log('isNumber(42):', utils.isNumber(42));
console.log('capitalize("hello world"):', utils.capitalize('hello world'));