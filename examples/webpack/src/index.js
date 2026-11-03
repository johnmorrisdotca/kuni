import "@johnmorrisdotca/kuni/element/define";

const card = document.createElement("kuni-card");
card.setAttribute("code", "JP");
card.setAttribute("fields", "name codes capital");
document.body.append(card);
