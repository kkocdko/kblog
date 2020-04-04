"use strict";

document.querySelector("#input-file").addEventListener("change", (event) => {
  const outputBox = document.querySelector("#output-box");
  const fileReader = new FileReader();
  fileReader.onload = (e) => {
    outputBox.value = e.target.result;
    outputBox.select();
  };
  fileReader.readAsDataURL(event.target.files[0]);
});
