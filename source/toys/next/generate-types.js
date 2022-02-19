"use strict";
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
fs.mkdirSync(`${__dirname}/types`, { recursive: true });
fs.writeFileSync(
  `${__dirname}/types/package.json`,
  JSON.stringify({
    name: "types",
    dependencies: {
      "@types/react": "^17.0.39",
      "@types/react-dom": "^17.0.11",
      "@mui/material": "^5.4.2",
    },
  })
);
childProcess.execSync("npm-mirror i", { cwd: `${__dirname}/types` });
fs.appendFileSync(
  `${__dirname}/types/node_modules/@mui/material/index.d.ts`,
  "\nexport as namespace MaterialUI;\n"
);
const clear = (dir) => {
  fs.readdirSync(dir).forEach((item) => {
    item = path.join(dir, item);
    if (fs.statSync(item).isDirectory()) clear(item);
    else if (!item.endsWith(".d.ts")) fs.unlinkSync(item);
  });
  if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
};
clear(`${__dirname}/types/node_modules`);
fs.writeFileSync(
  `${__dirname}/types/index.d.ts`,
  "" +
    `/// <reference path="node_modules/@types/react/index.d.ts" />\n` +
    `/// <reference path="node_modules/@types/react-dom/index.d.ts" />\n` +
    `/// <reference path="node_modules/@mui/material/index.d.ts" />\n`
);
