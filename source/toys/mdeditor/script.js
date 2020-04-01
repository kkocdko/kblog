"use strict";

const inputBox = document.querySelector("#input-box");
const outputBox = document.querySelector("#output-box");
const partition = document.querySelector("#partition");

const hideOrShowInputBox = () => {
  inputBox.style.display = inputBox.style.display === "none" ? "" : "none";
};

const refreshOutput = () => {
  outputBox.innerHTML =
    inputBox.value === ""
      ? "Compiled result will be displayed here."
      : window.marked(inputBox.value);
};

inputBox.addEventListener("input", refreshOutput);
partition.addEventListener("click", hideOrShowInputBox);
refreshOutput();
