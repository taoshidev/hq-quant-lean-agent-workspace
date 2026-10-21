# Releasing this workspace

A release is the tag `v<VERSION>` on `main`. Glitch keeps a copy of each release's
`release.json` and `formats/*.json`, and names the team and reads its reports by the commit a
sandbox is observed at, so a release reaches traders only through a Glitch build that holds it.

## Who changes what

- **One release lane** tags releases and is the only one that edits persona frontmatter (`name`,
  `description`, `tools`, `model`), `formats/*`, `release.json` and `VERSION`.
- **Every other change is a delta**: a pull request into `main` that changes prose, `CLAUDE.md`,
  `docs/` and persona bodies. It names the Glitch change it needs deployed first. The release lane
  reviews it and releases it.
- **Versions are assigned at merge**, in merge order, never in a design or a delta: the next
  release takes the next version, whatever a document planned.
- **A maintainer merges and tags** every release.

## The train

| Content | Needs deployed in Glitch first |
| --- | --- |
| The delta's text | The Glitch change that offers what the text describes. The constitution may describe only what the per-turn note offers (`CLAUDE.md`, *Where you are*). |
| A new report format, or a changed one | The Glitch build that holds the release's formats, so its reports are read with them. |
| A persona's new `tools:` entry | The Glitch tool it names, live on the bridge. |

## Cutting a release

On a branch `release/<version>` off `main`:

1. Merge the deltas whose prerequisites are deployed, in their merge order.
2. Apply the frontmatter, `formats/*` and `release.json` changes the deltas need. A format's
   `template` is the persona's "What you hand back" block, line for line; change both together.
   Raise a format's `version` when its grammar changes.
3. Bump `VERSION` and write the `CHANGELOG.md` entry under the same version.
4. Recompute each format's `sha256` in `release.json` (`shasum -a 256 formats/<persona>.json`).
5. Run the checks; both must pass:

   ```
   node bin/check-release.mjs
   node --test test/release.test.mjs
   ```

   `check-release` refuses a release when: `VERSION`, `release.json` and the changelog disagree;
   a persona file and `release.json` disagree on its name, description or tools, or it is not
   `model: inherit`; a format file's digest, id or version is not what `release.json` records; a
   persona's hand-back block is not its format's template, or it does not say its report is shown
   to the trader verbatim; **a persona whose `tools:` list holds `dry_run_script` does not carry
   hard rule 1's sentence word for word in its body**: "A dry run's figures are in-sample drafts,
   not results: you never quote them."; or the README lacks the control-plane check.
6. Check a teammate through the control plane at the branch (README, *Through the control
   plane*): a captured brief carries no fence line and no internal id, a report passes
   `bin/check-report`, and the reply's questions carry `"from"` where a teammate asked them.
7. Open the pull request into `main`. Glitch's copy of the release (its `release.json`,
   `formats/*.json` and the commits that hold its tree) goes in Glitch's own pull request.

## After the merge

1. A maintainer tags the merge commit `v<VERSION>`.
2. Glitch's copy of the release adds the tag's commit to the commits it recognises (the merge
   commit holds the same tree as the release branch's head).
3. Once that Glitch build is deployed, move the deployment's two settings together: the version
   Glitch declares (`VERSION`'s contents) and the ref the control plane brings sandboxes to (the
   tag). Never move one without the other, and never before the build that holds the release.

## Later releases

Each later release runs this procedure as written: the deltas expected next are the bridge's tool
lists (with the dry-run sentence in every persona that holds `dry_run_script`), the team-check
tools, and the LEAN delta, each after its Glitch prerequisite is deployed.
