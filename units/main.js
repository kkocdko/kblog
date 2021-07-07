"use strict";

let [mainBox /* main */, topBar /* header */] = document.body.children;
let scrollRecords = {};
let scrollPos = 0;

let onLinkClick = function (event) {
  if (event.ctrlKey) return; // Open in background
  event.preventDefault();
  history.pushState(null, null, this.href);
  onpopstate(); // Because "pushState" will not trigger "popstate" event
};

let onPageLoad = () => {
  (document.getElementById(location.hash.slice(1)) || topBar).scrollIntoView();
  document
    .querySelectorAll('a[href^="/."],a[href^="#"]')
    .forEach((element) => (element.onclick = onLinkClick));
};

onscroll = () => {
  topBar.className =
    scrollPos < (scrollRecords[location] = scrollPos = scrollY) &&
    scrollPos /* Was set to "scrollY" */ > 55
      ? "hidden"
      : "";
};

onpopstate = (isPopState) => {
  document.body.className = "loading";
  history.scrollRestoration = "manual"; // Futile in fetch.then, Chrome's bug?
  fetch(location)
    .then((response) => response.text())
    .then((s) => {
      // Regexp will cause a waste of time, but it's usually less than 1 ms
      [, document.title, , mainBox.innerHTML] = s.split(/<\/?title>|<\/?main>/);
      scroll(0, isPopState ? scrollRecords[location] || 0 : 0);
      // Ensure anchor makes down-scroll to hide topbar
      onPageLoad();
      document.body.className = "loaded"; // Also replace the "loading"
      setTimeout(() => (document.body.className = ""), 250);
    });
};

onPageLoad();
