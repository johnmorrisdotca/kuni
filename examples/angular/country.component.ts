import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from "@angular/core";
import "@johnmorrisdotca/kuni/element/define";

@Component({
  selector: "app-country",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<kuni-card [attr.code]="code" fields="name codes capital"></kuni-card>`,
})
export class CountryComponent {
  @Input() code = "JP";
}
