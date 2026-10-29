# Versioning

The application uses semantic versioning: `MAJOR.MINOR.PATCH`.

- Increase `MAJOR` for incompatible user-facing changes.
- Increase `MINOR` for backwards-compatible functionality.
- Increase `PATCH` for backwards-compatible fixes.

`package.json` is the single source of truth. The React application imports its version during the Vite build and shows it in the library home footer. `package-lock.json` must always use the same version.

## Stable release

1. Update the version in `package.json` and `package-lock.json`.
2. Run `npm run format`, `npm run lint`, `npm run test`, and `npm run build`.
3. Commit and push the validated version change.
4. With explicit approval, create and push the matching Git tag: `vMAJOR.MINOR.PATCH`.
5. Create the matching GitHub release from that tag.

Version bumps, release notes, and releases will be automated by task 017.
