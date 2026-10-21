#!/usr/bin/env node
// Checks a teammate's report against its format (formats/<persona>.json), the same grammar the
// Studio reads reports with. Usage:
//
//   bin/check-report <persona> [file]      (the report on standard input when no file is given)
//
// Exit 0: the report follows its format. Exit 1: it does not; every reason is printed, then the
// format's template. Exit 2: the persona has no format, or the report could not be read.
//
// The grammar is data: each format names its sections (a label as the persona writes it, at the
// start of a line), the kind of each (enum, items, lines, text), whether it is required, and for an
// item or a text the regular expression its content follows. `lints` are further checks of the
// fields those expressions name. Nothing here knows a persona by name.

import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ the grammar */

/** A line with its markdown dressing taken off: heading marks, bullets, emphasis. */
function undress(line) {
  return line
    .trim()
    .replace(/^#{1,6}\s+/, '')
    .replace(/^(?:[-*•]|\d+[.)])\s+/, '')
    .replace(/^\*\*(.*?)\*\*:?/, (_m, inner) => inner)
    .replace(/^__(.*?)__:?/, (_m, inner) => inner)
    .trim();
}

/** The section a line opens, with its inline content, or null. */
function headerOf(line, format) {
  const cleaned = undress(line);
  for (const section of format.sections) {
    if (!cleaned.startsWith(section.label)) continue;
    const rest = cleaned.slice(section.label.length);
    if (/^[A-Za-z0-9]/.test(rest)) continue;
    const m = /^\s*(?:\([^)]*\))?\s*(?:(?::|[—–-]+)\s*(.*))?$/s.exec(rest);
    if (m === null) continue;
    const inline = (m[1] ?? '').trim();
    return { section, inline: inline === '' ? null : inline };
  }
  return null;
}

/** The report cut at its section headers; text before the first header is not read. */
function splitSections(text, format, errors) {
  const sections = new Map();
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const header = headerOf(line, format);
    if (header !== null) {
      const copy = { inline: header.inline, lines: [] };
      const first = sections.get(header.section.key);
      if (first !== undefined) {
        if (header.section.kind !== 'enum') {
          errors.push(`${header.section.label} is written twice; write each section once.`);
        } else {
          first.also = [...(first.also ?? []), copy];
        }
      } else {
        sections.set(header.section.key, copy);
      }
      current = copy;
      continue;
    }
    if (current !== null) current.lines.push(line);
  }
  return sections;
}

const FENCE_LINE = /^\s*```[\w-]*\s*$/;
const NONE = /^(?:none|n\/a|—|-|nothing)\.?$/i;

function bodyOf(raw) {
  return [...(raw.inline === null ? [] : [raw.inline]), ...raw.lines]
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== '' && !FENCE_LINE.test(line));
}

const ENUM_LINE = /^[*`]*([a-z]+)[*`]*\.?(?:\s*\(([^)]*)\))?\.?(?:\s*[—–-]+\s(.*))?$/;
const escaped = (word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const NOT_OFFERED_BEFORE = String.raw`(?:\bnot|n['’]t|\bpast|\bjustify|\bthan|\bshort\s+of|\bbeyond)\s+(?:an?\s+)?\W{0,2}`;

function offersAnother(rest, later, others) {
  for (const other of others) {
    const word = escaped(other);
    const named = new RegExp(String.raw`\b${word}\b`, 'gi');
    const notOffered = new RegExp(String.raw`${NOT_OFFERED_BEFORE}${word}\b`, 'gi');
    for (const text of [rest, ...later]) {
      if ((text.match(named) ?? []).length > (text.match(notOffered) ?? []).length) return true;
    }
  }
  return false;
}

function enumWordOf(raw, values) {
  const body = bodyOf(raw);
  const match = ENUM_LINE.exec((body[0] ?? '').trim().toLowerCase());
  const word = match?.[1] ?? '';
  if (!values.includes(word)) return null;
  const rest = [match?.[2] ?? '', match?.[3] ?? ''].join(' ');
  return offersAnother(
    rest,
    body.slice(1),
    values.filter((v) => v !== word),
  )
    ? null
    : word;
}

function isCaption(inline, item) {
  const text = undress(inline).replace(/`/g, '').trim();
  if (!text.endsWith(':')) return false;
  const loose = new RegExp(`^(?:${item.id.replace(/-/g, '-?')})(?![A-Za-z])`, 'i');
  return !loose.test(text);
}

/** An items section's items, or a reason it has none the grammar can read. */
function itemsOf(body, item) {
  const lines = body.map(undress).filter((line) => line !== '');
  if (lines.length === 1 && NONE.test(lines[0] ?? '')) return { items: [] };
  const opens = new RegExp(`^(${item.id})(?![A-Za-z0-9])`);
  const items = [];
  for (const line of lines) {
    const m = opens.exec(line);
    if (m !== null) {
      items.push({ displayId: m[1] ?? '', lines: [line] });
      continue;
    }
    const open = items.at(-1);
    if (open === undefined) return { error: `"${clip(line)}" comes before any item` };
    open.lines.push(line);
  }
  if (items.length === 0 && lines.length > 0) return { error: 'no line opens an item' };
  return { items: items.map(({ displayId, lines: l }) => ({ displayId, text: l.join('\n') })) };
}

function fieldsOf(text, pattern) {
  const m = new RegExp(pattern).exec(text);
  if (m?.groups === undefined) return null;
  const out = {};
  for (const [name, value] of Object.entries(m.groups)) {
    if (typeof value === 'string') out[name] = value.trim();
  }
  return out;
}

const clip = (text, n = 90) => {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > n ? `${flat.slice(0, n - 1)}…` : flat;
};

/** The template's line for an items section: the first template line that opens such an item. */
function templateItemLine(format, section) {
  const opens = new RegExp(`^\\s*(?:${section.item.id})(?![A-Za-z0-9])`);
  return (format.template ?? []).find((line) => opens.test(line))?.trim() ?? null;
}

/**
 * Every reason the report is off its format (empty when it follows it), and the fields each
 * section's items and texts gave, for the lints.
 */
export function checkReport(text, format) {
  const errors = [];
  const fields = {};
  const enums = {};
  const raw = splitSections(text, format, errors);
  for (const section of format.sections) {
    const found = raw.get(section.key);
    if (found === undefined) {
      if (section.required) {
        errors.push(`It has no ${section.label} section: write "${section.label}:" at the start of a line.`);
      }
      continue;
    }
    const body = bodyOf(found);
    // A section whose first line is only a bracketed placeholder ("RISK DRAFT: <stop, target, …>")
    // copied the template, this release's or an earlier one's, instead of answering it.
    const opening = (body[0] ?? '').trim();
    if (/^<[^<>]{2,}>$/.test(opening)) {
      errors.push(`${section.label} holds a template placeholder ("${clip(opening, 60)}"), not your words.`);
      continue;
    }
    switch (section.kind) {
      case 'enum': {
        const values = section.values ?? [];
        const word = enumWordOf(found, values);
        enums[section.key] = word;
        if (word === null) {
          errors.push(
            `${section.label} names none, or more than one, of ${values.join(' | ')}: write exactly one, first on its line.`,
          );
        } else if ((found.also ?? []).some((copy) => enumWordOf(copy, values) !== word)) {
          errors.push(`${section.label} is written twice with different values.`);
        }
        break;
      }
      case 'items': {
        const first = (body[0] ?? '').trim();
        if (
          section.item.numbered === true &&
          /^\s*\d+[.)]\s+/.test(first) &&
          !new RegExp(`^(?:${section.item.id})(?![A-Za-z0-9])`).test(undress(first))
        ) {
          errors.push(`${section.label} is a numbered list; open each item with its id instead.`);
          break;
        }
        const read = itemsOf(
          found.inline !== null && isCaption(found.inline, section.item)
            ? bodyOf({ inline: null, lines: found.lines })
            : body,
          section.item,
        );
        if (read.error !== undefined) {
          const line = templateItemLine(format, section);
          errors.push(
            `${section.label}: ${read.error}.${line === null ? '' : ` Open every item with its id, as: ${line}`}`,
          );
          break;
        }
        const got = [];
        for (const item of read.items) {
          if (section.item.closed !== undefined && fieldsOf(item.text, section.item.closed) !== null) {
            continue;
          }
          const f = fieldsOf(item.text, section.item.pattern);
          if (f === null) {
            const line = templateItemLine(format, section);
            // Lines under an item continue it: prose after the report's last section runs on
            // into its last item, and a line that alone would follow the shape no longer does.
            const first = item.text.split('\n')[0] ?? '';
            const runsOn = first !== item.text && fieldsOf(first, section.item.pattern) !== null;
            errors.push(
              `${section.label}: ${item.displayId} does not follow the item's shape ("${clip(item.text)}").${runsOn ? ' Its first line does: the lines under it run on into it; end the report after its last section, with nothing below it.' : ''}${line === null ? '' : ` Write it as: ${line}`}`,
            );
            continue;
          }
          got.push({ ...f, displayId: f.id ?? item.displayId });
        }
        fields[section.key] = got;
        break;
      }
      case 'lines':
        break;
      case 'text': {
        const value = body
          .map((line) => line.trim())
          .join('\n')
          .trim();
        if (section.required && value === '') {
          errors.push(`${section.label} is empty.`);
          break;
        }
        if (section.none === true && NONE.test(value)) break;
        if (section.pattern !== undefined && value !== '') {
          const f = fieldsOf(value, section.pattern);
          if (f === null) {
            const line = (format.template ?? []).find((l) => l.trim().startsWith(section.label));
            errors.push(
              `${section.label} does not follow its shape ("${clip(value)}").${line === undefined ? '' : ` Write it as: ${line.trim()}`}`,
            );
          } else {
            fields[section.key] = [f];
          }
        }
        break;
      }
      default:
        errors.push(`The format names a section kind this check does not know: ${section.kind}.`);
    }
  }
  // Ids the format says are one objection, answer or question each: never twice across the listed
  // sections (an objection both standing and withdrawn, or listed twice).
  for (const group of format.distinct ?? []) {
    const seen = new Set();
    for (const key of group) {
      for (const f of fields[key] ?? []) {
        const id = String(f.displayId ?? '').toUpperCase();
        if (seen.has(id)) {
          const labels = group.map((k) => format.sections.find((s) => s.key === k)?.label ?? k);
          errors.push(`${f.displayId} is listed twice (${labels.join(', ')}): give each its place once.`);
        }
        seen.add(id);
      }
    }
  }
  return { errors, fields, enums };
}

/** The lints' reasons over the fields the grammar read. */
export function lintReport(format, fields, enums = {}) {
  const errors = [];
  for (const lint of format.lints ?? []) {
    if (lint.enum !== undefined) {
      // A value another section must hold when an item is of a kind ("a hard blocker ends it").
      const hit = (fields[lint.section] ?? []).find((f) =>
        new RegExp(lint.when.matches, lint.flags).test(f[lint.when.field] ?? ''),
      );
      if (hit !== undefined && enums[lint.enum] !== lint.equals) {
        errors.push(`${hit.displayId}: ${lint.message}.`);
      }
      continue;
    }
    for (const f of fields[lint.section] ?? []) {
      if (lint.when !== undefined && !new RegExp(lint.when.matches, lint.flags).test(f[lint.when.field] ?? '')) {
        continue;
      }
      const value = f[lint.field];
      if (value === undefined) {
        if (lint.optional === true) continue;
      }
      const v = value ?? '';
      const bad =
        (lint.matches !== undefined && !new RegExp(lint.matches, lint.flags).test(v)) ||
        (lint.notMatches !== undefined && new RegExp(lint.notMatches, lint.flags).test(v));
      if (bad) errors.push(`${f.displayId ?? lint.section}: ${lint.message}.`);
    }
  }
  return errors;
}

/** A template's placeholders (`<…>`) left in the report as written. */
export function placeholdersIn(text, format) {
  const found = new Set();
  for (const line of format.template ?? []) {
    for (const m of line.matchAll(/<[^<>]{2,}>/g)) {
      if (text.includes(m[0])) found.add(m[0]);
    }
  }
  return [...found];
}

/** The whole check: every reason, in order. */
export function reasons(text, format) {
  const { errors, fields, enums } = checkReport(text, format);
  const out = [...errors];
  if (errors.length === 0) out.push(...lintReport(format, fields, enums));
  const left = placeholdersIn(text, format);
  if (left.length > 0) {
    out.push(`It still holds the template's placeholder${left.length > 1 ? 's' : ''} ${left.join(', ')}: write your own words in place of each.`);
  }
  return out;
}

export function loadFormat(persona) {
  if (!/^[a-z][a-z-]*$/.test(persona)) return null;
  try {
    return JSON.parse(readFileSync(join(ROOT, 'formats', `${persona}.json`), 'utf8'));
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ the command */

function main(argv) {
  const [persona, file] = argv;
  if (persona === undefined || persona === '--help' || persona === '-h') {
    process.stdout.write('Usage: bin/check-report <persona> [file]   (the report on standard input without a file)\n');
    return persona === undefined ? 2 : 0;
  }
  const format = loadFormat(persona);
  if (format === null) {
    process.stdout.write(`check-report: no format for "${persona}" in formats/.\n`);
    return 2;
  }
  let text;
  try {
    text = readFileSync(file ?? 0, 'utf8');
  } catch (err) {
    process.stdout.write(`check-report: could not read the report (${err.message}).\n`);
    return 2;
  }
  const why = reasons(text, format);
  if (why.length === 0) {
    process.stdout.write(`check-report: the ${persona} report follows its format (${format.id} ${format.version}).\n`);
    return 0;
  }
  process.stdout.write(
    [
      `check-report: the ${persona} report does not follow its format (${format.id} ${format.version}):`,
      ...why.map((w) => `- ${w}`),
      'The format, from the "What you hand back" block:',
      ...format.template.map((line) => `  ${line}`),
      '',
    ].join('\n'),
  );
  return 1;
}

/** Whether this file is the script node was asked to run, through any symlink on either path. */
function isMain() {
  if (process.argv[1] === undefined) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMain()) {
  process.exitCode = main(process.argv.slice(2));
}
