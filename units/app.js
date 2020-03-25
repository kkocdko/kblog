"use strict";

const mainBox = document.querySelector("main");
const loadingIndicator = document.querySelector("#loading");
const topBar = document.querySelector("header");
const sideBar = document.querySelector("#sidebar");
const sideBarMask = sideBar.querySelector(".mask");

const fadeInElement = element => element.classList.add("in");

const fadeOutElement = element => element.classList.remove("in");

const onSpaLinkClick = function(event) {
  event.preventDefault();
  history.pushState(null, null, this.href);
  reloadAsync({ toTop: true });
};

const listenSpaLinks = () => {
  document
    .querySelectorAll("[data-sl]")
    .forEach(el => el.addEventListener("click", onSpaLinkClick));
};

const reloadAsync = async ({ toTop }) => {
  const startTime = Date.now();
  let showAni = false;
  const timeoutTimer = setTimeout(() => {
    showAni = true;
    fadeInElement(loadingIndicator);
  }, 50);
  let response = await fetch(location.pathname);
  clearTimeout(timeoutTimer);
  if (response.status === 404) {
    response = await fetch("/404.html");
  }
  const htmlStr = await response.text();
  if (showAni) {
    await new Promise(resolve =>
      setTimeout(resolve, 300 - (Date.now() - startTime))
    );
  }
  document.title = htmlStr.match("<title>((.|\n)+?)</title>")[1];
  mainBox.innerHTML = htmlStr.match("<main>((.|\n)+?)</main>")[1];
  const hash = location.hash.substr(1);
  if (hash) {
    const anchor = document.getElementById(hash);
    if (anchor) {
      toTop = false;
      anchor.scrollIntoView();
      fadeOutElement(topBar);
    }
  }
  if (toTop) {
    scroll(0, 0);
    fadeInElement(topBar);
  }
  listenSpaLinks();
  if (showAni) {
    fadeOutElement(loadingIndicator);
  }
};

listenSpaLinks();

addEventListener("popstate", () => reloadAsync({ toTop: false }));

document
  .querySelector("#show-sidebar-btn")
  .addEventListener("click", () => fadeInElement(sideBar));

sideBarMask.addEventListener("pointerdown", () => fadeOutElement(sideBar));

sideBar.querySelector("ul").addEventListener("click", () => {
  scroll(0, 0);
  fadeOutElement(sideBar);
});

document.querySelector("#gotop-btn").addEventListener("click", () => {
  try {
    scroll({ top: 0, behavior: "smooth" });
  } catch {
    scroll(0, 0);
  }
});

document.querySelector("#show-palette-btn").addEventListener("click", () => {
  const color = prompt("Input color (in css format)", "rgb(0,137,123)");
  if (color) {
    document.body.style.setProperty("--theme-color", color);
    document.querySelector("meta[name=theme-color]").content = color;
  }
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
  });
}

// fix the Blink's css bug
setTimeout(() => {
  sideBar.style = "";
}, 700);
