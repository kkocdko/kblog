let [mainBox /* main */, topBar /* header */] = document.body.children;
let scrollRecords = {};
let scrollPos = 0;

let onLinkClick = function (event) {
  event.preventDefault();
  history.pushState(null, null, this.href);
  onpopstate(); // Because "pushState" will not trigger "popstate" event
};

let onPageLoad = (a /* isPopState */) => {
  scroll(0, a ? scrollRecords[location] || 0 : 0);
  a /* anchor */ = document.getElementById(location.hash.slice(1));
  if (a) a.scrollIntoView();
  document
    .querySelectorAll('a[href^="/."],a[href^="#"]')
    .forEach((element) => (element.onclick = onLinkClick));
};

onscroll = () =>
  (topBar.className =
    scrollPos < (scrollRecords[location] = scrollPos = scrollY) &&
    scrollPos /* Was set to "scrollY" */ > 55
      ? "hidden"
      : "");

onpopstate = (isPopState) => {
  document.body.className = "loading";
  fetch(location)
    .then((response) => response.text())
    .then((s) => {
      [, document.title, , mainBox.innerHTML] = s.split(/<\/?title>|<\/?main>/);
      onPageLoad(isPopState);
      document.body.className = "loaded"; // Also replace the "loading"
      setTimeout(() => (document.body.className = ""), 250);
    });
};

onPageLoad();
