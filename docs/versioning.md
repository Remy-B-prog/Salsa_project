# Versioning

The application uses semantic versioning: `MAJOR.MINOR.PATCH`.

- Increase `MAJOR` for incompatible user-facing changes.
- Increase `MINOR` for backwards-compatible functionality.
- Increase `PATCH` for backwards-compatible fixes.

`package.json` is the single source of truth. The React application imports its version during the Vite build and shows it in the library home footer. `package-lock.json` must always use the same version.

## Automated release

Every contribution starts from `main` on a dedicated branch and is merged through a pull request. Commit messages must follow Conventional Commits:

- `fix:` creates a PATCH release.
- `feat:` creates a MINOR release.
- `!` or `BREAKING CHANGE` creates a MAJOR release.
- `docs:`, `chore:`, `ci:`, and `test:` do not create a release.

After a pull request is merged to `main`, the release workflow runs formatting, linting, tests, and the build. It only runs `semantic-release` after every check succeeds. When a release is required, `semantic-release` updates `package.json` and `package-lock.json`, commits the version, creates the `vMAJOR.MINOR.PATCH` tag, and publishes the GitHub release with generated notes. It never publishes to npm.

GitHub Pages runs after the release workflow and checks out the latest `main`, so the deployed footer always contains the generated version.

## Recovery

- If a quality check fails, fix it on a new branch and merge the corresponding Conventional Commit. No version, tag, or release is created.
- If a tag already exists but the GitHub release was not created, create the missing release from that existing tag. Do not change the version or recreate the tag.
- Do not create release tags manually for normal releases. The workflow is the source of truth.
