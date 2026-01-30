# AGENTS.md

## Build, Test & Lint Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing (Vitest)
```bash
npm run test         # Run all tests
npm run test         # Run specific test file: src/lib/lib.test.js
npm run test         # Run specific test with pattern: npm run test -- -t "single winner"
```

Note: No ESLint or Prettier configuration found in the project.

## Project Structure
- `src/` - Main application source
  - `lib/` - Svelte components and business logic
  - `App.svelte` - Root component with hash-based routing
  - `main.js` - Application entry point
  - `vite-env.d.ts` - TypeScript environment definitions
- `serializer/` - Rust WebAssembly module for game serialization
- `simulate/` - Rust WebAssembly module for game simulation
- `public/` - Static assets
- `index.html` - HTML template

## Code Style Guidelines

### File Organization
- Component files: `src/lib/ComponentName.svelte`
- Test files: `src/lib/ComponentName.test.js`
- Keep Svelte components self-contained with imports at top of `<script>`

### Naming Conventions
- **Components**: PascalCase (e.g., `Trump.svelte`, `ResultRound.svelte`)
- **Variables/Functions**: camelCase (e.g., `bids`, `playerLabel`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `TRUMPS`, `GAME_VERSION`)
- **CSS classes**: kebab-case (e.g., `.bid-result`, `.player-input`)
- **CSS variables**: kebab-case with `--` prefix (e.g., `--color-text`)

### Component Style (Svelte)
```javascript
<script>
    // Imports first, then component props
    import Component from './Component.svelte';

    // Export component props with 'export let'
    export let propName;

    // Define local variables
    let localVar;

    // Event dispatchers for parent communication
    const dispatch = createEventDispatcher();

    // Reactive statements (if needed)
    $: reactiveVar;

    // Functions
    function handler() {
        // Implementation
    }

    // Lifecycle hooks
    onMount(() => {
        // Mount logic
    });

    onMount(() => {
        // Another mount hook
    });

    function save() {
        // Business logic
        location.href = `#/path/to/${id}`;
    }
</script>

<!-- Template -->
<h1>Title</h1>
<button on:click={handler}>Click</button>

<!-- Conditional rendering -->
{#if condition}
    <div>Show this</div>
{:else if otherCondition}
    <div>Show that</div>
{/if}

<!-- Loops -->
{#each items as item, index}
    <div>{item}</div>
{/each}

<!-- Special handling: HTML strings -->
<div>{@html htmlString}</div>

<!-- Two-way binding -->
<input type="text" bind:value={variable} />
```

### JavaScript/TypeScript Style (lib.js and store.js)
```javascript
// Import with destructuring for re-exporting
import {
    functionName1,
    functionName2,
    constantName
} from './module.js';

// Class exports
export class ClassName {
    constructor(properties) {
        this.propertyName = value;
    }
}

// Function exports with JSDoc comments
/**
 * Calculate scores for the game
 * @param {Object} game - The game object
 * @returns {void}
 */
export function functionName(game) {
    // Use camelCase for function parameters
    const player = game.players.find(p => p.id === playerId);

    // Error handling
    try {
        // Logic
    } catch (error) {
        console.error('Error message:', error);
    }

    // Return early if needed
    if (condition) {
        return defaultValue;
    }

    return result;
}

// Constants defined as objects
export const CONST_NAME = {
    PROPERTY: value,
    ANOTHER_PROPERTY: anotherValue
};
```

### CSS Styling
```css
/* CSS variables for theming */
:root {
    --color-text: #000;
    --border-color: #ddd;
    --accent-color: #646cff;
    --player-name-font-size: 1em;
}

/* Component-specific styles */
.component-name {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

/* Special media queries */
@media (prefers-color-scheme: dark) {
    .selector {
        property: value;
    }
}

/* Utility classes */
.check-icon {
    color: green;
}

/* Scoped styles with special handling */
:global(*) {
    user-select: none;
}
```

### Router & URL Handling
- Use hash-based routing: `window.location.hash`
- Follow patterns in `App.svelte`
  - `#/list` - Game list
  - `#/game/{id}` - Main game view
  - `#/bid/{id}/{round}` - Bidding phase
  - `#/play/{id}/{round}` - Playing phase
  - `#/result/{id}/{round}` - Round results
  - `#/edit/{id}/{round}` - Edit round
  - `#/stats` - Statistics view
  - `#/s/1/{encodedData}` - Shared game data
  - `#/simulate/{players}/{trump}` - Simulation
- Redirect helper: `window.location.href = '#/path'`

### Event Handling
```javascript
// Click handlers
<button on:click={handler}>Click me</button>

// Prevent default action
<button on:click|preventDefault={handler}>Click</button>

// Form submission
<form on:submit={handleSubmit}>
    <input type="text" bind:value={value} />
</form>

// Mouse events
<div on:mousemove={handleMove}>Move over me</div>
```

### State Management (Svelte Stores)
```javascript
import { writable, get } from 'svelte/store';

// Writable store with persistence
const store = writable(initialValue);

// Subscribe and update
store.subscribe(value => {
    console.log(value);
});

store.update(v => v + 1);

// Custom store pattern
const customStore = createWritableStore(initial);

// Game-specific store in store.js
// Uses localStorage for persistence
// Games stored with unique IDs
```

### WebAssembly Integration
- Rust code lives in `serializer/` and `simulate/` directories
- Import with: `import serializer_wasm from "../../serializer/Cargo.toml";`
- Async initialization pattern
- Error handling required for async Wasm functions

### Testing Patterns (Vitest)
```javascript
import { expect, test, vi } from 'vitest';
import { functionName } from './module.js';

// Simple test
test('should do something', () => {
    const result = functionName(input);
    expect(result).toBe(expected);
});

// Parameterized tests
test.each([
    ['case1', input1, output1],
    ['case2', input2, output2],
])('should handle %s', (name, input, expected) => {
    const result = functionName(input);
    expect(result).toEqual(expected);
});

// Mock patterns
vi.mock('./module.js', () => ({
    functionName: vi.fn(() => 'mocked')
}));

// Test helper function in file
function helperFunction() {
    return 'helper';
}
```

## Common Patterns

### Sharing Data
- Games: URL hash encoded with Base64
- Standings: Encoded string format `name1:score1,name2:score2`
- Use `shareGame()` function from store.js

### Internationalization
- Dutch text: Most UI text is Dutch
- Some English comments and constants
- Follow existing pattern

### Responsive Design
- Mobile-first approach
- Use flexbox layouts
- Material Icons for visual elements
- Font sizing with CSS variables

### Special Considerations
1. No backend - everything runs in browser
2. URL-based state sharing
3. LocalStorage for persistence
4. Hash-based routing (no page reloads)
5. No TypeScript compilation - uses JSDoc and type annotations

## Cursor / Copilot Rules
No Cursor or Copilot rules found in project.

## Getting Started for New Agents
1. Clone repository and run `npm install`
2. Start dev server with `npm run dev`
3. Build Rust Wasm modules first: check serializer/ and simulate/ Cargo.toml
4. Follow existing component patterns
5. Test with `npm run test`
6. Use hash-based routing for navigation
