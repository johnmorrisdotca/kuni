// Splits a snapshot difference into a real value change and a subset gap. A row whose item was never
// kept is a gap, and a gap is not a change.

const round = (value: unknown): unknown => (typeof value === "number" ? Math.round(value * 1e8) / 1e8 : Array.isArray(value) ? value.map(round) : value);

export const subjectId = (row: unknown): string | null => {
  if (!Array.isArray(row) || row.length === 0) return null;
  const first = row[0];
  if (typeof first === "string" && /^Q\d+$/.test(first)) return first;
  if (typeof first === "number" && Number.isInteger(first) && first > 0) return `Q${first}`;
  for (const cell of row) if (typeof cell === "string" && /^Q\d+$/.test(cell)) return cell;
  return null;
};

export interface RowSplit {
  same: number;
  precision: number;
  changed: number;
  gaps: number;
  onlyDump: number;
  samples: string[];
}

const take = (bag: Map<string, number>, key: string): boolean => {
  const count = bag.get(key) ?? 0;
  if (count === 0) return false;
  if (count === 1) bag.delete(key);
  else bag.set(key, count - 1);
  return true;
};

/** One code, or one numbered item. `present` holds the subset's Q-ids. */
export const splitRows = (label: string, pinned: unknown, next: unknown, present: ReadonlySet<string>): RowSplit => {
  const result: RowSplit = { same: 0, precision: 0, changed: 0, gaps: 0, onlyDump: 0, samples: [] };
  const left = Array.isArray(pinned) ? pinned : [];
  const right = Array.isArray(next) ? next : [];
  if (pinned !== undefined && JSON.stringify(pinned) === JSON.stringify(next)) {
    result.same = 1;
    return result;
  }
  if (pinned !== undefined && next !== undefined && JSON.stringify(round(pinned)) === JSON.stringify(round(next))) {
    result.precision = 1;
    return result;
  }
  const bag = new Map<string, number>();
  for (const row of right) bag.set(JSON.stringify(row), (bag.get(JSON.stringify(row)) ?? 0) + 1);
  let gapRows = 0;
  let changeRows = 0;
  for (const row of left) {
    const key = JSON.stringify(row);
    if (take(bag, key)) continue;
    const subject = subjectId(row);
    if (subject !== null && !present.has(subject)) gapRows += 1;
    else changeRows += 1;
  }
  const dumpRows = [...bag.values()].reduce((sum, count) => sum + count, 0);
  if (pinned === undefined) result.onlyDump = 1;
  else if (changeRows > 0 || dumpRows > 0) result.changed = 1;
  else if (gapRows > 0) result.gaps = 1;
  if (result.changed === 1 || result.gaps === 1 || result.onlyDump === 1) {
    const kind = result.gaps === 1 ? "gap" : result.onlyDump === 1 ? "only in the dump" : "changed";
    const shown = (value: unknown): string => (JSON.stringify(value) ?? "none").slice(0, 180);
    const detail = result.changed === 1 ? ` | pinned ${shown(pinned)} | dump ${shown(next)}` : ` (${gapRows} gap rows)`;
    result.samples.push(`- ${label}: ${kind}${detail}`);
  }
  return result;
};
