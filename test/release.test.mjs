// The release's own checks: run with `node --test test/release.test.mjs`. No network, no dependencies.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadFormat, reasons } from '../bin/check-report.mjs';
import {
  DRY_RUN_SENTENCE,
  PROPOSAL_TOOLS,
  checkRelease,
  handBackBlock,
  holdsDryRun,
  personaFiles,
  proposalTool,
} from '../bin/check-release.mjs';

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
  assert.equal(readFileSync(join(ROOT, 'VERSION'), 'utf8').trim(), '1.4.0');
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
    // The release's Signal Architect holds the tool by its bridge name; without the sentence in its
    // body the release is refused, and with it back the release is consistent again.
    const persona = join(dir, '.claude', 'agents', 'signal-architect.md');
    const text = readFileSync(persona, 'utf8');
    assert.ok(holdsDryRun(/^tools:\s*(.*)$/m.exec(text)[1].split(', ')), 'the release grants the tool');
    assert.ok(text.includes(DRY_RUN_SENTENCE));
    writeFileSync(persona, text.replace(`- ${DRY_RUN_SENTENCE}\n`, ''));
    const refused = checkRelease(dir);
    assert.ok(
      refused.some((p) => p.startsWith('signal-architect: holds dry_run_script')),
      JSON.stringify(refused),
    );
    writeFileSync(persona, text);
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

const TEAM_CHECKS = {
  skeptic: ['skeptic_findings', 'tripwires', 'warmup_depth', 'candidate_critique'],
  advocate: ['advocate_answer', 'candidate_critique'],
  'data-scout': ['warmup_depth'],
};

// 1.2.0: the Studio's tools in a conversation Glitch opens with them. Glitch's own test checks every
// name against its tool registry, which this public repository never holds.
const BRIDGE_TOOLS = {
  'data-scout': ['read_catalogue', 'read_strategy', 'read_screen', ...teamChecks('data-scout')],
  'signal-architect': ['read_dsl_reference', 'read_components', 'read_strategy', 'check_script', 'dry_run_script'],
  'risk-architect': ['read_strategy', 'check_script', 'check_change'],
  'research-engineer': ['list_runs', 'read_run_window', 'read_review', 'read_observation'],
  skeptic: ['check_script', 'read_strategy', 'list_runs', 'read_run_window', ...teamChecks('skeptic')],
  advocate: ['read_strategy', 'list_runs', ...teamChecks('advocate')],
};

// 1.3.0: the team checks, the Studio checks the note carries as tools a teammate calls (swarm
// design K-b): each answers with the same ids, sentences and digests as the note's block.
function teamChecks(id) {
  return TEAM_CHECKS[id] ?? [];
}

test("each persona's tools are its workspace reads plus its Studio tools under the server's name, and none proposes", () => {
  for (const { id, fields } of personaFiles(ROOT)) {
    assert.deepEqual(
      fields.tools,
      ['Read', 'Grep', 'Glob', ...BRIDGE_TOOLS[id].map((name) => `mcp__studio__${name}`)],
      `${id}'s tools`,
    );
    for (const tool of fields.tools) {
      assert.equal(proposalTool(tool), null, `${id} lists ${tool}`);
    }
  }
  assert.equal(proposalTool('mcp__studio__author_strategy'), 'author_strategy');
  assert.equal(proposalTool('revise_strategy'), 'revise_strategy');
  assert.equal(proposalTool('mcp__studio__read_strategy'), null);
  assert.equal(PROPOSAL_TOOLS.length, 17);
  assert.ok(PROPOSAL_TOOLS.includes('freeze') && PROPOSAL_TOOLS.includes('adopt_candidate'));
});

test('check-release refuses a persona that lists a proposal tool', async () => {
  const { cpSync, mkdtempSync, rmSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const dir = mkdtempSync(join(tmpdir(), 'check-release-propose-'));
  try {
    cpSync(ROOT, dir, { recursive: true, filter: (src) => !src.includes(`${'/'}.git`) });
    const persona = join(dir, '.claude', 'agents', 'advocate.md');
    const text = readFileSync(persona, 'utf8');
    const tools = /^tools:\s*(.*)$/m.exec(text)[1];
    writeFileSync(persona, text.replace(/^tools:.*$/m, `tools: ${tools}, mcp__studio__revise_strategy`));
    const release = JSON.parse(readFileSync(join(dir, 'release.json'), 'utf8'));
    const entry = release.personas.find((p) => p.id === 'advocate');
    entry.tools = [...entry.tools, 'mcp__studio__revise_strategy'];
    writeFileSync(join(dir, 'release.json'), `${JSON.stringify(release, null, 2)}\n`);
    const refused = checkRelease(dir);
    assert.ok(refused.includes('advocate: lists mcp__studio__revise_strategy, a proposal: only the Lead Quant proposes'), JSON.stringify(refused));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('hard rule 1 keeps its prohibition word for word, names its two sources, and carries the dry-run sentence', () => {
  const lead = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8').replace(/\s+/g, ' ');
  const rule = /1\. \*\*No figures the Studio has not measured\.\*\*(.*?) 2\. \*\*Propose, never apply/.exec(lead);
  assert.ok(rule, 'hard rule 1 is where it was');
  const text = rule[1];
  for (const kept of [
    'Never state, estimate or work out a backtest figure: a return, a win rate, a drawdown, a trade count, a ratio.',
    'The Studio measures research itself, on its own bars.',
    '"It should be profitable" is a figure too.',
  ]) {
    assert.ok(text.includes(kept), `hard rule 1 keeps "${kept}"`);
  }
  assert.ok(
    text.includes(
      "The only figures you may quote are the ones given by this turn's note, or a Studio tool's result this turn, exactly as given and said as the run's.",
    ),
    'its sources are the note and a Studio tool result this turn',
  );
  assert.ok(text.includes(DRY_RUN_SENTENCE), 'hard rule 1 carries the dry-run sentence');
  assert.ok(!/stated|improve the figures/.test(text.slice(text.indexOf(DRY_RUN_SENTENCE))), 'the struck clause is gone');
});

test("'Where you are' says when to use the Studio's tools and when the change block", () => {
  const lead = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8').replace(/\s+/g, ' ');
  const where = lead.slice(lead.indexOf('## Where you are'), lead.indexOf('## Prime directive'));
  assert.ok(
    where.includes(
      'When your tool list has `mcp__studio__*` tools, read the Studio with them, check before you propose, and propose with `author_strategy`, `revise_strategy` or the edit tools. Without them, use the change block.',
    ),
    where,
  );
});

test('docs/workflow.md carries the drafting rules for Describe and Own it, and says where they hold', () => {
  const flow = readFileSync(join(ROOT, 'docs', 'workflow.md'), 'utf8').replace(/\s+/g, ' ');
  for (const needle of [
    'a drafting turn (a strategy with no rules yet)',
    'Keep every market, timeframe and indicator length the trader stated; never change one to pass a check or to fit the live feed.',
    'If the live feed cannot decide the draft yet, say so; if you would suggest an alternative, describe it in words and let the trader ask for it.',
    'List what you could not build, and why, in `unbuilt`.',
    'State no figures.',
    'Outside a drafting turn, you may propose changing a value the trader stated, as a card that says so.',
  ]) {
    assert.ok(flow.includes(needle), `workflow.md says "${needle}"`);
  }
});

test('a persona that reads the Studio is told so, and its figures rule names the same two sources as hard rule 1', () => {
  for (const { id, body } of personaFiles(ROOT)) {
    const flat = body.replace(/\s+/g, ' ');
    assert.ok(!flat.includes('You see nothing of the Studio yourself'), `${id} no longer says it sees nothing of the Studio`);
    assert.ok(flat.includes('When your tool list has `mcp__studio__*` tools'), `${id} says what to do with its Studio tools`);
  }
});

/**
 * The Studio tools whose results the Studio's figure check accepts as a source (its catalogue's
 * figure sources), and check_script, whose live depth alone is one. A teammate never sees the note
 * that narrows hard rule 1's "a Studio tool's result", so its own figures rule names these and no
 * other tool (review round 2).
 */
const FIGURE_SOURCES = new Set(['read_strategy', 'list_runs', 'read_run_window', 'read_review', 'read_observation']);
const LIVE_DEPTH_TOOLS = ['check_script', 'warmup_depth'];

/** A persona's figures rule: the hard-rules bullet that says which figures it may quote. */
function figuresRule(body) {
  const bullets = body.split(/\n(?=- )/).map((b) => b.replace(/\s+/g, ' ').trim());
  const rule = bullets.filter((b) => b.startsWith('- ') && /No figures but|\*\*No numbers you were not handed\.\*\*/.test(b));
  assert.equal(rule.length, 1, `one figures rule, found ${rule.length}`);
  return rule[0];
}

test("a persona's figures rule names, of its Studio tools, exactly its figure sources (check_script for its live depth)", () => {
  for (const { id, body, fields } of personaFiles(ROOT)) {
    const rule = figuresRule(body);
    assert.ok(!rule.includes("a Studio tool's result"), `${id}: never "a Studio tool's result" (any tool), which the figure check does not accept`);
    const studio = fields.tools.filter((t) => t.startsWith('mcp__')).map((t) => t.replace(/^mcp__[^_]+__/, ''));
    const expected = studio.filter((t) => FIGURE_SOURCES.has(t) || LIVE_DEPTH_TOOLS.includes(t)).sort();
    const named = [...new Set([...rule.matchAll(/`([a-z_]+)`/g)].map((m) => m[1]))].sort();
    if (studio.some((t) => !FIGURE_SOURCES.has(t))) {
      assert.ok(rule.includes("no other tool's result is a figure you may quote"), `${id}: says its other tools' results are no figures to quote`);
    }
    assert.deepEqual(named, expected, `${id}'s figures rule names its figure sources and no other tool`);
    for (const tool of LIVE_DEPTH_TOOLS) {
      if (expected.includes(tool)) {
        assert.ok(rule.includes(`\`${tool}\`'s live depth`), `${id}: ${tool} only for its live depth`);
      }
    }
    assert.ok(/said as/.test(rule), `${id}: says each figure as whose it is`);
  }
});

test('the Research Engineer is told read_review cannot be used in this release, never that a result gives the id', () => {
  const body = personaFiles(ROOT).find((p) => p.id === 'research-engineer').body.replace(/\s+/g, ' ');
  assert.ok(!body.includes('which only a Studio result can give you'), 'no promised id source');
  assert.ok(body.includes('none of your tools gives one and no brief carries one, so leave it unused'), 'read_review left unused');
});

test('check-release refuses a persona with no tools line, or a grant of a whole server', async () => {
  const { cpSync, mkdtempSync, rmSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const dir = mkdtempSync(join(tmpdir(), 'check-release-grant-'));
  try {
    cpSync(ROOT, dir, { recursive: true, filter: (src) => !src.includes(`${'/'}.git`) });
    const persona = join(dir, '.claude', 'agents', 'advocate.md');
    const text = readFileSync(persona, 'utf8');
    const release = JSON.parse(readFileSync(join(dir, 'release.json'), 'utf8'));
    const entry = release.personas.find((p) => p.id === 'advocate');
    const before = entry.tools;
    // No tools line (and none in release.json): Claude Code then grants every tool, proposals included.
    writeFileSync(persona, text.replace(/^tools:.*\n/m, ''));
    delete entry.tools;
    writeFileSync(join(dir, 'release.json'), `${JSON.stringify(release, null, 2)}\n`);
    assert.ok(checkRelease(dir).includes('advocate: has no tools line: Claude Code would grant it every tool, proposals included'), JSON.stringify(checkRelease(dir)));
    for (const grant of ['mcp__studio', 'mcp__studio__*', '*']) {
      writeFileSync(persona, text.replace(/^tools:\s*(.*)$/m, (_m, t) => `tools: ${t}, ${grant}`));
      entry.tools = [...before, grant];
      writeFileSync(join(dir, 'release.json'), `${JSON.stringify(release, null, 2)}\n`);
      assert.ok(
        checkRelease(dir).includes(`advocate: lists ${grant}, a grant of more than one tool: name each tool`),
        `${grant}: ${JSON.stringify(checkRelease(dir))}`,
      );
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the team section: teammates share the turn\'s limits, and only the six are delegated to', () => {
  const lead = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8').replace(/\s+/g, ' ');
  assert.ok(lead.includes('count against the same limits of the turn as yours'), 'shared limits');
  assert.ok(
    lead.includes('Delegate only to the six teammates in the table, never to a general-purpose sub-agent'),
    'no general-purpose delegation',
  );
  assert.ok(
    lead.includes(
      'Without them, use the change block. With them, every proposal the note lists, research and freeze included, goes by its tool.',
    ),
    'the proposal sentence is said for a session with the tools, never after the one without them',
  );
});

test('1.3.0: each teammate holding a team check is told to call it and cite its ids; the constitution says so', () => {
  for (const { id, body, fields } of personaFiles(ROOT)) {
    const held = (TEAM_CHECKS[id] ?? []).filter((t) => fields.tools.includes(`mcp__studio__${t}`));
    assert.deepEqual(held, TEAM_CHECKS[id] ?? [], `${id} holds its team checks`);
    const flat = body.replace(/\s+/g, ' ');
    if (held.length === 0) {
      assert.ok(!/Call the Studio's (live-depth )?checks? yourself/.test(flat), `${id} holds no team check and is not told to call one`);
      continue;
    }
    assert.ok(/\*\*Call the Studio's (live-depth )?checks? yourself\.\*\*/.test(flat), `${id} is told to call its checks`);
    for (const tool of held) assert.ok(flat.includes(`\`${tool}\``), `${id} names ${tool}`);
    assert.ok(flat.includes('Cite the ids'), `${id} cites the ids its checks return`);
  }
  const lead = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8').replace(/\s+/g, ' ');
  assert.ok(lead.includes("also call the Studio's checks themselves"), 'the constitution tells the Lead Quant the teammates call them');
  assert.ok(lead.includes('hand the block all the same'), 'the block is still handed');
});

test('1.3.0: a teammate briefed afresh for its format retry is asked to call its Studio checks again', () => {
  // Walk W-CHECKS-2B T1 (2026-10-22): the Advocate's retry was a fresh agent that called no check and
  // worked from the brief alone, and its report is the one the debate counted. A fresh agent has not
  // seen its earlier calls, so the retry brief asks for them again.
  const lead = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8').replace(/\s+/g, ' ');
  assert.ok(
    lead.includes("A teammate briefed afresh has not seen its earlier calls: when it holds the Studio's checks, ask it to call them again before it rewrites its report"),
    'the retry brief asks a fresh teammate to call its checks again',
  );
  const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8').replace(/\s+/g, ' ');
  assert.ok(changelog.includes('ask it to call them again'), 'the changelog says so');
});

test('1.4.0: a drafting turn puts the card up first and the team reviews it after', () => {
  // Acceptance rewalk 10.6 (2026-10-28): the Studio's script check held the draft 44 s into a drafting
  // turn, and the Lead Quant briefed the Data Scout, the Signal Architect and the Skeptic, then two
  // format retries, before proposing anything; the turn's cost cap cut it with nothing drafted. A
  // proposal held in the turn survives a cut; a draft that was never proposed does not.
  const flat = (path) => readFileSync(join(ROOT, path), 'utf8').replace(/\s+/g, ' ');
  const lead = flat('CLAUDE.md');
  assert.ok(lead.includes('**A drafting turn: the card first.**'), 'the rule has its own paragraph');
  assert.ok(
    lead.includes(
      'as soon as it says the Studio would hold it, propose it with `author_strategy`, before you brief any teammate',
    ),
    'a held check is proposed before any teammate is briefed',
  );
  assert.ok(
    lead.includes("A proposal held in the turn stays the trader's card even if the turn is cut afterwards"),
    'it says why: a held card survives a cut, an unproposed draft does not',
  );
  assert.ok(
    lead.includes('Brief a teammate before the card only when the check refused the script'),
    'teammates come first only for a refused check',
  );
  assert.ok(lead.includes("or when the trader's words ask for one"), 'or when the trader asked');
  assert.ok(
    lead.includes('Once the card is held, teammates may review it'),
    'the team still reviews the draft: it is ordered, not removed',
  );
  assert.ok(
    lead.includes('proposed again with `author_strategy`, which replaces the script proposed earlier in the turn'),
    'a review that changes the script is proposed again',
  );
  assert.ok(
    lead.includes('On a drafting turn the hat is yours before the card goes up'),
    'the skeptic hat is never skipped: the Lead Quant wears it before the card',
  );
  // The team is still the team: six teammates, three on a drafting turn, one retry for each.
  assert.ok(lead.includes('may use three'), 'a drafting turn may still brief three');
  assert.ok(lead.includes('one retry for each teammate in a turn'), 'every turn keeps one retry per teammate');
  const workflow = flat('docs/workflow.md');
  assert.ok(workflow.includes('**Put the card up first.**'), 'the drafting rules say it too');
  const readme = flat('README.md');
  assert.ok(
    readme.includes('From 1.4.0, on a drafting turn'),
    'the control-plane check says what to expect of a drafting turn',
  );
  assert.equal(readFileSync(join(ROOT, 'VERSION'), 'utf8').trim(), '1.4.0');
  const changelog = flat('CHANGELOG.md');
  assert.ok(changelog.includes('## [1.4.0]'), 'the changelog has the release');
  assert.ok(changelog.includes('the card first'), 'the changelog names the rule');
});

test('1.4.0: the Lead Quant adds no rule the trader did not ask for, and without the Studio\'s tools the Skeptic reviews the drafted card', () => {
  // Opus on 1.4.0 (2026-10-28, eight fenced drafting turns, unbuilt-honesty tasks 0039-0046): three
  // drafts were given a stop and no exit, and the Lead Quant added the mirror of the entry as an exit,
  // labelled as its own choice ("You gave a stop but no exit … the smallest exit I can assume"). With
  // `exits` left out the Studio's default applies (no exit rules), and the card says it is the
  // Studio's. And none of the eight fenced drafting turns briefed a teammate: "brief only the
  // teammates that leave you the time to write it" read as leave to brief none.
  const flat = (path) => readFileSync(join(ROOT, path), 'utf8').replace(/\s+/g, ' ');
  const lead = flat('CLAUDE.md');
  // The unasked rule: a bullet of its own under the authoring rules, the loop's default bounded.
  assert.ok(lead.includes('**Write only the rules the trader asked for.**'), 'the rule has its own bullet');
  assert.ok(
    lead.includes(
      'Never add an exit, a filter or any other rule the trader did not ask for, not even the mirror of their entry and not as your labelled choice: leave it out.',
    ),
    'no exit, filter or rule the trader did not ask for, labelled or not',
  );
  assert.ok(
    lead.includes("Left out, the Studio's default applies and the card says it is the Studio's"),
    "what runs instead is the Studio's default, said as the Studio's",
  );
  assert.ok(
    lead.includes('say so in your words and let the trader ask for it'),
    'an exit the Lead Quant thinks is needed is said in words, never built',
  );
  assert.ok(
    lead.includes('An exit the trader asked for in any words is theirs'),
    'an exit asked for in other words is built and quoted',
  );
  assert.ok(
    lead.includes('A default is a value of a rule the trader asked for, never a rule they did not ask for.'),
    "the loop's 'decide on a default' never adds a rule",
  );
  // A drafting turn is any turn on a strategy with no rules yet, whoever started it.
  assert.ok(
    lead.includes('A turn on a strategy with no rules yet is a drafting turn, whoever started it'),
    'a drafting turn is the Studio started one or the trader\'s own message on such a strategy',
  );
  // Review round 1 (self-attack): a trader's question on such a strategy is answered, never drafted.
  assert.ok(
    lead.includes("the trader's own message describing the strategy or asking for its rules; a question alone is answered, not drafted"),
    'a question on a strategy with no rules yet is not a drafting turn',
  );
  const flow = flat('docs/workflow.md');
  assert.ok(
    flow.includes('a question alone is answered, not drafted'),
    'the drafting rules say which turns they hold in',
  );
  // Without the tools: the block first, then the Skeptic, always; its verdict in the reply.
  assert.ok(
    lead.includes(
      'Without the Studio\'s tools the card is your change block: write your words on the draft and the block first, closed, before you brief any teammate.',
    ),
    'the change block is written before any teammate',
  );
  assert.ok(
    lead.includes('The Studio holds a block that closed before the turn is cut, at its time bound or its cost cap.'),
    'a closed block survives a cut',
  );
  assert.ok(
    lead.includes('Then always brief the Skeptic to review the draft in the block'),
    'the Skeptic always reviews a fenced draft once the block is written',
  );
  assert.ok(
    lead.includes('one brief, and its one format retry if `bin/check-report` refuses its report'),
    'bounded: one brief and its one retry',
  );
  assert.ok(
    lead.includes("end your reply, after the block, with the Skeptic's verdict in your own words"),
    "the Skeptic's verdict is said in the reply",
  );
  assert.ok(
    lead.includes('If the turn is cut while the Skeptic works, the card stands.'),
    'the time bound and the cost cap still apply, and the card is already up',
  );
  assert.ok(lead.includes('write no second block'), 'a review that would change the script is said, not proposed twice');
  assert.ok(
    !lead.includes('brief only the teammates that leave you the time to write it'),
    'the sentence read as leave to brief no one is gone',
  );
  // With the tools, as 1.4.0 was: the card first, the team after.
  assert.ok(
    lead.includes('as soon as it says the Studio would hold it, propose it with `author_strategy`, before you brief any teammate'),
    'with the tools, unchanged',
  );
  // The change block's place says so, and the skeptic hat points at the rule.
  assert.ok(
    lead.includes("on a drafting turn without the Studio's tools, before the Skeptic's review: *A drafting turn: the card first*"),
    "'Where you are' says where the block goes on a fenced drafting turn",
  );
  assert.ok(
    lead.includes("without the Studio's tools it always does"),
    "the skeptic hat: the Skeptic's attack always follows a fenced card",
  );
  const workflow = flat('docs/workflow.md');
  assert.ok(workflow.includes('**Write only the rules the trader asked for.**'), 'the drafting rules say it too');
  assert.ok(
    workflow.includes('Without the Studio\'s tools, write the change block first, then brief the Skeptic to review it'),
    'the drafting rules say the fenced order',
  );
  const changelog = flat('CHANGELOG.md');
  assert.ok(changelog.includes('Write only the rules the trader asked for'), 'the changelog names the rule');
  assert.ok(changelog.includes('the Skeptic always reviews the card'), 'the changelog names the fenced review');
  const readme = flat('README.md');
  assert.ok(
    readme.includes('without the Studio\'s tools, expect the change block before the first `Agent` call'),
    'the control-plane check says what to expect of a fenced drafting turn',
  );
});

test("1.4.0: the Skeptic's review of a drafted card is bounded — a short brief carrying the script, the script reviewed as written, one report and its one retry", () => {
  // D14 r5 (2026-10-28, opus, fenced, 1.4.0 @ e97e1877, tasks 0010 0012 0041 0043 0045): the card was up
  // 56-80 s into each turn, and the review then took the rest: p50 344 s, p90 805 s. The Lead Quant
  // spent 31-44 s writing a brief of 1,135-1,493 words (the draft retold in prose, the engine retold,
  // "what I already told the trader", a list of questions, then the checks block); the Skeptic took
  // 152-203 s and handed back 1,271-2,156 words, and two of the five read the workspace beyond its two
  // docs (check-report's source, formats/skeptic.json, persona files) to learn its own format; 0045's
  // format retry re-sent the whole report in a 2,112-word brief and the fresh Skeptic re-read both
  // docs and rewrote every line (about 150 s). Lucas, 2026-10-29: bounded — the script and a short
  // brief, no rebuild, one report and its one format retry, still a real independent review.
  const flat = (path) => readFileSync(join(ROOT, path), 'utf8').replace(/\s+/g, ' ');
  const lead = flat('CLAUDE.md');
  assert.ok(lead.includes("**The Skeptic's review of a draft.**"), 'the bound has its own paragraph');
  assert.ok(
    lead.includes('On a drafting turn, with the Studio\'s tools or without them, the Skeptic reviews the script as written'),
    'on both transports',
  );
  // The brief: short, the script itself, nothing retold.
  assert.ok(
    lead.includes(
      "Brief it short, with these and nothing else: one line saying it reviews the drafted card, the trader's words verbatim, the strategy's assumptions as the note states them in one line, the script whole as the card holds it",
    ),
    'a short brief carrying the script',
  );
  assert.ok(lead.includes('copied, never retold in prose'), 'the script is copied, not paraphrased');
  assert.ok(
    lead.includes('Leave out what you told the trader, your own view of the draft, a retelling of the engine and a list of questions'),
    'nothing that steers or pads the review',
  );
  // The review: as written, no rebuild, read-only checks only.
  assert.ok(
    lead.includes('Ask it to review the script as written: read it, reason about it, and run the read-only checks it holds'),
    'it reads, reasons and may run its read-only checks',
  );
  assert.ok(
    lead.includes('never to rebuild, re-draft or rewrite the strategy, write another script'),
    'no rebuild and no second script',
  );
  assert.ok(
    lead.includes('or read the workspace beyond `docs/pitfalls.md` and `docs/validation.md`'),
    'no exploring the workspace for its own format',
  );
  // One report and its one retry; the retry changes only what the check named.
  assert.ok(lead.includes('It hands back one report, in its format, each finding said once.'), 'one report');
  assert.ok(
    lead.includes('ask it to change only the lines the check names, with no new review'),
    'a format retry rewrites the refused lines, never the review',
  );
  assert.ok(lead.includes('No second pass on a drafting turn.'), 'no second pass');
  // Still the Skeptic's own verdict, and the veto stands; the card stays for the trader.
  assert.ok(
    lead.includes('Never tell it what verdict to reach or which findings to leave out: the verdict is its own.'),
    'an independent review',
  );
  assert.ok(
    lead.includes('A veto stands: say it to the trader as KILLED, with its reasons, and leave the card up for the trader to decide.'),
    'a veto is said as KILLED and the card stays',
  );
  // Without the tools: the Skeptic alone, as the note says (no "up to three" there).
  assert.ok(
    lead.includes('no second pass, and no other teammate on this turn'),
    'a fenced drafting turn briefs the Skeptic alone',
  );
  // The persona is unchanged: its charter already forbids changing the candidate.
  const skeptic = flat('.claude/agents/skeptic.md');
  assert.ok(skeptic.includes('Never modify the candidate: you object; the `signal-architect` and the `advocate` propose.'));
  const workflow = flat('docs/workflow.md');
  assert.ok(
    workflow.includes('The Skeptic reviews the script as written, from a short brief that carries it'),
    'the drafting rules say the bound',
  );
  const changelog = flat('CHANGELOG.md');
  assert.ok(changelog.includes("The Skeptic's review of a draft"), 'the changelog names the bound');
  const readme = flat('README.md');
  assert.ok(
    readme.includes('a Skeptic brief that carries the script whole and no retelling'),
    'the control-plane check says what a drafting turn\'s brief looks like',
  );
});
