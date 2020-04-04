"use strict";

const inputFile = document.querySelector("#input-file");
const outputImg = document.querySelector("#viewer>img");
const typeSwitch = document.querySelector("#convert-config-type");
// const sizeSwitch = document.querySelector('#convert-config-size')
const downloadBth = document.querySelector("#download-btn");

const refreshImage = () => {
  const selectedValueArr = typeSwitch.value.split(" ");
  const meta = selectedValueArr[0];
  const quality = Number(selectedValueArr[1]);
  const reader = new window.FileReader();
  reader.onload = async (event) => {
    const canvas = document.createElement("canvas");
    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      outputImg.src = canvas.toDataURL(meta, quality);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(inputFile.files[0]);
};

const downloadImg = (img, fileName = "download") => {
  const aTag = document.createElement("a");
  aTag.download = fileName;
  aTag.href = img.src;
  aTag.click();
};

inputFile.addEventListener("change", refreshImage);

typeSwitch.addEventListener("change", () => {
  const selectedOption = typeSwitch.selectedOptions[0];
  if (selectedOption.classList.contains("modify")) {
    const qualityPercent = window.prompt(
      "Image compress quality (0 ~ 100)",
      75
    );
    const quality = (qualityPercent / 100).toFixed(2);
    selectedOption.value = selectedOption.value.split(" ")[0] + " " + quality;
    selectedOption.textContent =
      selectedOption.textContent.split("(")[0] +
      "(" +
      qualityPercent +
      "%) (Modify)";
  }
  refreshImage();
});

// sizeSwitchEl.addEventListener('change', () => {
//   const selectedOption = sizeSwitchEl.selectedOptions[0]
//   if (selectedOption.classList.contains('modify-size')) {
//     const size = window.prompt('图片宽高', '800x600')
//     selectedOption.value = size
//     selectedOption.textContent = selectedOption.textContent.split('(')[0] + '(' + qualityPercent + '%质量) (自定义)'
//   }
// })

downloadBth.addEventListener("click", () => {
  if (outputImg.src) {
    downloadImg(outputImg);
  } else {
    window.alert("Nothing to download!");
  }
});
