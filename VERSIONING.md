# Versioning Workflow

This repo uses [Changesets](https://github.com/changesets/changesets) to track semantic version bumps and release notes.

## Day-to-day changes

1. Make the code or documentation change.
2. Run `bunx changeset`.
3. Select the package in this repo.
4. Choose the bump type:
    - `patch` for bug fixes, tooling-only changes, and backwards-compatible behavior fixes
    - `minor` for backwards-compatible features
    - `major` for breaking changes
5. Write a short summary of the user-facing impact.
6. Commit the generated `.changeset/*.md` file with the code change.

Do not edit the `version` field in `package.json` by hand. Pending releases should always flow through Changesets.

## Release step

1. Make sure every shipped change has a committed `.changeset/*.md` file.
2. Run `bun run version`.
3. Review the generated `package.json` version bump and any changelog updates.
4. Commit those release artifacts.

If this repo is being distributed by git tag only, stop here and cut the tag or GitHub release from that commit.

If the package is publishable, run `bun run publish` to publish any unpublished releases through Changesets.

## Commands

- `bun run version`: applies pending changesets and updates release metadata
- `bun run publish`: publishes pending releases through Changesets

## Current repo status

This template is still marked `private`, so `bun run publish` is not expected to succeed until later package-restructuring work makes the package publishable. Changesets is still useful now because it standardizes semver decisions and keeps release notes with the code that introduced them.
