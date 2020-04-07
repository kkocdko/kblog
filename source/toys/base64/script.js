"use strict";

const inputFile = document.querySelector("#input-file");
const copyBtn = document.querySelector("#copy-btn");
const outputBox = document.querySelector("#output-box");
let currentBase64 = "";

inputFile.addEventListener("change", () => {
  const file = inputFile.files[0];
  if (file.size > 1024 ** 2 * 1) {
    alert("Input file must small than 1 MB");
    return;
  }
  const fileReader = new FileReader();
  fileReader.onload = (event) => {
    currentBase64 = event.target.result;
    outputBox.value = currentBase64;
    outputBox.select();
    inputFile.value = null;
  };
  fileReader.readAsDataURL(file);
});

copyBtn.addEventListener("click", () => {
  const input = document.createElement("input");
  input.value = currentBase64;
  input.select();
  document.execCommand("copy");
  input.remove();
});
