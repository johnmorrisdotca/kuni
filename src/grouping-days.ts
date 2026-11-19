// What a body's period says about a day, for src/groupings.ts: a member, not a member, or unknown. Not an entry of its own.

const YEAR = /^\d{4}$/;
const MONTH = /^(\d{4})-(\d{2})$/;

// The last day of a "YYYY-MM", or null when it is not a month. February follows the calendar.
const monthEnd = (value: string): string | null => {
  const match = MONTH.exec(value);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return `${match[1]}-${match[2]}-${String(last).padStart(2, "0")}`;
};

const monthStart = (value: string): string | null => (monthEnd(value) === null ? null : `${value}-01`);

// What one period says about a day: "yes" (a member), "no", or "unknown". A day is "YYYY-MM-DD". A year alone
// ("1975") and a month alone ("1992-12") are read so that a day we call a member was one: a year or a month as
// `since` counts from its last day, a year or a month as `until` up to its first, and the days inside are unknown.
// No `since` at all is unknown.
type Standing = "yes" | "no" | "unknown";
const standing = (since: string | null, until: string | null, on: string): Standing => {
  let begun: Standing;
  const sinceEnd = since === null ? null : monthEnd(since);
  if (since === null) begun = "unknown";
  else if (YEAR.test(since)) begun = on >= `${since}-12-31` ? "yes" : on >= `${since}-01-01` ? "unknown" : "no";
  else if (sinceEnd !== null) begun = on >= sinceEnd ? "yes" : on >= `${since}-01` ? "unknown" : "no";
  else begun = on >= since ? "yes" : "no";
  let over: Standing;
  const untilEnd = until === null ? null : monthEnd(until);
  if (until === null) over = "yes";
  else if (YEAR.test(until)) over = on < `${until}-01-01` ? "yes" : on < `${Number(until) + 1}-01-01` ? "unknown" : "no";
  else if (untilEnd !== null) over = on < `${until}-01` ? "yes" : on <= untilEnd ? "unknown" : "no";
  else over = on < until ? "yes" : "no";

  return begun === "no" || over === "no" ? "no" : begun === "yes" && over === "yes" ? "yes" : "unknown";
};

// The first day a period is surely a member, and the first day it is not, for an overlap check. A year or a month
// as joining counts from its last day; a year or a month as leaving counts up to its first day.
const sureFrom = (day: string | null): string | null => (day === null ? null : YEAR.test(day) ? `${day}-12-31` : monthEnd(day) ?? day);
const sureTo = (day: string | null): string | null => (day === null ? null : YEAR.test(day) ? `${day}-01-01` : monthStart(day) ?? day);

export { standing, sureFrom, sureTo };
export type { Standing };
