try {
  eval("async a=>a");
} catch (_) {
  if (window.stop) stop();
  location = "//browser-update.org/update.html";
}
