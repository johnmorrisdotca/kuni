import { country, type Country } from "@johnmorrisdotca/kuni";
import { isCountryCode, type CountryCode } from "@johnmorrisdotca/kuni/codes";

const code: CountryCode = "JP";
const japan: Country | null = country(code);
console.log(japan?.name.en, isCountryCode("XX"));

// @ts-expect-error "XX" is not a country's code
const unknown: CountryCode = "XX";
console.log(unknown);
