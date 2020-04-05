"use strict";

const path = require("path");
const fs = require("file-system");
const childProcess = require("child_process");

const onChange = (() => {
  const interval = 1500;
  const watchers = [];
  let lastTriggerTime = 0;
  let timeoutTimer = null;
  return () => {
    clearTimeout(timeoutTimer);
    const passedTime = Date.now() - lastTriggerTime;
    timeoutTimer = setTimeout(() => {
      watchers.forEach((watcher) => watcher.close());
      watchers.length = 0;
      // Why this will cause casual panic???
      fs.recurse(
        path.join(__dirname, ".."),
        ["source/**/*", "toolkit/**/*", "units/**/*"],
        (absolute, _, filename) => {
          // Is directory
          if (!filename) {
            watchers.push(fs.watch(absolute, onChange));
          }
        }
      );
      childProcess.fork(path.join(__dirname, "generator.js"), ["--dev-mode"]);
      lastTriggerTime = Date.now();
    }, interval - passedTime);
  };
})();

onChange();
childProcess.fork(path.join(__dirname, "server.js"));
