import { createApp } from "vue";
import Country from "./Country.vue";

const app = createApp(Country);
app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith("kuni-");
app.mount("#app");
