import { country, countryByName } from "@johnmorrisdotca/kuni";

// A server reads the same data a browser does: pure, no DOM, no network.
const japan = country("JP");
console.log(japan?.name.ja, japan?.callingCode, countryByName("Holland")?.alpha2);
