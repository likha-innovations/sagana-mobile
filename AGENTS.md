# Sagana Mobile Agent Instructions

## Property naming

- Use camelCase for properties in application-owned models, schemas, fixtures, and REST contracts.
- Preserve required external contract keys and existing MQTT/WebSocket payloads.

## Scope and privacy

- Implement only the requested change. Inspect the affected routes, components, hooks and callers before editing; avoid whole-repository scans for a local UI task.
- Never read live `.env` files or files containing credentials. Use `.env.example` for environment variable names. Never print passwords, tokens, keys, or Wi-Fi credentials.
- Preserve unrelated work. Do not publish, submit EAS builds, or change backend/hardware contracts unless the task authorizes it.
- Lead with the next action. Use short numbered steps for multi-step work and report checks and limitations plainly.

## Mobile UI agent and skills

The project agent is `mobile-ui`, defined in `.codex/agents/mobile-ui.toml`.

- For UI implementation, fixes or refactoring, read `.agents/skills/ui-craftsman/SKILL.md`.
- When a Figma reference is involved, also read `.agents/skills/figma-design-to-code/SKILL.md`.
- Use these same skills when working directly without a subagent. Delegate to `mobile-ui` when the user requests it; do not start parallel agents for routine edits by default.
- These skills are the maintained UI guidance. The UI/Figma rule files point to them; do not load duplicate instructions. Use source/configuration to establish current behavior and report discrepancies in older project notes.

Example request: "Use mobile-ui to implement the machine settings screen from this Figma reference. Reuse existing components and verify keyboard, error, and loading states."

## Source map

- `app/`: Expo Router screens/layouts. Tabs are Home, Machines and Account; batch, registration, profile editing and password flows also exist outside tabs.
- `src/components/`: shared UI and feature components; `src/hooks/`: query and device hooks; `src/api/`: typed REST wrappers; `src/types/`: schemas/contracts.
- `global.css`, `src/constants/colors.ts`, `src/constants/layout.ts`: design tokens. `useDynamicLayout()` supplies safe-area/tab spacing.
- `docs/guide/ui-status.md`: feature status; `docs/guide/architecture.md`: folder map; `docs/core/design-system.md`: UI reference.
- Machine/batch hooks currently use mocks. Backend registration and Finish Batch remain pending at the documented snapshot. Verify the current handler before describing an action as complete.

## Expo and verification

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing application code. Check `package.json` for the installed SDK; if upgraded, use matching versioned documentation. Use available documentation tools for unfamiliar APIs.

Use pnpm and preserve `pnpm-lock.yaml`. Consult the installed CLI for commands; do not download a different Expo CLI for an ordinary UI edit.

- `pnpm run typecheck`: TypeScript verification.
- `pnpm exec eslint <changed-files>`: focused lint without autofix. `pnpm run lint` modifies files.
- `pnpm run start:app --dev-client`: app development server; native BLE needs a development client and hardware.
- `pnpm run docs:build`: documentation validation when docs change.
- For authorized native/dependency changes: `pnpm exec expo install --check` and `pnpm exec expo-doctor`; determine whether the development client needs rebuilding.

Run meaningful checks for the change. Report existing failures separately. Do not claim native behavior or visual fidelity from typechecking or a web preview alone.

## Two-Tier Codebase Scanning (Graphify & Ground-Truth Protocol)

### Macro Navigation (When to use Graphify)
- **Use Graphify for Architecture & Tracing (When Present)**: Use only when `graphify-out/graph.json` is present to find where capabilities live across unfamiliar modules, assess blast radius (*"What calls X?"*), or trace paths (*`graphify path "A" "B"`*). If the graph is missing, inspect source files directly instead.
- **Hard Ban on Direct `graph.json` Reads**: NEVER use `read_file`, `grep`, or shell dumps directly on `graphify-out/graph.json` (~300,000+ tokens). Always execute scoped, off-context queries via the CLI with a token budget:
  ```powershell
  graphify query "<question>" --budget 1500
  ```
  or through the supported `query_graph` MCP interface when the CLI is unavailable.
- **Toggle**: Can be bypassed when the user explicitly requests `--no-graph` or raw file scanning.

### Micro Execution (When to use Direct Files)
- **Direct File First (Skip Graphify)**: When a prompt explicitly names a source file or component (e.g. *"Fix lockout in app/(auth)/sign-in.tsx"*), open the file directly via `read_file`. Do not query the graph first; reserve graph queries strictly for checking unknown downstream dependencies or blast radius.
- **Micro Precision & Edits**: Always inspect live source files directly for exact syntax, type definitions, error signatures, and preparing atomic code changes.
- **Silent Source Fallback (Stale Graph)**: If recent git commits or file modifications occurred after the graph was built, or if graph output is ambiguous/misaligned, silently fall back to inspecting live source files directly without triggering an auto-rebuild.


