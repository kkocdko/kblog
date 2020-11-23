if ("".matchAll) {
  history.scrollRestoration = "auto"; // For native hash anchor
  document.head.insertAdjacentHTML("beforeend", `/*[head]*/`);
  document.addEventListener("DOMContentLoaded", () => {
    document.body.insertAdjacentHTML("beforeend", `/*[extra]*/`);
    /*[script]*/
    history.scrollRestoration = "manual";
  });
}
