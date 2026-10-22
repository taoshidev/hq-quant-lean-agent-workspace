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
  assert.equal(readFileSync(join(ROOT, 'VERSION'), 'utf8').trim(), '1.3.0');
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
