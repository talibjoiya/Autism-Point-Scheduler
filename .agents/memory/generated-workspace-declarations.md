---
name: Generated workspace declarations
description: The monorepo's generated API and database packages expose declaration output to app consumers.
---

After regenerating OpenAPI files or changing shared database exports, rebuild the affected workspace package declarations before typechecking dependent artifacts.

**Why:** Consumer projects resolve the workspace package output and can otherwise report missing exports even when the source files are already correct.

**How to apply:** Run the package TypeScript emit for the changed shared package, then typecheck API, web, and mobile consumers.