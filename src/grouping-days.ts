// What a body's period says about a day, for src/groupings.ts: a member, not a member, or unknown. Not an entry of its own.

const YEAR = /^\d{4}$/;

// What one period says about a day: "yes" (a member), "no", or "unknown". A day is "YYYY-MM-DD"; a period's year alone
// ("1975") is read so that a day we call a member was one: a year as `since` counts from its last day, a year as
// `until` up to its first, and the days inside that year are unknown. No `since` at all is unknown.
type Standing = "yes" | "no" | "unknown";
const standing = (since: string | null, until: string | null, on: string): Standing => {
  let begun: Standing;
  if (since === null) begun = "unknown";
  else if (YEAR.test(since)) begun = on >= `${since}-12-31` ? "yes" : on >= `${since}-01-01` ? "unknown" : "no";
  else begun = on >= since ? "yes" : "no";
  let over: Standing;
  if (until === null) over = "yes";
  else if (YEAR.test(until)) over = on < `${until}-01-01` ? "yes" : on < `${Number(until) + 1}-01-01` ? "unknown" : "no";
  else over = on < until ? "yes" : "no";

  return begun === "no" || over === "no" ? "no" : begun === "yes" && over === "yes" ? "yes" : "unknown";
};

export { standing };
export type { Standing };
