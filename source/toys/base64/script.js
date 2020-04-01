"use strict";

const svgContent = document.querySelector("#svg-content");
const svgViewer = document.querySelector("#svg-viewer");

const refreshQrCode = () => {
  svgViewer.innerHTML = new window.QrCode(svgContent.value, "L").toSvg(10);
};

const downloadSvg = () => {
  downloadTextContent(`qrcode_${Date.now()}.svg`, svgViewer.innerHTML);
};

const downloadTextContent = (name, contentStr) => {
  const blob = new window.Blob([contentStr]);
  const href = URL.createObjectURL(blob);
  URL.revokeObjectURL(blob);
  const aTag = document.createElement("a");
  aTag.download = name;
  aTag.href = href;
  aTag.click();
};

svgContent.value = window.location.href;
refreshQrCode();

document.querySelector("#refresh-btn").addEventListener("click", refreshQrCode);

document.querySelector("#download-btn").addEventListener("click", downloadSvg);

function showBase64(event) {
  let fileReader = new FileReader();
  fileReader.onload = e =>
    (document.querySelector("#output-box").value = e.target.result);
  fileReader.readAsDataURL(event.target.files[0]);
}
