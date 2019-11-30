try {
  // Test the "async" keyword's availability
  eval('async()=>{}') // eslint-disable-line
} catch (e) {
  if (window.stop) window.stop()
  document.body.innerHTML = '<iframe style="position:fixed;width:100%;height:100%;border:0;background:#fff" srcdoc="Loading ..." src="//browser-update.org/update.html" onload="removeAttribute(\'srcdoc\')"></iframe>'
}
