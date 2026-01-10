# Testing Guide

## Overview

This project uses **Vitest** as the testing framework. Vitest is a modern, fast testing framework that works seamlessly with TypeScript and ES modules.

## Why Vitest?

- **Fast**: Powered by Vite, runs tests in parallel
- **TypeScript Native**: No additional configuration needed
- **Jest Compatible**: Familiar API if you've used Jest before
- **Modern**: Built for ES modules and modern JavaScript

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI (visual test runner in browser)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Writing Tests

### Test File Location
- Place test files next to the code they test: `normalize.test.ts` next to `normalize.ts`
- Or in a `__tests__` directory
- Use `.test.ts` or `.spec.ts` extension

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myModule';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Common Matchers

```typescript
// Equality
expect(value).toBe(5);           // Strict equality (===)
expect(value).toEqual(obj);      // Deep equality for objects
expect(value).not.toBe(3);       // Negation

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(0.3, 1); // For floating point

// Strings
expect(str).toMatch(/pattern/);
expect(str).toContain('substring');

// Arrays
expect(arr).toContain('item');
expect(arr).toHaveLength(3);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ key: 'value' });
```

### Testing Async Code

```typescript
it('should handle async operations', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

### Mocking

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn(() => 'mocked value');

// Mock a module
vi.mock('./myModule', () => ({
  myFunction: vi.fn(() => 'mocked'),
}));

// Spy on a function
const spy = vi.spyOn(obj, 'method');
expect(spy).toHaveBeenCalled();
expect(spy).toHaveBeenCalledWith('arg1', 'arg2');
```

## Test Organization for This Project

### Unit Tests
Test individual functions in isolation:
- `src/lib/normalize.test.ts` - Test normalization functions
- `src/lib/geocode.test.ts` - Test geocoding logic
- `src/lib/validation.test.ts` - Test Zod schemas

### Integration Tests
Test how multiple parts work together:
- `app/api/add-member/route.test.ts` - Test the API endpoint

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the function does, not how
2. **Use Descriptive Test Names**: `it('should normalize city names to title case')`
3. **Arrange-Act-Assert Pattern**:
   ```typescript
   // Arrange: Set up test data
   const input = 'new york';
   
   // Act: Call the function
   const result = normalizeInput(input);
   
   // Assert: Check the result
   expect(result).toBe('New York');
   ```
4. **Test Edge Cases**: null, undefined, empty strings, invalid inputs
5. **Keep Tests Fast**: Mock external dependencies (file system, network)
6. **One Assertion Per Test** (when practical): Makes failures easier to diagnose

## Example Test for This Project

```typescript
// src/lib/normalize.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeInput } from './normalize';

describe('normalizeInput', () => {
  it('should trim whitespace', () => {
    expect(normalizeInput('  New York  ')).toBe('New York');
  });

  it('should capitalize first letter of each word', () => {
    expect(normalizeInput('new york')).toBe('New York');
  });

  it('should collapse multiple spaces', () => {
    expect(normalizeInput('new    york')).toBe('New York');
  });

  it('should handle empty string', () => {
    expect(normalizeInput('')).toBe('');
  });

  it('should handle undefined', () => {
    expect(normalizeInput(undefined)).toBe('');
  });
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Testing Best Practices](https://testingjavascript.com/)
