"use strict";

const path = require("path");
const childProcess = require("child_process");

const exec = (fileName, args) =>
  new Promise((resolve) =>
    childProcess
      .fork(path.join(__dirname, fileName), args)
      .addListener("exit", resolve)
  );

(async () => {
  while (true) {
    console.log("refresh at: " + new Date().toTimeString());
    await exec("generate.js", ["--dev-mode"]);
    await exec("serve.js");
  }
})();
