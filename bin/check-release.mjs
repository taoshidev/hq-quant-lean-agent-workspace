#!/usr/bin/env node
// Checks that a release is consistent before it is tagged (docs/releasing.md):
//
//   node bin/check-release.mjs
//
// Exit 0 and "release <version>: consistent" when it is; exit 1 and one line per problem when not.
// It reads only this repository: VERSION, CHANGELOG.md, release.json, formats/*.json,
// .claude/agents/*.md and README.md.

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Hard rule 1's sentence, carried word for word by every persona that holds `dry_run_script`. */
export const DRY_RUN_SENTENCE =
  "A dry run's figures are in-sample drafts, not results: you never quote them.";

/** The frontmatter of a persona file, read line by line (`key: value`; `tools` a comma list). */
export function frontmatterOf(text) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (m === null) return null;
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = /^([a-z]+):\s*(.*)$/.exec(line);
    if (kv !== null) out[kv[1]] = kv[2].trim();
  }
  if (typeof out.tools === 'string') {
    out.tools = out.tools
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '');
  }
  return { fields: out, body: text.slice(m[0].length) };
}

/** Every persona file: its id (the file name), frontmatter and body. */
export function personaFiles(root) {
  const dir = join(root, '.claude', 'agents');
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => {
      const parsed = frontmatterOf(readFileSync(join(dir, name), 'utf8'));
      return {
        id: name.slice(0, -'.md'.length),
        fields: parsed?.fields ?? null,
        body: parsed?.body ?? '',
      };
    });
}

/** The lines of the first fenced block under "## What you hand back", or null. */
export function handBackBlock(body) {
  const at = body.indexOf('## What you hand back');
  if (at < 0) return null;
  const m = /```[^\n]*\n([\s\S]*?)\n```/.exec(body.slice(at));
  return m === null ? null : m[1].split('\n');
}

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

/** Every inconsistency in the release at `root`; empty when there is none. */
export function checkRelease(root) {
  const problems = [];
  const version = readFileSync(join(root, 'VERSION'), 'utf8').trim();
  if (!/^\d+\.\d+\.\d+$/.test(version)) problems.push(`VERSION is not a bare semver: "${version}"`);
  const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
  if (!changelog.includes(`## [${version}]`)) problems.push(`CHANGELOG.md has no "## [${version}]" entry`);

  let release;
  try {
    release = JSON.parse(readFileSync(join(root, 'release.json'), 'utf8'));
  } catch (err) {
    return [...problems, `release.json could not be read: ${err.message}`];
  }
  if (release.version !== version) problems.push(`release.json says ${release.version}, VERSION says ${version}`);
  if (release.tag !== `v${version}`) problems.push(`release.json's tag is ${release.tag}, not v${version}`);

  const files = personaFiles(root);
  const listed = new Map((release.personas ?? []).map((p) => [p.id, p]));
  for (const { id, fields, body } of files) {
    const entry = listed.get(id);
    if (fields === null) {
      problems.push(`${id}: no frontmatter`);
      continue;
    }
    if (entry === undefined) {
      problems.push(`${id}: not in release.json`);
      continue;
    }
    if (fields.name !== id) problems.push(`${id}: frontmatter name is "${fields.name}"`);
    if (fields.model !== 'inherit') problems.push(`${id}: model is "${fields.model}", not inherit`);
    if (entry.description !== fields.description) problems.push(`${id}: release.json's description is not the frontmatter's`);
    if (JSON.stringify(entry.tools) !== JSON.stringify(fields.tools)) {
      problems.push(`${id}: release.json's tools ${JSON.stringify(entry.tools)} are not the frontmatter's ${JSON.stringify(fields.tools)}`);
    }
    for (const key of ['name', 'code']) {
      if (typeof entry[key] !== 'string' || entry[key] === '') problems.push(`${id}: release.json has no ${key}`);
    }
    if ((fields.tools ?? []).includes('dry_run_script') && !body.includes(DRY_RUN_SENTENCE)) {
      problems.push(`${id}: holds dry_run_script but its body does not carry hard rule 1's dry-run sentence word for word`);
    }
    const format = entry.format;
    const path = format === undefined ? null : join(root, format.file);
    if (path === null || !existsSync(path)) {
      problems.push(`${id}: release.json names no format file that exists`);
      continue;
    }
    const doc = JSON.parse(readFileSync(path, 'utf8'));
    if (doc.id !== format.id || doc.version !== format.version || doc.persona !== id) {
      problems.push(`${id}: ${format.file} is ${doc.id} ${doc.version} for ${doc.persona}, release.json says ${format.id} ${format.version}`);
    }
    if (sha256(path) !== format.sha256) problems.push(`${id}: ${format.file}'s sha256 is not the one release.json records`);
    const block = handBackBlock(body);
    if (JSON.stringify(block) !== JSON.stringify(doc.template)) {
      problems.push(`${id}: the "What you hand back" block is not ${format.file}'s template`);
    }
    if (typeof doc.shown === 'string' && !body.includes(doc.shown)) problems.push(`${id}: does not say "${doc.shown}"`);
  }
  for (const id of listed.keys()) {
    if (!files.some((f) => f.id === id)) problems.push(`release.json lists ${id}, which has no persona file`);
  }
  const codes = (release.personas ?? []).map((p) => p.code);
  if (new Set(codes).size !== codes.length) problems.push('two personas share a code');

  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  if (!readme.includes('### Through the control plane (ACP)')) problems.push('README.md has no ACP-path check');
  return problems;
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const problems = checkRelease(root);
  const version = readFileSync(join(root, 'VERSION'), 'utf8').trim();
  if (problems.length === 0) {
    process.stdout.write(`release ${version}: consistent\n`);
  } else {
    process.stdout.write(`release ${version}: ${problems.length} problem(s)\n${problems.map((p) => `- ${p}`).join('\n')}\n`);
    process.exitCode = 1;
  }
}
