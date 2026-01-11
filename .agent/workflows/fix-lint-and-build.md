---
description: How to fix all lint errors and build issues in a project
---

# Fix All Lint Errors and Build Issues

This workflow guides you through systematically fixing all linting and build errors in a project.

## Prerequisites
- Node.js project with ESLint configured
- `package.json` with `lint` and `build` scripts

## Step 1: Run Initial Lint Check
// turbo
```bash
npm run lint 2>&1 | tee lint-output.txt
```

This saves the output to a file for reference. Review the output to understand:
- Total number of errors vs warnings
- Which files have issues
- What types of issues exist (unused vars, img elements, etc.)

## Step 2: Categorize the Issues

Common issue types and how to fix them:

### TypeScript/ESLint Errors

| Issue Type | Fix Strategy |
|------------|--------------|
| `@typescript-eslint/no-unused-vars` | Remove unused imports/variables, or prefix with `_` for intentionally unused |
| `@typescript-eslint/no-explicit-any` | Replace `any` with proper interfaces/types |
| `@typescript-eslint/no-require-imports` | Convert `require()` to ES module `import` or add eslint-disable comment |

### React/Next.js Errors

| Issue Type | Fix Strategy |
|------------|--------------|
| `react-hooks/exhaustive-deps` | Add missing dependencies or use `eslint-disable-next-line` with justification |
| `react-hooks/set-state-in-effect` | Use lazy `useState` initialization or move logic outside effect |
| `@next/next/no-html-link-for-pages` | Replace `<a>` with Next.js `<Link>` component |
| `@next/next/no-img-element` | Replace `<img>` with Next.js `<Image>` component |

## Step 3: Configure ESLint to Ignore Underscore-Prefixed Variables

Add this to your `eslint.config.mjs` to ignore intentionally unused variables:

```javascript
{
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_"
    }]
  }
}
```

## Step 4: Fix Errors by Priority

1. **Errors first** (these break the build)
2. **Warnings second** (these are code quality issues)

For each file:
1. View the file to understand the context
2. Make the fix
3. Move to the next file

## Step 5: Run Build to Verify
// turbo
```bash
npm run build 2>&1
```

If build fails, check for:
- Type errors not caught by ESLint
- Type casting issues with Supabase/database queries (use `as unknown as Type[]`)
- Missing imports

## Step 6: Final Lint Check
// turbo
```bash
npm run lint
```

Should return with exit code 0 and no output (clean!).

## Common Patterns

### Fixing `next/image` warnings
```tsx
// Before
<img src={url} alt="description" className="w-full h-full object-cover" />

// After
import Image from "next/image";
<Image 
  src={url} 
  alt="description" 
  fill 
  sizes="(max-width: 768px) 100vw, 50vw"
  className="object-cover" 
/>
```

### Fixing Supabase type casting
```tsx
// Before - causes type errors
const data = await supabase.from('table').select('*, brands(name)');
setItems(data as Item[]);

// After - use unknown as intermediate
setItems(data as unknown as Item[]);
```

### Fixing unused catch variables
```tsx
// Before
} catch (err) {
  console.log("Error occurred");
}

// After
} catch (_err) {
  console.log("Error occurred");
}
```

## Tips

1. **Batch similar fixes** - Fix all unused imports across files at once
2. **Use multi-file edits** - Edit multiple files in parallel when fixes are independent
3. **Check build after major changes** - Don't wait until the end
4. **Keep eslint-disable comments minimal** - Only use when genuinely needed

## Quick Commands Reference

```bash
# Check for lint issues
npm run lint

# Build the project
npm run build

# Run development server
npm run dev

# Auto-fix simple issues (if configured)
npm run lint -- --fix
```
