# mantine-props — agent guide

This folder holds **serializable Mantine prop mirrors** and their **Zod schemas** for App Builder theme `defaultProps` validation (SS-9463).

## What this folder is for (big picture)

App Builder stores Mantine styling in settings JSON (`themeOverrides.components.*.defaultProps`). Those bags must be **validated at runtime** and **typed in TypeScript** without duplicating Mantine unions by hand.

```
settings JSON
     │
     ▼
validateAppBuilderSettingsJson  (appbuildertypecheck.ts)
     │
     ├── themeComponentDefaultPropsRegistry  ← imports mantine*PropsSchema from here
     └── validateThemeComponentsRecord       ← recursive containerThemeOverrides (phase 4)
```

**mantine-props** supplies the Zod schemas and inferred types. Widget/container `*.types.ts` files **compose** them instead of hand-writing Zod.

**Related code outside this folder:**

| Location | Role |
|----------|------|
| `features/appbuilder/config/themeComponentDefaultPropsRegistry.ts` | Maps theme component keys → Zod schema |
| `features/appbuilder/config/validateThemeComponentsRecord.ts` | Deep validation of nested `containerThemeOverrides` |
| `features/appbuilder/config/appbuildertypecheck.ts` | Top-level settings schema + `superRefine` |
| `shared/lib/jsonValue.ts` | `JsonValue` / `JsonValueSchema` — FSD home for opaque JSON (not in mantine-props) |
| `pages/config/*Container.types.ts`, widget `*.theme.types.ts` | Re-export or extend `Mantine*Props` / compose schemas |
| `shared/mantine-props/assert-mantine-subset.test-d.ts` | Compile-time `MantinePropsSubset` vs `@mantine/core` |

**Repo split:** code here lives in **`src/shared` submodule**; `generate:mantine-props-zod` script and `ts-to-zod` devDependency live in the **parent repo** `package.json`.

---

## Goals (do not regress)

1. **Runtime validation** — registered theme `defaultProps` fail on unknown keys (`z.strictObject()`).
2. **Zod-first types** — public `Mantine*Props` = `z.infer<typeof mantine*PropsSchema>`, not hand-written interfaces in public facades.
3. **No `z.any()` in production schemas** — mirrors must codegen to concrete Zod.
4. **JSON-only contract** — no functions, refs, `ReactNode`, or other non-serializable Mantine props.
5. **Mantine alignment** — mirrors stay assignable to real Mantine props (`MantinePropsSubset` asserts in `assert-mantine-subset.test-d.ts`).

**Non-goals:** codegen from `@mantine/core` `.d.ts`; validating unregistered theme keys (they stay opaque `JsonValue`).

---

## Phased rollout (where changes land)

Summary:

| Phase | mantine-props work | Downstream |
|-------|-------------------|------------|
| **0** | Infra: primitives, group mirror, ts-to-zod, generate script | Pilot: `AppBuilderHorizontalContainer` → `mantineGroupPropsSchema` |
| **1** | Button, Text, Paper, Accordion mirrors | Registry keys: `Button`, `Text`, `Paper`, `Accordion` |
| **2** | Extend `MantineGroupProps` (`pt`, `pb`, `styles`) | Vertical/horizontal container types migrate off manual Zod |
| **3** | Stack, Box, Tooltip + composed widget schemas | e.g. `AppBuilderStackUiWidgetComponent`, `TooltipWrapper` |
| **4** | (schemas already exist) | `validateThemeComponentsRecord` recurses nested overrides |
| **5** | — | `appBuilderOverride` validation tests (separate from mantine-props) |

When extending a mirror, check which phase/consumers depend on it before narrowing types.

---

## File roles

| Pattern | Role | Edited by agents? | Imported by app code? |
|---------|------|-------------------|------------------------|
| `{name}.schema-input.ts` | ts-to-zod **codegen input** — `interface Mantine{Name}Props` | **Yes** (primary edit surface) | **Never** |
| `{name}.zod.ts` | Generated — `mantine{Name}PropsSchema` | Regenerate only | Yes (registry, validators) |
| `{name}.ts` | Public facade — schema + `type Mantine{Name}Props = z.infer<…>` | Rarely (boilerplate) | Yes |
| `spacing.schema-input.ts` | Canonical **`MantineSpacing`** | Yes | Never |
| `primitives.schema-input.ts` | Canonical shared primitives | Yes | Never |
| `primitives.ts` | Re-exports from schema-input + `MantineResponsive<T>` | Rarely | Yes |
| `spacing.ts` | Public facade for `mantineSpacingSchema` | Rarely | Yes |
| `mantine-props-subset.ts` | `MantinePropsSubset<Mantine, Mirror>` helper | Rarely | Yes (assert file only) |
| `index.ts` | Barrel of **public facades** | When adding a component | Yes |
| `ts-to-zod.config.mjs` | schema-input → zod mapping + `getSchemaName` | When adding a component | N/A |

**Import alias:** `@AppBuilderLib/shared/mantine-props/{component}` (types) or `…/{component}.zod` (schema).

**Never import** `*.schema-input.ts` from app, widgets, or registry code.

---

## Codegen pipeline

```
*.schema-input.ts          ← you edit this (import type from canonical files)
        │
        ▼  scripts/inline-mantine-schema-input-types.mjs
        │  (inlines canonical types — ts-to-zod cannot follow cross-file imports)
        ▼
   ts-to-zod                 ← devDependency in parent repo
        │
        ▼
*.zod.ts                   ← commit generated output
        │
        ▼  scripts/dedupe-mantine-props-zod.mjs
        │  (shared schemas → import from spacing.zod / primitives.zod)
        ▼
{name}.ts                  ← z.infer public types (usually unchanged)
```

**Command (parent repo root):**

```bash
pnpm run generate:mantine-props-zod
```

Runs: generate → dedupe → `assertSingleSharedSchemaExports`.

---

## Core principles

### 1. Edit schema-input, then regenerate

1. Edit `{name}.schema-input.ts`.
2. Run `pnpm run generate:mantine-props-zod`.
3. Commit `{name}.schema-input.ts` + `{name}.zod.ts`.
4. Public `{name}.ts` usually unchanged — types follow via `z.infer`.

**Do not hand-edit `*.zod.ts`.**

### 2. Never duplicate canonical types in component schema-input

| Type | Canonical file |
|------|----------------|
| `MantineSpacing` | `spacing.schema-input.ts` |
| `MantineCssLength`, `MantineFlexWrap`, `MantineStylesApi`, `MantineResponsiveCssSize`, … | `primitives.schema-input.ts` |

```typescript
import type {MantineSpacing} from "./spacing.schema-input";
import type {MantineResponsiveCssSize} from "./primitives.schema-input";
```

The inline preprocessor expands these for ts-to-zod. Copy-pasting unions causes drift.

### 3. No external imports in schema-input

- **Forbidden:** `@mantine/*`, `react`, viewer, app slices.
- **Allowed:** `import type` from `./spacing.schema-input` and `./primitives.schema-input` only.

### 4. Serializable subset + `@strict`

| Include | Exclude |
|---------|---------|
| strings, numbers, booleans, null | callbacks, refs |
| JSON objects/arrays | `children`, render props |
| `styles` via `MantineStylesApi` | `ReactNode` (Tooltip `label` → `string` only) |
| responsive `{ base, xs, sm, md, lg, xl }` | |

Use `/** @strict */` on the props interface → `z.strictObject()`.

For deep `styles`, prefer generated `mantineStylesApiSchema` from `MantineStylesApi` mirror. Fall back to `JsonValueSchema` from `@AppBuilderLib/shared/lib/jsonValue` only if ts-to-zod cannot express the shape without `z.any()`.

### 5. Shared Zod schemas — single canonical export

| Schema | Canonical file |
|--------|----------------|
| `mantineSpacingSchema` | `spacing.zod.ts` |
| `mantineCssLengthSchema`, `mantineFlexWrapSchema`, `mantineStylesApiSchema`, `mantineStylesApiValueSchema`, `mantineResponsiveCssSizeSchema` | `primitives.zod.ts` |

When adding a shared primitive: update schema-input → `ts-to-zod.config.mjs` → `SHARED_SCHEMAS` in `scripts/dedupe-mantine-props-zod.mjs` → re-export from `index.ts` / `primitives.ts`.

### 6. Public types = z.infer only

```typescript
import type {z} from "zod";
import {mantineButtonPropsSchema} from "./button.zod";

export {mantineButtonPropsSchema};
export type MantineButtonProps = z.infer<typeof mantineButtonPropsSchema>;
```

### 7. Compile-time Mantine subset check

After changing a mirror, update `assert-mantine-subset.test-d.ts`:

```typescript
import type {ButtonProps} from "@mantine/core";
import type {MantineButtonProps} from "./button";
import type {MantinePropsSubset} from "./mantine-props-subset";

type _Button = MantinePropsSubset<ButtonProps, MantineButtonProps>;
declare const assertButton: _Button;
void assertButton;
```

Run `pnpm exec tsc --noEmit` — assert must still pass.

---

## Downstream wiring (after changing a schema)

### Registry entry

In `themeComponentDefaultPropsRegistry.ts`:

```typescript
import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";

// registry object:
Button: mantineButtonPropsSchema,
AppBuilderHorizontalContainer: mantineGroupPropsSchema, // alias example
```

Only **registered** keys get strict validation. Unknown keys remain opaque `JsonValue`.

### Container / widget types — compose, don't duplicate

**Simple alias (container = Mantine component):**

```typescript
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import type {MantineGroupProps} from "@AppBuilderLib/shared/mantine-props/group";

export const AppBuilderHorizontalContainerThemeDefaultPropsSchema = mantineGroupPropsSchema;
export interface AppBuilderHorizontalContainerThemeDefaultProps extends MantineGroupProps {}
```

**Composed widget schema (phase 3):**

```typescript
export const AppBuilderStackUiWidgetThemeDefaultPropsSchema = z.strictObject({
	stackPaperProps: mantinePaperPropsSchema.optional(),
	stackProps: mantineStackPropsSchema.optional(),
	buttonForwardProps: mantineButtonPropsSchema.optional(),
	// … other nested bags
});
```

Remove legacy hand-written Zod (`mantineSpacingJsonSchema`, etc.) when migrating.

### Widget `StyleProps`

Point nested prop types at `Mantine*Props` from public facades so theme JSON and component props stay aligned.

---

## Adding a new Mantine component mirror

1. Create `{name}.schema-input.ts` — `export interface Mantine{Name}Props` + canonical `import type`s + `@strict`.
2. Add entry to `ts-to-zod.config.mjs` (`getSchemaName` → `mantine{Name}PropsSchema`).
3. Create `{name}.ts` public facade (`z.infer` template).
4. `pnpm run generate:mantine-props-zod` → commit `{name}.zod.ts`.
5. Export from `index.ts`.
6. Add `MantinePropsSubset` row in `assert-mantine-subset.test-d.ts`.
7. Register in `themeComponentDefaultPropsRegistry.ts` if settings JSON uses that theme key.
8. Add Jest fixtures in `features/appbuilder/config/__tests__/validateAppBuilderSettingsJson.themeComponents.test.ts` — **inline fixtures only** (do not read `public/*.json` in tests).
9. Wire consumer `*.types.ts` / widget schema if applicable.

---

## Common mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Duplicate `export type MantineSpacing` in every schema-input | Drift | `import type` from canonical files |
| Import `@mantine/core` in schema-input | `z.any()` | Mirror serializable shape manually |
| Hand-edit `*.zod.ts` | Lost on regenerate | Edit schema-input + regenerate |
| Import `*.schema-input.ts` from app | Leaks codegen surface | Use public facade or `.zod` |
| Change mirror without subset assert | Silent drift from Mantine | Update `assert-mantine-subset.test-d.ts` |
| Register schema but skip tests | Regressions in production JSON | Add accept/reject Jest cases |
| Add shared primitive without dedupe registry | Generate script throws | Update `SHARED_SCHEMAS` |

---

## Verification checklist

```bash
pnpm run generate:mantine-props-zod
rg "z\.any\(\)" src/shared/shared/mantine-props/
pnpm exec tsc --noEmit
pnpm test -- validateAppBuilderSettingsJson
git status --short src/shared/shared/mantine-props/   # expect clean after regen
```

Confirm:

- `assertSingleSharedSchemaExports` passes (part of generate script).
- No imports from `node_modules/.cache/mantine-props-zod-inline/` in committed `*.zod.ts`.
- Subset asserts compile.
- Registry + composed schemas still validate in theme component tests.

**Optional CI (see plan Task 14):** `scripts/check-mantine-props-zod-generated.mjs` — regen + fail if git diff dirty.

---

## Submodule + commits

Code here is in **`src/shared` submodule** (AppBuilderShared):

```bash
cd src/shared
git add shared/mantine-props/ …
git commit -m "SS-9463: …"
```

Bump submodule pointer in parent repo when integrating. Parent repo commits `package.json` / generate scripts separately.

---

## Quick reference — current mirrors

| schema-input | Public facade | Registry keys (typical) |
|--------------|---------------|-------------------------|
| `group` | `group.ts` | `Group`, `AppBuilderHorizontalContainer`, containers |
| `button` | `button.ts` | `Button` |
| `text` | `text.ts` | `Text` |
| `paper` | `paper.ts` | `Paper` |
| `accordion` | `accordion.ts` | `Accordion` |
| `stack` | `stack.ts` | nested in widgets |
| `box` | `box.ts` | nested in widgets |
| `tooltip` | `tooltip.ts` | `TooltipWrapper` |
| `spacing` | `spacing.ts` | (primitive, composed) |
| `primitives` | `primitives.ts` | (shared types/schemas) |

When in doubt, grep `themeComponentDefaultPropsRegistry` and `@AppBuilderLib/shared/mantine-props` for live consumers.
