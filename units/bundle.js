"use strict";

history.scrollRestoration = "auto"; // Restone position when page resume
let avatar = `/*{avatar}*/`;
document.head.insertAdjacentHTML("beforeend", `/*{head}*/`);
document.addEventListener("DOMContentLoaded", () => {
  document.body.insertAdjacentHTML("beforeend", `/*{extra}*/`);
  /*{script}*/
});
