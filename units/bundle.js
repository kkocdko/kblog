if ("".matchAll) {
  history.scrollRestoration = "auto"; // For native hash anchor
  document.head.insertAdjacentHTML("beforeend", `<style>/*@ cssStr */</style>`);

  document.addEventListener("DOMContentLoaded", () => {
    document.body.insertAdjacentHTML("beforeend", `/*@ htmlStr */`);
    /*@ jsStr */
    history.scrollRestoration = "manual";
  });
}
