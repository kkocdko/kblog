"use strict";

history.scrollRestoration = "manual";
let avatar = `/*{avatar}*/`;
document.head.insertAdjacentHTML("beforeend", `/*{head}*/`);
document.addEventListener("DOMContentLoaded", () => {
  document.body.insertAdjacentHTML("beforeend", `/*{extra}*/`);
  /*{script}*/
});
