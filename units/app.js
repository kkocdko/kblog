var mainBox = document.querySelector("main");
var topBar = document.querySelector("header");
var scrollMarks = {};
var lastScrollY;

var onSpaLinkClick = function (event) {
  event.preventDefault();
  history.pushState(null, null, this.href);
  onpopstate(0); // Because "pushState" will not trigger "popstate" event
};

var listenSpaLinks = () =>
  document
    .querySelectorAll("[data-sl]")
    .forEach((el) => (el.onclick = onSpaLinkClick));

onscroll = () => {
  topBar.className = scrollY > lastScrollY && scrollY > 55 ? "hidden" : "";
  scrollMarks[location] = lastScrollY = scrollY;
};

onpopstate = (noToTop) => {
  document.body.className = "loading";
  fetch(location)
    .then((response) => response.text())
    .then((a /* htmlStr */) => {
      document.title = a.match("<title>((.|\n)+?)</title>")[1];
      mainBox.innerHTML = a.match("<main>((.|\n)+?)</main>")[1];
      scroll(
        0,
        // Confusing code
        (a /* anchor */ = document.getElementById(location.hash.slice(1))
          ? a.offsetTop - 70
          : (noToTop && scrollMarks[location]) || 0)
      );
      listenSpaLinks();
      document.body.className = "loaded"; // Also replace the "loading"
      setTimeout(() => (document.body.className = ""), 500);
    });
};

listenSpaLinks();
