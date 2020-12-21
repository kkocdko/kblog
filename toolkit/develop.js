"use strict";

const path = require("path");
const childProcess = require("child_process");

const exec = (fileName, args) =>
  new Promise((resolve) =>
    childProcess.fork(path.join(__dirname, fileName), args).on("exit", resolve)
  );

(async () => {
  for (let i = 1; ; i++) {
    console.log("#" + i);
    await exec("generate.js", ["--dev-mode"]);
    await exec("serve.js");
  }
})();