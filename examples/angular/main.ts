import "@angular/compiler";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideZonelessChangeDetection } from "@angular/core";
import { CountryComponent } from "./country.component";

void bootstrapApplication(CountryComponent, { providers: [provideZonelessChangeDetection()] });
