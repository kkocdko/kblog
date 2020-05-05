"use strict";

const svgContent = document.querySelector("#svg-content");
const svgViewer = document.querySelector("#svg-viewer");

const refreshQrCode = () => {
  svgViewer.innerHTML = new QrCode(svgContent.value, "L").toSvg(10);
};

const downloadTextContent = (name, contentStr) => {
  const blob = new Blob([contentStr]);
  const href = URL.createObjectURL(blob);
  URL.revokeObjectURL(blob);
  const aTag = document.createElement("a");
  aTag.download = name;
  aTag.href = href;
  aTag.click();
};

const downloadSvg = () => {
  downloadTextContent(`qrcode_${Date.now()}.svg`, svgViewer.innerHTML);
};

svgContent.value = location.href;
svgContent.click();
svgContent.focus();

refreshQrCode();

document.querySelector("#refresh-btn").addEventListener("click", refreshQrCode);

document.querySelector("#download-btn").addEventListener("click", downloadSvg);
