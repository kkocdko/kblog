"use strict";

const fork = require("child_process").fork;
const r2a = require("path").join.bind(null, __dirname);
const childs = [];
const exec = (name, args) => childs.push(fork(r2a(name), args));
const kill = () => childs.forEach(() => childs.pop().kill());
let i = 0;
const spawn = () => {
  console.log("#", ++i);
  kill();
  exec("generate.js", ["--dev"]);
  exec("serve.js");
};
spawn();
process.stdin.on("data", spawn);
