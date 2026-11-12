# Agents

Guidance for any coding agent working in this repository.

- Repository contract: [CLAUDE.md](CLAUDE.md)
- Estate-wide conventions: https://github.com/JorisJonkers-dev/workspace/blob/main/CLAUDE.md

## Build and test

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

End-to-end tests run with `pnpm test:e2e` (Playwright, specs in `e2e`).
