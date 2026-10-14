# Sagana Mobile Agent Instructions

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
