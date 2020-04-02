"use strict";

document.querySelector("#input-file").addEventListener("change", event => {
  const fileReader = new FileReader();
  fileReader.onload = e =>
    (document.querySelector("#output-box").value = e.target.result);
  fileReader.readAsDataURL(event.target.files[0]);
});
