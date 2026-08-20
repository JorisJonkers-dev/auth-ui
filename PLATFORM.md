# auth-ui — platform integration guide

## Quick start: local validate

```bash
./platform/render-local.sh
```

Requires `node`, plus either `oras` (to pull the cluster context by digest) or
`--context-dir` pointing at an already-pulled context package. Installing the
pinned toolkit reads `npm.pkg.github.com`, which needs a token even for public
packages:

```bash
export GITHUB_TOKEN="$(gh auth token)"
```

The check runs `@jorisjonkers-dev/deploy-check`, the same code the
`deploy-preview` action runs, so a local result and a CI result agree. The
schema version and context ref are read from this repository's workflows rather
than restated in the script.

Review `out/scorecard.md` for any failures before committing.

> **Note:** The `deploy/` directory at the repo root contains a legacy v1-format deployment descriptor. It is **not** used by the deploy-platform flow — the canonical contract is `platform/deployment.yml` (v2 format).

## Full deployment flow

1. **Local validate** — `./platform/render-local.sh`; all scorecard fields must pass (or be `not_applicable`).
2. **Tag release** — merge to `main`; release-please opens a release PR; merging it pushes a `v*.*.*` tag.
3. **Automated publish** — `publish.yml` runs on the tag: builds the image → locks the image digest →
   publishes the deploy artifact to GHCR → opens a registry PR in homelab-deploy.
4. **Deploy preview** — on any PR touching `platform/`, `deploy-preview.yml` posts a scorecard comment.
5. **Merge → gates** — homelab-deploy runs Compose Gate, Leak Scan, Stack Integration Gate, Pipeline Complete.
6. **Auto-deploy** — on merge to homelab-deploy main, `publish-deploy-branch.yml` pushes to `deploy/production`.

## Files

| File                                   | Purpose                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `platform/deployment.yml`              | Deployment contract (v2): namespace, `platform.layer`, workloads, health, routes, rollback policy |
| `platform/images.lock.json`            | Digest-pinned image references (object form; no `:latest`)                                        |
| `platform/production.env`              | Non-secret production environment values                                                          |
| `platform/render-local.sh`             | Local CI-parity render: validate → render → kubeconform → leak-scan → scorecard                   |
| `.github/workflows/release.yml`        | release-please with mandatory App token (no GITHUB_TOKEN fallback)                                |
| `.github/workflows/publish.yml`        | Tag-triggered image + deploy-artifact publish and registry PR                                     |
| `.github/workflows/deploy-preview.yml` | PR validation with sticky scorecard comment                                                       |

## Readiness scorecard (SC-11)

Every render evaluates these fields; `fail` blocks deployment, `not_applicable`
means the check does not apply to this service:

| Field                             | not_applicable when              |
| --------------------------------- | -------------------------------- |
| `schema_pinned`                   | never                            |
| `context_pinned`                  | never                            |
| `no_latest_images`                | never                            |
| `health_declared`                 | never                            |
| `route_owner_authmode_declared`   | no workload declares routes      |
| `rollback_retention_acknowledged` | never                            |
| `no_raw_secrets`                  | never                            |
| `stateful_policy_declared`        | all workloads are stateless      |
| `raw_manifests_guarded`           | no workload enables rawManifests |
| `npm_signatures_verified`         | never                            |

## Reference

- Full platform design: [DEPLOY-PLATFORM-PLAN.md](https://github.com/JorisJonkers-dev/platform-blueprints/blob/main/DEPLOY-PLATFORM-PLAN.md)
- Schema docs: `deploy-config-schema --help`
- Composition authority: [homelab-deploy](https://github.com/JorisJonkers-dev/homelab-deploy)
