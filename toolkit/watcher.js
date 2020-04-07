"use strict";

const path = require("path");
const fs = require("file-system");
const childProcess = require("child_process");

const onChange = (() => {
  const delay = 100;
  const interval = 1000;
  let lastTriggerTime = 0;
  let timeoutTimer = null;
  return () => {
    clearTimeout(timeoutTimer);
    const passedTime = Date.now() - lastTriggerTime;
    timeoutTimer = setTimeout(() => {
      childProcess.fork(path.join(__dirname, "generator.js"), ["--dev-mode"]);
      lastTriggerTime = Date.now();
    }, Math.max(interval - passedTime, delay));
  };
})();

// Watch every directory
fs.recurse(
  path.join(__dirname, ".."),
  ["source", "source/**/*", "toolkit", "toolkit/**/*", "units", "units/**/*"],
  (absolute, _, filename) => {
    if (!filename) {
      // Will not be triggered in new directory
      fs.watch(absolute, onChange);
    }
  }
);

onChange();
childProcess.fork(path.join(__dirname, "server.js"));
