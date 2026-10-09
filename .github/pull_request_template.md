**What this changes**

**How it was checked**

- [ ] `pnpm check` passes (lint, types, build, tests, the packed package)
- [ ] `pnpm test:demo` passes, if the demo changed
- [ ] `pnpm data` leaves the tree unchanged, or the data change is the point and is named in `CHANGELOG.md`
- [ ] Japanese names that arrived or went are named, and `pnpm data:report --accept` was run on purpose
