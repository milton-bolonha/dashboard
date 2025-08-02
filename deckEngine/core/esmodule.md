# Plan to Convert to ES Modules

This document outlines the plan to convert the existing CommonJS-based codebase to use ES modules with modern `import` and `export` syntax.

## 1. Project Setup

### 1.1. `package.json`

First, we need to create a `package.json` file if one doesn't exist. Then, we need to add the following entry to the `package.json` file. This will tell Node.js to treat all `.js` files in the project as ES modules.

```json
{
  "type": "module"
}
```

### 1.2. Update Dependencies

Some dependencies might not be compatible with ES modules. We will need to check each dependency and update it to a version that supports ES modules. If a dependency does not support ES modules, we may need to use a dynamic `import()` or find an alternative.

## 2. File-by-File Conversion Strategy

We will convert each file from CommonJS to ES modules. This involves changing `require` to `import` and `module.exports` to `export`.

### 2.1. `index.js`

- Convert `require` statements to `import`.
- The main exported object will be converted to a series of named exports.

### 2.2. `domains/domain-manager.js`

- Convert `require` to `import`.
- Convert `module.exports` to `export default` or named exports.

### 2.3. `engine/`

- **`arena.js`**: Convert `require` and `module.exports`.
- **`deck-engine-v2.js`**: Convert `require` and `module.exports`.
- **`deck-engine.js`**: Convert `require` and `module.exports`.
- **`deck.js`**: Convert `require` and `module.exports`.
- **`events.js`**: Convert `require` and `module.exports`.
- **`match.js`**: Convert `require` and `module.exports`.
- **`metrics.js`**: Convert `require` and `module.exports`.
- **`utils.js`**: Convert `require` and `module.exports`. This file likely contains utility functions, so we'll probably use named exports.

### 2.4. `logging/unified-logger.js`

- Convert `require` and `module.exports`.

### 2.5. `platform/platform-adapter.js`

- Convert `require` and `module.exports`.

### 2.6. `routing/route-manager.js`

- Convert `require` and `module.exports`.

## 3. Handling `__dirname` and `__filename`

ES modules do not have `__dirname` or `__filename`. If these are used, we will need to replace them with `import.meta.url`.

For example:

```javascript
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

## 4. Testing

After converting the files, we will need to run a comprehensive set of tests to ensure that the application still works as expected. If there are no existing tests, we should consider adding them, at least for the critical parts of the application.

## 5. Phased Rollout

We can perform the conversion in phases:

1.  **Setup `package.json`**: Add `"type": "module"`.
2.  **Convert a single module**: Start with a smaller, less critical module (like `utils.js`).
3.  **Test**: Test the converted module thoroughly.
4.  **Repeat**: Continue converting and testing modules one by one.
5.  **Final Integration Test**: Once all modules are converted, perform a full integration test.
