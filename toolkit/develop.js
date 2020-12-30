"use strict";

const path = require("path");
const childProcess = require("child_process");

const exec = (filename, args) => {
  const child = childProcess.fork(path.join(__dirname, filename), args);
  return new Promise((resolve) => child.on("exit", resolve));
};

(async () => {
  for (let i = 1; ; i++) {
    console.log("#", i);
    await exec("generate.js", ["--dev"]);
    await exec("serve.js");
  }
})();
