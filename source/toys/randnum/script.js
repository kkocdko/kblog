"use strict";

const configForm = document.querySelector("#generate-config");
const numbersList = document.querySelector("#numbers-list tbody");
const generateBtn = document.querySelector("#generate-btn");
const regenerateBtn = document.querySelector("#regenerate-btn");
const emptyListBtn = document.querySelector("#empty-btn");

const randomInRange = (min, max) =>
  Math.round(Math.random() * (max - min)) + min;

const getTimeStr = () => {
  const zeroPad = (num, len = 3) => ("000" + num).slice(-len);
  const date = new Date();
  const timeStr = `${date.toTimeString().slice(0, 8)}.${zeroPad(
    date.getMilliseconds()
  )}`;
  return timeStr;
};

const emptyList = () => {
  numbersList.innerHTML = "";
};

const generateNumber = () => {
  const configData = new window.FormData(configForm);
  const minimum = Number(configData.get("minimum"));
  const maximum = Number(configData.get("maximum"));
  const quantity = Number(configData.get("quantity"));
  const creatTime = getTimeStr();
  let htmlStr = "";
  for (let i = 0; i < quantity; i++) {
    const randomNumber = randomInRange(minimum, maximum);
    htmlStr += `<tr><td>${creatTime}</td><td>${randomNumber}</td></tr>`;
  }
  numbersList.insertAdjacentHTML("beforeend", htmlStr);
  setTimeout(() => {
    numbersList.lastElementChild.scrollIntoView();
  });
};

generateBtn.addEventListener("click", generateNumber);

regenerateBtn.addEventListener("click", () => {
  emptyList();
  generateNumber();
});

emptyListBtn.addEventListener("click", emptyList);
