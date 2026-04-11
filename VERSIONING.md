# Versioning Workflow

This repo uses [semantic-release](https://semantic-release.gitbook.io/semantic-release/) to cut versions from commit messages on `main`.

## Release rules

- `feat:` creates a minor release.
- `fix:` and `perf:` create a patch release.
- `type!:` and `BREAKING CHANGE:` create a major release.
- `build`, `chore`, `ci`, `config`, `docs`, `refactor`, `style`, `test`, and `wip` do not create a release.

Commit messages are enforced locally by `commitlint` through `.husky/commit-msg`.

## Day-to-day changes

1. Make the code or documentation change.
2. Commit with a conventional message such as `feat: add scaffold defaults` or `fix: handle empty template path`.
3. Push or merge to `main`.
4. GitHub Actions runs `semantic-release`.
5. If there is a releasable commit since the last tag, semantic-release updates `CHANGELOG.md`, bumps `package.json`, creates a `vX.Y.Z` tag, and publishes a GitHub Release.

Do not edit the `version` field in `package.json` by hand once semantic-release is active.

## One-time bootstrap

semantic-release needs the current released state tagged before it can calculate the next version. The current baseline for this repo is `v0.0.4`.

1. Tag the commit that represents the already-shipped `0.0.4` state.
2. Push that tag before the first automated release.

```bash
git tag v0.0.4 <commit-sha>
git push origin v0.0.4
```

If `0.0.4` is already the current `HEAD`, use `git tag v0.0.4`.

## Local preview

- `bun run release -- --dry-run --no-ci` previews the next release without publishing anything.

## Current repo status

- Releases currently create git tags, GitHub Releases, `CHANGELOG.md`, and a `package.json` version bump.
- npm publishing is disabled for now.
- `CHANGELOG.md` compounds normally: each release prepends a new entry instead of replacing older ones.
