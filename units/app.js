"use strict";

const mainBox = document.querySelector("main");
const loadingIndicator = document.querySelector("#loading");
const topBar = document.querySelector("header");
const sideBar = document.querySelector("#sidebar");
const sideBarMask = sideBar.querySelector(".mask");

const scrollMarks = new Map();

const fadeInElement = (element) => element.classList.add("in");

const fadeOutElement = (element) => element.classList.remove("in");

const onSpaLinkClick = function (event) {
  event.preventDefault();
  history.pushState(null, null, this.href);
  refreshContent({ toTop: true });
};

const listenSpaLinks = () => {
  document
    .querySelectorAll("[data-sl]")
    .forEach((element) => element.addEventListener("click", onSpaLinkClick));
};

const refreshContent = async ({ toTop }) => {
  fadeInElement(loadingIndicator);
  fadeOutElement(sideBar);
  const pathname = location.pathname;
  const htmlStr = await (await fetch(pathname)).text();
  document.title = htmlStr.match("<title>((.|\n)+?)</title>")[1];
  mainBox.innerHTML = htmlStr.match("<main>((.|\n)+?)</main>")[1];
  mainBox.classList.add("spa");
  const hash = location.hash.substr(1);
  let anchor;
  if (hash && (anchor = document.getElementById(hash))) {
    anchor.scrollIntoView();
    fadeOutElement(topBar);
  } else {
    if (toTop || !scrollMarks.has(pathname)) {
      scroll(0, 0);
      scrollMarks.set(pathname, 0);
      fadeInElement(topBar);
    } else {
      scroll(0, scrollMarks.get(pathname));
    }
  }
  listenSpaLinks();
  fadeOutElement(loadingIndicator);
};

listenSpaLinks();
addEventListener("popstate", () => refreshContent({ toTop: false }));

setTimeout(() => {
  // Delay for the hash anchor
  history.scrollRestoration = "manual";
  // Avoid the Blink's css bug
  sideBar.style = "";
}, 700);

document
  .querySelector("#show-sidebar-btn")
  .addEventListener("click", () => fadeInElement(sideBar));

document.querySelector("#gotop-btn").addEventListener("click", () => {
  try {
    scroll({ top: 0, behavior: "smooth" });
  } catch (_) {
    scroll(0, 0);
  }
});

document.querySelector("#show-palette-btn").addEventListener("click", () => {
  // Just for fun
  const color = prompt("Input color (in css format)", "rgb(0,137,123)");
  if (color) {
    document.body.style.setProperty("--theme-color", color);
    document.querySelector("meta[name=theme-color]").content = color;
  }
});

// Use PointerEvent in the future
sideBarMask.addEventListener("mousedown", () => fadeOutElement(sideBar));

sideBarMask.addEventListener("touchstart", () => fadeOutElement(sideBar), {
  passive: true,
});

{
  let originScrollY = 0;
  let currentScrollY;
  addEventListener("scroll", () => {
    currentScrollY = scrollY;
    if (currentScrollY > originScrollY) {
      fadeOutElement(topBar);
    } else {
      fadeInElement(topBar);
    }
    originScrollY = currentScrollY;
    scrollMarks.set(location.pathname, currentScrollY);
  });
}
