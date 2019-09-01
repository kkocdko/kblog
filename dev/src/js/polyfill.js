'use strict'

try {
  // Test the "async" keyword's availability
  eval('async()=>{}')
} catch (e) {
  // Polyfill for NodeList.prototype.forEach
  if (!window.NodeList.prototype.forEach) {
    window.NodeList.prototype.forEach = function (callback) {
      for (let i = 0, l = this.length; i < l; i++) {
        callback(this[i])
      }
    }
  }

  // Load Babel-Standalone
  const mainScriptEl = document.querySelector('script[src="/src/js/script.js"]')
  mainScriptEl.type = 'text/babel'
  mainScriptEl.dataset.presets = 'es2017'
  const babelScriptEl = document.createElement('script')
  babelScriptEl.src = '//cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js'
  // babelScriptEl.src = '/src/js/babel.min.js'
  babelScriptEl.onload = () => window.Babel.transformScriptTags()
  document.body.appendChild(babelScriptEl)

  // Show message

  // Source
  // document.body.insertAdjacentHTML('beforeend', `
  // <div style="
  //   position: fixed;
  //   top: 50%;
  //   left: 50%;
  //   z-index: 9;
  //   padding: 15px;
  //   width: 90%;
  //   max-width: 500px;
  //   border-radius: 7px;
  //   background: #fff;
  //   box-shadow: 0 0 0 100vmax rgba(0, 0, 0, .3), 0 2px 9px 0 rgba(0, 0, 0, .3);
  //   line-height: 1.3em;
  //   transform: translate(-50%, -50%);
  // ">
  //   <p>The current browser is too old, some features on the page may not work properly</p>
  //   <br>
  //   <p>Please upgrade to the latest version of the browser as soon as possible.</p>
  //   <br>
  //   <button onclick="this.parentNode.remove()" style="
  //     float: right;
  //     padding: 5px 30px;
  //     border: 1px solid #ccc;
  //     border-radius: 4px;
  //     background: #fff;
  //   ">OK</button>
  // </div>
  // `)

  // Compact
  document.body.insertAdjacentHTML('beforeend', '<div style="position: fixed;top: 50%;left: 50%;z-index: 9;padding: 15px;width: 90%;max-width: 500px;border-radius: 7px;background: #fff;box-shadow: 0 0 0 100vmax rgba(0, 0, 0, .3), 0 2px 9px 0 rgba(0, 0, 0, .3);line-height: 1.3em;transform: translate(-50%, -50%);"><p>The current browser is too old, some features on the page may not work properly</p><br><p>Please upgrade to the latest version of the browser as soon as possible.</p><br><button onclick="this.parentNode.remove()" style="float: right;padding: 5px 30px;border: 1px solid #ccc;border-radius: 4px;background: #fff;">OK</button></div>')
}
