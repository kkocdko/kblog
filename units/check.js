try {
  eval("async a=>a");
} catch (e) {
  if (window.stop) stop();
  location = "//browser-update.org/update.html";
}
