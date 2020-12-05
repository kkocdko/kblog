var mainBox = document.querySelector("main");
var topBar = document.querySelector("header");
var scrollRecords = {};
var scrollPos;

var onSpaLinkClick = function (event) {
  event.preventDefault();
  history.pushState(null, null, this.href);
  onpopstate(0); // Because "pushState" will not trigger "popstate" event
};

var listenSpaLinks = () =>
  document
    .querySelectorAll("[_]")
    .forEach((element) => (element.onclick = onSpaLinkClick));

onscroll = () =>
  (topBar.className =
    scrollPos < (scrollRecords[location] = scrollPos = scrollY) &&
    scrollPos > 55
      ? "hidden"
      : "");

onpopstate = (noToTop) => {
  document.body.className = "loading";
  fetch(location)
    .then((response) => response.text())
    .then((a /* htmlStr */) => {
      document.title = a.match("<title>((.|\n)+?)</title>")[1];
      mainBox.innerHTML = a.match("<main>((.|\n)+?)</main>")[1];
      scroll(
        0,
        (a /* anchor */ = document.getElementById(location.hash.slice(1))
          ? a.offsetTop - 70
          : (noToTop && scrollRecords[location]) || 0)
      );
      listenSpaLinks();
      document.body.className = "loaded"; // Also replace the "loading"
      setTimeout(() => (document.body.className = ""), 250);
    });
};

listenSpaLinks();
