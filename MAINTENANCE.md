# Maintenance: what to check, and how often

Countries and places change: a country is renamed, a capital moves, a territory changes status, ISO and CLDR publish new codes and names, a time zone moves. This page lists where to look, so kuni stays current. Checking is the whole job. Nothing changes until there is a ticket.

**How often:** every three months (January, April, July, October), and also whenever CLDR or the IANA time zone database makes a release.

**What to do with a finding:** file one ticket per change on the `modules` board, titled `kuni: …` with `--area kuni`. Then add a row to the log at the bottom.

## Where to look

| What | Where | What to look for |
|---|---|---|
| Codes | ISO 3166 Online Browsing Platform and the ISO 3166 Maintenance Agency's newsletters | New, changed or withdrawn country and subdivision codes (ISO 3166-1, -2, -3) |
| Names and regions | Unicode CLDR releases (https://cldr.unicode.org/, release notes) | A new CLDR version: names in English and Japanese, subdivisions, containment, week and measurement data |
| Time zones | IANA time zone database releases (https://www.iana.org/time-zones) | A new tzdata release: zones added, moved or renamed |
| Facts | Wikidata, the dated snapshots in `data-sources/` | Capitals, populations, areas, borders and memberships that changed since the snapshot |
| Other entities | https://www.worldometers.info/countries/?view=other-entities | Territories and entities kuni lacks, or whose status changed |
| UN membership and M49 | The UN's M49 page and its member states list | New members, or areas regrouped |
| Flag of each place | The hata package (its MAINTENANCE.md) | Keep the two packages' lists of places in step |

## Log

| Date | Checked by | Found | Tickets |
|---|---|---|---|
| 2026-11-17 | Mac Studio | Page started. The other-entities comparison is part of MODULES-1406 | See MODULES-1406 |
