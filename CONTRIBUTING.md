# Contributing

Thank you for helping. Bug reports, ideas, corrections to the Japanese and pull
requests are all welcome.

This first part is the same in every package of the family. It is the master
text kept in
[johnmorrisdotca/.github](https://github.com/johnmorrisdotca/.github/blob/main/CONTRIBUTING.md),
copied unchanged into `scripts/community/CONTRIBUTING.md`, and a test holds
this file to that copy. What is particular to the package follows it, under
the heading "Particular to" and the package's name.

## Before you start

Open an issue first for anything bigger than a typo, so that we can agree on the
shape before you spend time on it. Taking part follows the
[Code of Conduct](CODE_OF_CONDUCT.md); report a security concern privately, as
[SECURITY.md](SECURITY.md) says.

## Making a change

```sh
pnpm install
pnpm check          # lint, types and tests: the same as CI
pnpm test:package   # pack it as npm does, install it in an empty project, import every entry
pnpm site           # build the demo into ./site, as GitHub Pages publishes it
```

The package's own further commands (its browser tests, its command line, its
data scripts) are listed under its own heading below.

## House rules, shared by every package of the family

- **No runtime dependencies.** Development dependencies are for tests, builds and
  documentation only.
- **The core is pure.** Every function in it returns new values and never
  changes what it was given.
- **Test what you change.** Tests sit beside the code they test. A rule you
  change has a test that would have caught it.
- **Words a person reads come in English and Japanese.** If you cannot write the
  Japanese, say so in the pull request and someone will.
- **Option values and names are kebab case.**
- **Art and sound are CC0 or public domain only**, checked at the source and
  credited. Data and word lists may be under another licence that lets them be
  shipped, with its notice kept in `NOTICE.md`. No GPL or LGPL code.
- **Needs Node 24 or later.**
- **A README table, example or count that a test holds to the code** changes
  together with the code.
- **The family's own files are the same in every package**: `demo/family.css`,
  `scripts/family-template.mjs`, `scripts/family-readme.mjs`,
  `scripts/release-notes.mjs`, the files in `scripts/community/` and
  `family.test.js` (in `src/`, or in `test/`). Do not edit one here. To change
  one, change it in every repository at once, bump `FAMILY_TEMPLATE_VERSION` for
  the template, and record the new hash in `family.test.js`. What is the
  package's own goes in its own stylesheet, `demo/<name>.css`, and its page
  builder, `scripts/site.mjs`.
- **The list of the family in the README is made, not written.**
  `pnpm family:readme` writes it between its markers from
  `scripts/family-template.mjs`.
- **The workflows are the family's too.** `ci.yml` runs `pnpm check`, the demo's
  browser tests and the packed package on Linux, macOS and Windows; `pages.yml`
  is the same text in every package. A package adds jobs of its own after those.

## Pull requests

One change per pull request. Say what changed and how you checked it, and add a
line to `CHANGELOG.md` under **Unreleased**: for a change a user would notice,
and for one to the repository alone.

## Releasing

Maintainers bump the version in `package.json` (and in `src/version.ts`, where
the package has one), move *Unreleased* to the new version in `CHANGELOG.md`,
dated, push, wait for CI and tag `vX.Y.Z`, the same as `package.json`'s version.
The Release workflow (`.github/workflows/release.yml`) checks and builds the
package, attaches the tarball to a GitHub release and publishes it to npm by
trusted publishing, with provenance and no token. A version already on npm is
not published again.

## Particular to Kuni

Bug reports and ideas go in the [issues](https://github.com/johnmorrisdotca/kuni/issues). Kuni needs Node 24 or
later to build, because its data scripts are TypeScript that Node runs as it is.

### Commands

```sh
pnpm check            # lint, types, build, tests (sizes included) and the packed package
pnpm test:demo        # build the demo and play it in a real browser
pnpm data             # rebuild src/data/ from data-sources/ and node_modules (no network)
pnpm data:report      # the coverage, and docs/ja-gaps.md
pnpm data:fetch       # download the CLDR and IANA inputs again (network)
pnpm data:wikidata    # take a new Wikidata snapshot (network)
pnpm docs:make        # rewrite docs/strings-ja.md after changing a word of the demo
```

### The data

Every file under `src/data/` and `src/subdivisions/` is written by `scripts/build-data.ts`; never edit one by
hand. A wrong name is fixed at its source (Unicode CLDR, or Wikidata, which takes edits from anyone) and comes
in with the next snapshot, or, when it is something only this package says, in `scripts/data-config.ts`.
`pnpm data` run twice leaves the tree as it was.

- **A name no source has stays `null`.** Never an English name copied into `ja`, and never a transliteration
  made up for the occasion.
- **CLDR wins** where CLDR and Wikidata disagree; `docs/disagreements.md` lists those for a reader of
  Japanese to judge, and a correction belongs in CLDR.
- **A change in which Japanese names are missing** fails the tests until it is accepted on purpose with
  `pnpm data:report --accept`, which rewrites `data-sources/expected-ja-gaps.json`. Say in the pull request
  which names arrived or went.
- **New inputs are pinned**: a file is recorded in `data-sources/sources.json` with its address, date and
  SHA-256, and its licence is added to `NOTICE.md`. No share-alike or GPL data (ODbL, CC BY-SA, GPL).

A change to what a lookup answers is a change to every page that asks it. A new answer to something that was
`null` is a minor version; a different answer to something that was answered is a major one.
