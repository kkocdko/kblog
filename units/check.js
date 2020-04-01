try {
  eval("async a=>a,onpointerup");
} catch (e) {
  if (window.stop) stop();
  location = "//browser-update.org/update.html";
}
