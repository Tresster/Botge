<!-- @format -->

# Copilot Instructions for This Repo

These instructions are for GitHub Copilot (chat and inline) when working in this repository.

## Project Overview

- **Language:** TypeScript (Node.js)
- **Domain:** Discord/Twitch bot with media/emote commands and Meilisearch integration.
- **Entry points:**
  - index.ts / bot.ts for bot startup and wiring.
  - commands.ts for command registration/metadata.
  - `src/command-handlers/*` for command behavior.
  - `src/interaction-handlers/*` for interactions (buttons, autocomplete, modals, etc.).
  - `src/message-builders/*` for generating rich Discord messages.
  - `src/api/*` for external APIs (Twitch, Reddit, media, Meilisearch, etc.).
- **Configuration:**
  - Root tsconfig.json with per-package `tsconfig` under src and tests.
  - Docker and compose.yaml for running the bot + services.

When adding or updating behavior, follow existing patterns in these directories instead of inventing new structures.

## General Coding Guidelines

- **Language/Style**
  - Use **TypeScript** everywhere in src and tests.
  - Respect existing **naming**, **folder structure**, and **module boundaries**.
  - Prefer **explicit types** for public functions and exported symbols.
  - Do **not** add license or copyright headers.
  - Use **readonly types** from `types.ts` when passing Discord.js or third-party objects (e.g., `ReadonlyEmbedBuilder`, `ReadonlyOpenAI`).

- **Imports & Modules**
  - Keep import style consistent with nearby files (relative vs. root-based).
  - Group imports logically: built-ins, third-party, then local modules.
  - Always use **`.ts` extensions** in import statements (e.g., `import { foo } from './bar.ts'`).

- **Error Handling**
  - Handle external API failures gracefully (Twitch, Reddit, HTTP, Meilisearch).
  - Avoid throwing in hot paths where a safe fallback is better (e.g., return an error message instead of crashing the bot).
  - Use and extend existing utility functions in utils where appropriate.

- **Logging**
  - Follow existing logging strategy (console/log helpers) rather than introducing new logging frameworks.

- **Async**
  - Use `async/await`, not raw `Promise` chains.
  - Always handle rejected promises; avoid `void someAsync()` unless clearly fire-and-forget.

## Repo-Specific Architectural Conventions

When making changes, try to fit into these patterns:

- **Commands**
  - Slash commands and chat commands are defined in `commands.ts` with their names in `SLASH_COMMAND_NAMES` and `CONTEXT_MENU_COMMAND_NAMES` constants, and implemented under `command-handlers/`.
  - Each command's logic should live in its own file under `command-handlers/` (or share utilities in `command-handlers/`).
  - Keep command handlers **thin**; move reusable logic into utilities or message builders.

- **Interactions**
  - Button, select menu, modal, and autocomplete handlers belong under `interaction-handlers/`.
  - Reuse existing handler shapes (argument order, return types, error handling) from the closest related handler.
  - Handler files include: `button.ts`, `autocomplete.ts`, `modal-submit.ts`, `role-select-menu.ts`, `message-context-menu-command.ts`.

- **Message Building**
  - Use `src/message-builders/*` to construct Discord messages/embeds.
  - Don’t build complex message payloads inline inside handlers; prefer creating/updating message builder functions.

- **APIs**
  - External API usage should go through modules in `src/api/` or `src/utils/api/`.
  - When adding a new API call, centralize HTTP logic in an appropriate API or utils module instead of sprinkling `fetch`/`axios` calls throughout handlers.
  - Be careful with rate limits and error responses; follow patterns in existing API modules.
  - Core API modules include: `twitch-api.ts`, `reddit-api.ts`, `media-database.ts`, `cached-url.ts`.

- **Data & Persistence**
  - Database-like or Meilisearch interactions live in `src/api/*-database.ts` and similar files.
  - Extend these database-style modules instead of accessing raw storage from handlers.

## Tests

- **Location:** `tests/` with per-feature test files (e.g., `emote-message-builder.test.ts`, `twitch-clip-message-builder.test.ts`, `get-api-url.test.ts`).
- **Framework:** Vitest (not Jest) - follow Vitest testing patterns and APIs.
- When modifying behavior in `src/`, update or add tests in `tests/` that mirror the file/feature name.
- Prefer **unit tests** for pure helpers and message builders; avoid tests that require real external APIs.
- Follow the existing test framework and patterns already present in `tests/`.

## Tooling & CI

- **Node.js:** Use Node.js v25.2.0 with npm >=11.6.2 (as specified in `package.json` engines).
- **TypeScript config:** Respect existing `tsconfig.json` files; avoid large structural changes unless explicitly requested.
- **Linting:** Follow existing `eslint.config.ts` rules; don't introduce new style rules unless asked.
- **Docker/Compose:** If a change affects runtime behavior (env vars, ports, external services), also update:
  - `Dockerfile`
  - `compose.yaml`
  - Any relevant docs in `README.md` or `docs/`.

## How Copilot Should Behave

- **Scope Changes Narrowly**
  - Change only what’s necessary to implement the requested behavior.
  - Avoid large refactors unless explicitly asked.
  - Do not rename files, move modules, or change public APIs without a clear requirement.

- **Reuse Before Creating**
  - Prefer calling existing utilities in utils or existing builder/handler patterns.
  - If you need new helper behavior, see if something similar exists first; extend it instead of duplicating logic.

- **Minimal Dependencies**
  - Do **not** add new dependencies to package.json unless explicitly requested or absolutely required.
  - If adding a dependency, prefer small, focused libraries and update package.json and any relevant docs.

- **Documentation**
  - When adding new command, handler, or API:
    - Add or update comments in the relevant file if existing style is to comment.
    - Update README.md or docs if the change affects external behavior (new commands, env vars, setup steps).
  - Avoid over-documenting trivial internal helpers.

## Preferred Patterns / Anti-Patterns

- **Preferred**
  - Small, composable functions.
  - Clear separation between:
    - Command definition
    - Command handler
    - Message building
    - Data/API access
  - Explicit error messages when user-facing commands fail.

- **Avoid**
  - Large functions that mix API calls, business logic, and message construction.
  - Duplicating nearly identical code across handlers; extract a shared helper.
  - Introducing breaking changes to command names or interaction IDs unless part of an explicit migration.

## When Unsure

If a requested change conflicts with these instructions:

1. Prefer **maintaining existing behavior and structure**.
2. If multiple patterns exist, choose the one used in the most recent or most similar file.
3. Defer refactors; keep the change minimal unless specifically asked to refactor.
