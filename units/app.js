"use strict";

var mainBox = document.querySelector("main");
var topBar = document.querySelector("header");
var sidebarSwitch = document.querySelector("#sidebar-switch");
var pathname = location.pathname;
var lastScrollY = 0;
var scrollMarks = {};

var onSpaLinkClick = function (event) {
  event.preventDefault();
  history.pushState(null, null, this.href);
  onpopstate(null, true);
};

var listenSpaLinks = () => {
  for (
    var links = document.querySelectorAll("[data-sl]"), i = 0, l = links.length;
    i < l;
    i++
  )
    links[i].onclick = onSpaLinkClick;
};

onscroll = () => {
  if (scrollY > lastScrollY && scrollY > 55) {
    topBar.classList.remove("in");
  } else {
    topBar.classList.add("in");
  }
  scrollMarks[pathname] = lastScrollY = scrollY;
};

onpopstate = (_, toTop) => {
  document.body.classList.add("loading");
  sidebarSwitch.checked = false;
  pathname = location.pathname;
  fetch(pathname)
    .then((response) => response.text())
    .then((htmlStr) => {
      document.title = htmlStr.match("<title>((.|\n)+?)</title>")[1];
      mainBox.innerHTML = htmlStr.match("<main>((.|\n)+?)</main>")[1];
      document.body.classList.add("loaded");
      var hash = location.hash.substr(1);
      var anchor;
      if (hash && (anchor = document.getElementById(hash))) {
        anchor.scrollIntoView();
        topBar.classList.remove("in");
      } else {
        if (toTop || !scrollMarks[pathname]) {
          scroll(0, 0);
          scrollMarks[pathname] = 0;
          topBar.classList.add("in");
        } else {
          scroll(0, scrollMarks[pathname]);
        }
      }
      listenSpaLinks();
      document.body.classList.remove("loading");
      setTimeout(() => document.body.classList.remove("loaded"), 400);
    });
};

listenSpaLinks();

setTimeout(() => {
  // Fix css bug
  document.querySelector("body>label").style.display = "unset";
  // Delay for the hash anchor
  history.scrollRestoration = "manual";
}, 700);
