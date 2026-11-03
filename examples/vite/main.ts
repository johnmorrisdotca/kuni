import "@johnmorrisdotca/kuni/element/define";

const card = document.querySelector("kuni-card")!;
card.addEventListener("kuni-load", (event) => console.log((event as CustomEvent<{ code: string }>).detail.code));
