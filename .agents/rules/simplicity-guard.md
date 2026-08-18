---
trigger: always_on
description: Anti-bloat, YAGNI, and single-line comment rules for all code in sagana-mobile
---

# Simplicity & Anti-Bloat Rules (ponytail-reviewer)

1. **YAGNI & Lean Dependencies**:
   - Do not add speculative libraries or complex custom state abstractions when standard React, Expo, or TanStack Query tools suffice.
   - Banned: Axios, heavy utility libraries (lodash, moment).

2. **Clean Diffs & Dead Code**:
   - Strip unused imports, commented-out dead code, and verbose self-evident narration comments.
   - Ensure all functions and variables are strictly typed.

3. **Single-Line Comments Only (Zero Multiline Comments)**:
   - Multiline JSDoc/block comments (`/** ... */` and `/* ... */`) are strictly **BANNED**.
   - Use only concise single-line comments (`// ...`) when strictly necessary to explain non-obvious context.
   - Prefer clean, self-documenting code over excessive comments.
