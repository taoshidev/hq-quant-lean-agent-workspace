// The release's own checks: run with `node --test test/`. No network, no dependencies.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadFormat, reasons } from '../bin/check-report.mjs';
import { DRY_RUN_SENTENCE, checkRelease, handBackBlock, personaFiles } from '../bin/check-release.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPORTS = join(ROOT, 'test', 'reports');

/** Each sample, the persona it is for, and the reason it must fail with (none: it must pass). */
const EXPECTED = {
  'skeptic.v1.1.0.txt': null,
  'skeptic.v1.1.0-second-pass.txt': null,
  'skeptic.v1.0.x.txt': 'S-1 does not follow the item\'s shape',
  'skeptic.hard-without-gate.txt': 'a hard blocker cites the Studio gate check that refuses it',
  'skeptic.placeholder.txt': "template's placeholders <what>",
  'advocate.v1.1.0.txt': null,
  'advocate.v1.1.0-second-pass.txt': null,
  'advocate.v1.0.x.txt': 'PROPOSAL does not follow its shape',
  'signal-architect.v1.1.0.txt': null,
  'signal-architect.v1.0.1.txt': 'Q1 Should the stop',
  'signal-architect.posture.txt': 'never ask how strict or critical the team should be',
  'data-scout.v1.1.0.txt': null,
  'data-scout.merged.txt': 'It has no FIT section',
  'risk-architect.v1.1.0.txt': null,
  'risk-architect.placeholder.txt': 'RISK DRAFT holds a template placeholder',
  'risk-architect.old-placeholder.txt': 'RISK DRAFT holds a template placeholder',
  'research-engineer.v1.1.0.txt': null,
};

test('every sample report is checked as expected', () => {
  const files = readdirSync(REPORTS).filter((name) => name.endsWith('.txt'));
  assert.deepEqual([...files].sort(), Object.keys(EXPECTED).sort());
  for (const name of files) {
    const persona = name.split('.')[0];
    const format = loadFormat(persona);
    assert.ok(format, `${persona} has a format`);
    const why = reasons(readFileSync(join(REPORTS, name), 'utf8'), format);
    const expected = EXPECTED[name];
    if (expected === null) assert.deepEqual(why, [], `${name} passes`);
    else {
      assert.ok(why.length > 0, `${name} fails`);
      assert.ok(
        why.some((w) => w.includes(expected)),
        `${name}: expected a reason with "${expected}", got ${JSON.stringify(why)}`,
      );
    }
  }
});

test('the command exits 0 on a report that follows its format and 1 with the template on one that does not', async () => {
  const { spawnSync } = await import('node:child_process');
  const ok = spawnSync(join(ROOT, 'bin', 'check-report'), ['skeptic'], {
    input: readFileSync(join(REPORTS, 'skeptic.v1.1.0.txt')),
  });
  assert.equal(ok.status, 0, ok.stdout.toString());
  const bad = spawnSync(join(ROOT, 'bin', 'check-report'), ['skeptic', join(REPORTS, 'skeptic.v1.0.x.txt')]);
  assert.equal(bad.status, 1);
  const out = bad.stdout.toString();
  assert.match(out, /does not follow its format \(skeptic-report 2\)/);
  assert.match(out, /\(cites: <the ids of the Studio checks it stands on, or none>; evidence:/);
  const none = spawnSync(join(ROOT, 'bin', 'check-report'), ['nobody'], { input: '' });
  assert.equal(none.status, 2);
  // Run under node too, as a model may call it.
  const viaNode = spawnSync(process.execPath, [join(ROOT, 'bin', 'check-report'), 'skeptic', join(REPORTS, 'skeptic.v1.0.x.txt')]);
  assert.equal(viaNode.status, 1);
  assert.match(viaNode.stdout.toString(), /does not follow its format/);
});

test("every persona's hand-back block is its format's template, and says the trader reads it verbatim", () => {
  for (const { id, body } of personaFiles(ROOT)) {
    const format = loadFormat(id);
    assert.ok(format, `${id} has a format`);
    assert.deepEqual(handBackBlock(body), format.template, `${id}'s block is its template`);
    assert.ok(body.includes(format.shown), `${id} carries "${format.shown}"`);
  }
});

test('the release is consistent: VERSION, CHANGELOG, release.json, formats digests, frontmatter, the dry-run sentence', () => {
  assert.deepEqual(checkRelease(ROOT), []);
  assert.equal(readFileSync(join(ROOT, 'VERSION'), 'utf8').trim(), '1.1.0');
});

test('the dry-run sentence is the one hard rule 1 carries', () => {
  assert.equal(DRY_RUN_SENTENCE, "A dry run's figures are in-sample drafts, not results: you never quote them.");
});

test('the constitution carries the 1.1.0 delegation and report rules, and names the product Glitch', () => {
  const lead = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8');
  for (const needle of [
    'You are the **Lead Quant** of Glitch',
    'run_in_background: false',
    'bin/check-report',
    'at most twice',
    'studio-question',
    '"from"',
    'Studio checks',
    'OBJECTIONS',
    'ANSWERS',
    'no fence line',
    'internal id',
    'Never ask the trader how strict',
    'relay',
  ]) {
    assert.ok(lead.includes(needle), `CLAUDE.md says "${needle}"`);
  }
  for (const { id, body } of personaFiles(ROOT)) {
    assert.ok(!/Vanta Strategy Studio|Strategy Studio/.test(body), `${id} names the product Glitch`);
  }
  assert.ok(!/Vanta Strategy Studio|Strategy Studio/.test(lead));
});
