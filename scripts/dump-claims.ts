// Reads one item out of Wikimedia's JSON dump. The query service is not available to this package, so a statement's
// rank, qualifiers and references are taken from the claim as the dump writes it. A best-ranked statement is a
// preferred one, or a normal one when the property has no preferred statement. A deprecated statement is left out.

export interface Snak {
  snaktype?: string;
  datavalue?: { type?: string; value?: unknown };
}

export interface Statement {
  rank?: string;
  mainsnak?: Snak;
  qualifiers?: Record<string, Snak[]>;
  references?: { snaks?: Record<string, Snak[]> }[];
}

export interface DumpEntity {
  id: string;
  labels?: Record<string, { value?: string }>;
  claims?: Record<string, Statement[]>;
}

const SOFT_HYPHEN = /\u00ad/g;

export const claims = (entity: DumpEntity | undefined, property: string): Statement[] => entity?.claims?.[property] ?? [];

export const valued = (statements: Statement[]): Statement[] => statements.filter((statement) => statement.mainsnak?.snaktype === "value" && statement.rank !== "deprecated");

/** Preferred statements, or the normal ones when nothing is preferred. This is what `wikibase:BestRank` and `wdt:` return. */
export const best = (statements: Statement[]): Statement[] => {
  const rows = valued(statements);
  const preferred = rows.filter((statement) => statement.rank === "preferred");
  return preferred.length > 0 ? preferred : rows.filter((statement) => statement.rank === "normal" || statement.rank === undefined);
};

export const rankToken = (rank: string | undefined): string => (rank === "preferred" ? "ontology#PreferredRank" : "ontology#NormalRank");

export const entityId = (snak: Snak | undefined): string | null => {
  if (snak?.datavalue?.type !== "wikibase-entityid" || typeof snak.datavalue.value !== "object" || snak.datavalue.value === null) return null;
  const id = (snak.datavalue.value as { id?: unknown }).id;
  return typeof id === "string" ? id : null;
};

export const textValue = (snak: Snak | undefined): string | null => {
  if (snak?.datavalue?.type === "string" && typeof snak.datavalue.value === "string") return snak.datavalue.value.replace(SOFT_HYPHEN, "");
  if (snak?.datavalue?.type === "monolingualtext" && typeof snak.datavalue.value === "object" && snak.datavalue.value !== null) {
    const text = (snak.datavalue.value as { text?: unknown }).text;
    return typeof text === "string" ? text.replace(SOFT_HYPHEN, "") : null;
  }
  return null;
};

export const quantity = (snak: Snak | undefined): { amount: number; unit: string | null } | null => {
  if (snak?.datavalue?.type !== "quantity" || typeof snak.datavalue.value !== "object" || snak.datavalue.value === null) return null;
  const amount = Number((snak.datavalue.value as { amount?: unknown }).amount);
  if (!Number.isFinite(amount)) return null;
  const unit = (snak.datavalue.value as { unit?: unknown }).unit;
  if (typeof unit !== "string" || unit === "1") return { amount, unit: null };
  const id = unit.slice(unit.lastIndexOf("/") + 1);
  return { amount, unit: id.startsWith("Q") ? id : null };
};

/**
 * The historical year the query service writes. The JSON dump's year for a date before the common era is one less
 * than that year, because the dump's numbering has a year 0 (year 0 is 1 BCE, so 3031 BCE is stored as -3032).
 */
const historicalYear = (year: number): number => (year < 0 ? year + 1 : year === 0 ? -1 : year);

/** "+2014-01-01T00:00:00Z" to "2014-01-01". A year or a month (month or day 00) is the first of that period, which is how the query service writes it. A dump year before the common era is moved to that historical year. */
export const timeDay = (snak: Snak | undefined): string | null => {
  if (typeof snak?.datavalue?.value !== "object" || snak.datavalue.value === null) return null;
  const time = (snak.datavalue.value as { time?: unknown }).time;
  if (typeof time !== "string") return null;
  const match = /^([+-]?\d+)-(\d\d)-(\d\d)/.exec(time.replace(/^\+/, ""));
  if (match === null) return null;
  const year = historicalYear(Number(match[1]));
  if (!Number.isFinite(year)) return null;
  return `${year}-${match[2] === "00" ? "01" : match[2]}-${match[3] === "00" ? "01" : match[3]}`;
};

/** Latitude then longitude, and only a point on Earth. The dump already writes them in that order. */
export const point = (snak: Snak | undefined): [number, number] | null => {
  if (typeof snak?.datavalue?.value !== "object" || snak.datavalue.value === null) return null;
  const value = snak.datavalue.value as { latitude?: unknown; longitude?: unknown; globe?: unknown };
  if (typeof value.globe === "string" && !value.globe.endsWith("/Q2")) return null;
  if (typeof value.latitude !== "number" || typeof value.longitude !== "number") return null;
  return [value.latitude, value.longitude];
};

export const labelOf = (entity: DumpEntity | undefined, language: string): string | null => {
  const value = entity?.labels?.[language]?.value;
  return typeof value === "string" && value !== "" ? value.replace(SOFT_HYPHEN, "") : null;
};

export const qualifierSnaks = (statement: Statement, property: string): Snak[] => statement.qualifiers?.[property] ?? [];

export const qualifierDays = (statement: Statement, property: string): Array<string | null> => {
  const days = qualifierSnaks(statement, property).map(timeDay).filter((day): day is string => day !== null);
  return days.length === 0 ? [null] : days;
};

export const qualifierIds = (statement: Statement, property: string): Array<string | null> => {
  const ids = qualifierSnaks(statement, property).map(entityId).filter((id): id is string => id !== null);
  return ids.length === 0 ? [null] : ids;
};

export const referenceHosts = (statement: Statement): string[] => {
  const hosts = new Set<string>();
  for (const reference of statement.references ?? []) {
    for (const snak of reference.snaks?.P854 ?? []) {
      const url = textValue(snak);
      if (url === null) continue;
      try {
        hosts.add(new URL(url).hostname.replace(/^www\./, "").toLowerCase());
      } catch {
        // A reference that is not an address is not a host.
      }
    }
  }
  return [...hosts].sort();
};

/** Elevation to metres. The dump states feet as Q3710; the query service's normalised value is the international foot. An unknown unit is refused rather than stored as metres. */
export const metres = (amount: number, unit: string | null): number | null => {
  const factor = unit === null || unit === "Q11573" ? 1 : unit === "Q3710" ? 0.3048 : null;
  return factor === null ? null : Math.round(amount * factor * 10) / 10;
};
