// The release's own checks: run with `node --test test/release.test.mjs`. No network, no dependencies.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadFormat, reasons } from '../bin/check-report.mjs';
import { DRY_RUN_SENTENCE, checkRelease, handBackBlock, holdsDryRun, personaFiles } from '../bin/check-release.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPORTS = join(ROOT, 'test', 'reports');

/** Each sample, the persona it is for, and the reason it must fail with (none: it must pass). */
const EXPECTED = {
  'skeptic.v1.1.0.txt': null,
  'skeptic.v1.1.0-second-pass.txt': null,
  'skeptic.v1.1.0-nested-parens.txt': null,
  'skeptic.v1.1.0-trailing-prose.txt': null,
  'skeptic.v1.0.x.txt': 'S-1 does not follow the item\'s shape',
  'skeptic.hard-without-gate.txt': 'a hard blocker cites the Studio gate check that refuses it',
  'skeptic.placeholder.txt': "template's placeholders <what>",
  'skeptic.dup-withdrawn.txt': 'S-1 is listed twice',
  'skeptic.pass-with-hard.txt': 'a hard blocker ends it',
  'advocate.v1.1.0.txt': null,
  'advocate.v1.1.0-second-pass.txt': null,
  'advocate.v1.0.x.txt': 'PROPOSAL does not follow its shape',
  'advocate.proposal-unquoted.txt': 'PROPOSAL does not follow its shape',
  'signal-architect.v1.1.0.txt': null,
  'signal-architect.v1.0.1.txt': 'Q1 Should the stop',
  'signal-architect.trailing-prose.txt': 'end the report after its last section',
  'signal-architect.posture.txt': 'never ask how strict or critical the team should be',
  'signal-architect.posture-words.txt': 'never ask how strict or critical the team should be',
  'signal-architect.check-id-option.txt': 'never offer a Studio check or an objection',
  'signal-architect.three-questions.txt': 'QUESTIONS holds 3 items: two at most',
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

test('the command runs its check when reached through a symlinked path', async () => {
  const { spawnSync } = await import('node:child_process');
  const { mkdtempSync, symlinkSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const dir = mkdtempSync(join(tmpdir(), 'check-report-'));
  try {
    symlinkSync(ROOT, join(dir, 'ws'));
    const bad = join(REPORTS, 'skeptic.v1.0.x.txt');
    const runs = [
      [join(dir, 'ws', 'bin', 'check-report'), 'skeptic', bad],
      [process.execPath, join(dir, 'ws', 'bin', 'check-report.mjs'), 'skeptic', bad],
      [process.execPath, join(dir, 'ws', 'bin', 'check-release.mjs')],
      // A link to the command itself, as a model may make one beside its work.
      [join(dir, 'cr'), 'skeptic', bad],
    ];
    symlinkSync(join(ROOT, 'bin', 'check-report'), join(dir, 'cr'));
    for (const argv of runs) {
      const run = spawnSync(argv[0], argv.slice(1));
      assert.notEqual(run.stdout.toString(), '', `${argv.join(' ')} printed its result`);
    }
    assert.equal(spawnSync(runs[0][0], runs[0].slice(1)).status, 1);
    assert.equal(spawnSync(runs[1][0], runs[1].slice(1)).status, 1);
    const linked = spawnSync(runs[3][0], runs[3].slice(1));
    assert.equal(linked.status, 1, linked.stderr.toString());
    assert.match(linked.stdout.toString(), /does not follow its format/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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
    'one retry in a turn',
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

test('a persona holding the dry-run tool by its bridge name is held to the dry-run sentence too', async () => {
  const { cpSync, mkdtempSync, rmSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  assert.equal(holdsDryRun(['Read', 'dry_run_script']), true);
  assert.equal(holdsDryRun(['Read', 'mcp__studio__dry_run_script']), true);
  assert.equal(holdsDryRun(['Read', 'Grep']), false);
  assert.equal(holdsDryRun(['mcp__studio__dry_run_script_v2']), false);
  const dir = mkdtempSync(join(tmpdir(), 'check-release-'));
  try {
    cpSync(ROOT, dir, { recursive: true, filter: (src) => !src.includes(`${'/'}.git`) });
    const persona = join(dir, '.claude', 'agents', 'signal-architect.md');
    const text = readFileSync(persona, 'utf8');
    const tools = /^tools:\s*(.*)$/m.exec(text)[1];
    const withTool = text.replace(/^tools:.*$/m, `tools: ${tools}, mcp__studio__dry_run_script`);
    writeFileSync(persona, withTool);
    const release = JSON.parse(readFileSync(join(dir, 'release.json'), 'utf8'));
    const entry = release.personas.find((p) => p.id === 'signal-architect');
    entry.tools = [...entry.tools, 'mcp__studio__dry_run_script'];
    writeFileSync(join(dir, 'release.json'), `${JSON.stringify(release, null, 2)}\n`);
    const refused = checkRelease(dir);
    assert.ok(
      refused.some((p) => p.startsWith('signal-architect: holds dry_run_script')),
      JSON.stringify(refused),
    );
    writeFileSync(persona, withTool.replace(/\n## What you hand back/, `\n${DRY_RUN_SENTENCE}\n\n## What you hand back`));
    assert.deepEqual(checkRelease(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('check-report exits 2, never 1, when the check itself breaks', async () => {
  const { spawnSync } = await import('node:child_process');
  const { cpSync, mkdtempSync, rmSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const dir = mkdtempSync(join(tmpdir(), 'check-report-broken-'));
  try {
    cpSync(join(ROOT, 'bin'), join(dir, 'bin'), { recursive: true });
    cpSync(join(ROOT, 'formats'), join(dir, 'formats'), { recursive: true });
    // A format the grammar cannot compile: the check breaks, the report is not judged.
    const format = JSON.parse(readFileSync(join(dir, 'formats', 'skeptic.json'), 'utf8'));
    format.sections[1].item.pattern = '(';
    writeFileSync(join(dir, 'formats', 'skeptic.json'), JSON.stringify(format));
    const run = spawnSync(join(dir, 'bin', 'check-report'), ['skeptic', join(REPORTS, 'skeptic.v1.1.0.txt')]);
    assert.equal(run.status, 2, run.stdout.toString() + run.stderr.toString());
    assert.match(run.stdout.toString(), /check-report: the check itself failed/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a format retry is uncounted, one per teammate per turn, and a second pass names every first-pass id', () => {
  // The maintainers' decision, 2026-10-21: a teammate's one format retry does not count against the
  // delegation caps, so a requested two-round debate keeps its second round; a second report off
  // its format is not retried again.
  const lead = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8').replace(/\s+/g, ' ');
  assert.ok(!lead.includes('A format retry is a delegation too, and counts'), 'a retry no longer counts');
  assert.ok(!lead.includes('at most twice'), 'never two retries for one report');
  assert.ok(
    lead.includes('A format retry is not a delegation and does not count against these caps'),
    'a retry is uncounted',
  );
  assert.ok(lead.includes('one retry for each teammate in a turn'), 'one retry per teammate per turn');
  assert.ok(
    lead.includes('a requested two-round debate keeps its second round'),
    'the debate keeps its second round',
  );
  assert.ok(
    lead.includes('If the retried report fails the check too, never brief that teammate again for its format'),
    'a second report off its format is not retried',
  );
  assert.ok(
    lead.includes('When the check fails and that teammate\'s retry is unspent'),
    'the retry is conditional on the bound, before it is described',
  );
  assert.ok(
    lead.includes('when the Skeptic\'s retry fails too, brief no Advocate'),
    'a Skeptic whose retry fails leaves no debate, said',
  );
  assert.ok(
    lead.includes('every objection id of its first report is under `OBJECTIONS` or `WITHDRAWN`'),
    'the Lead Quant compares the ids before relaying',
  );
  const skeptic = readFileSync(join(ROOT, '.claude', 'agents', 'skeptic.md'), 'utf8').replace(/\s+/g, ' ');
  assert.ok(skeptic.includes('never drop one'), 'the Skeptic never drops an objection silently');
  const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8').replace(/\s+/g, ' ');
  assert.ok(!changelog.includes('a retry counts against the turn'), 'the changelog no longer says a retry counts');
  assert.ok(changelog.includes('one retry for each teammate in a turn'), 'the changelog states the rule');
});
