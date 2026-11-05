# TypeScript Strict Mode & Type Safety Guidelines

## Overview

In alignment with Issue **#139**, OpenSourceMate's frontend codebase enables **TypeScript Strict Mode** and comprehensive static type verification flags in `frontend/tsconfig.json`.

This document outlines the strict compiler settings enabled, their benefits, typing best practices, narrowing techniques, and guidelines to avoid unsafe types (such as `any` or unsafely suppressed warnings).

---

## 1. Compiler Flags Configured

The following flags are enabled under `compilerOptions` in `frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Explanations of Core Flags:
- **`strict: true`**: Master switch enabling a broad family of strict type-checking behaviors (`noImplicitAny`, `strictNullChecks`, etc.).
- **`noImplicitAny: true`**: Raises an error on expressions and declarations with an implied `any` type, requiring developers to explicitly specify types or use precise generics.
- **`strictNullChecks: true`**: Null and undefined are not in the domain of every type and can only be assigned to their respective literal types or explicit union types (e.g. `string | null | undefined`).
- **`noUncheckedIndexedAccess: true`**: Adds `undefined` to any un-declared field in the type when accessing via index signatures or array indexing (e.g., `items[0]` has type `T | undefined`), preventing out-of-bounds runtime panics.
- **`noUnusedLocals: true` & `noUnusedParameters: true`**: Report errors on unused local variables and function parameters, maintaining clean imports and lean closures.
- **`noImplicitReturns: true`**: Ensures that all code paths in functions with return statements explicitly return a value.
- **`noFallthroughCasesInSwitch: true`**: Prevents accidental fall-through between switch statements without a `break` or `return`.

---

## 2. Common Patterns & Resolving Strict Mode Issues

### A. Array Indexing with `noUncheckedIndexedAccess`

When indexing into arrays, TypeScript will infer the element as `T | undefined`:

```typescript
// ❌ Potential error under noUncheckedIndexedAccess:
const item = array[0];
console.log(item.name); // Error: Object is possibly 'undefined'

//  Safe Option 1: Optional chaining / nullish coalescing
const name = array[0]?.name ?? "Default";

//  Safe Option 2: Guard or bounds check
const first = array[0];
if (!first) {
  return null;
}
console.log(first.name);

//  Safe Option 3: Fallback palette lookup
const color = PALETTE[idx % PALETTE.length] ?? PALETTE[0]!;
```

### B. Narrowing Unknown API and Catch Errors

Always avoid `catch (err: any)`. Prefer typing catch blocks as `catch (err: unknown)` and utilizing typed guard functions:

```typescript
import { isApiError, isAbortError } from "../utils/apiClient";

try {
  const profile = await fetchUserProfile(username);
} catch (err: unknown) {
  if (isAbortError(err)) {
    return; // Cancelled in-flight request
  }
  if (isApiError(err)) {
    console.error(`API Error ${err.status}: ${err.message}`);
  } else if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error("Unknown error occurred");
  }
}
```

### C. DOM and Ref Elements in Tests

When using `document.querySelector` or query utilities:

```typescript
// Assert element presence before operating:
const button = screen.getAllByRole("button", { name: /Switch to light mode/i })[0];
expect(button).toBeDefined();
fireEvent.click(button!);
```

### D. Unused Imports & React 19 JSX Transform

With Next.js and the modern JSX transform (`"jsx": "preserve"` / `react-jsx`), importing `React` explicitly is unnecessary unless using React namespace functions (`React.ComponentProps`, etc.):

```typescript
// ❌ Generates TS6133 when noUnusedLocals is enabled:
import React, { useState } from "react";

//  Clean import:
import { useState } from "react";
```

---

## 3. Policy on `any` and `@ts-ignore`

1. **No `any` Types**: All API models, payload schemas, component props, and helper arguments must have explicit TypeScript types or interfaces defined in `frontend/types/`.
2. **No `@ts-ignore` or `@ts-expect-error`** without documented exceptional circumstances approved by maintainers.
3. **Type Guards**: When consuming untrusted or dynamic JSON inputs, use zod schemas or custom type predicates (`(val: unknown): val is TargetType`).
