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
  babelScriptEl.onload = () => window.Babel.transformScriptTags()
  babelScriptEl.src = '//cdn.jsdelivr.net/npm/@babel/standalone@7.3.4/babel.min.js'
  // babelScriptEl.src = '/src/js/babel.min.js'
  document.body.appendChild(babelScriptEl)

  // Show message
  // Source
  // document.body.insertAdjacentHTML('beforeend', `
  //   <div style="
  //     position: fixed;
  //     top: 50%;
  //     left: 50%;
  //     z-index: 9;
  //     padding: 20px;
  //     width: 90%;
  //     max-width: 500px;
  //     border-radius: 7px;
  //     background: #fff;
  //     box-shadow: 0 0 0 50vmax rgba(0, 0, 0, 0.3), 0 2px 9px rgba(0, 0, 0, 0.3);
  //     line-height: 1.7em;
  //     transform: translate(-50%, -50%);
  //   ">
  //     <p>Your browser is too old, page may not work properly.</p>
  //     <p>Please upgrade to the latest browser as soon as possible.</p>
  //     <br>
  //     <button onclick="parentNode.remove()" style="
  //       float: right;
  //       padding: 7px 20px;
  //       border: 1px solid #ccc;
  //       border-radius: 4px;
  //       background: #fff;
  //     ">I got it</button>
  //   </div>
  // `)
  // Compact
  document.body.insertAdjacentHTML('beforeend', '<div style="position:fixed;top:50%;left:50%;z-index:9;padding:20px;width:90%;max-width:500px;border-radius:7px;background:#fff;box-shadow:0 0 0 50vmax rgba(0,0,0,.3),0 2px 9px rgba(0,0,0,.3);line-height:1.7em;transform:translate(-50%,-50%)"><p>Your browser is too old, page may not work properly.</p><p>Please upgrade to the latest browser as soon as possible.</p><br><button onclick="parentNode.remove()"style="float:right;padding:7px 20px;border:1px solid #ccc;border-radius:4px;background:#fff">I got it</button></div>')
}
