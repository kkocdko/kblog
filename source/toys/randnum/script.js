"use strict";

const configForm = document.querySelector("#generate-config");
const numbersList = document.querySelector("#numbers-list tbody");
const generateBtn = document.querySelector("#generate-btn");
const regenerateBtn = document.querySelector("#regenerate-btn");
const emptyListBtn = document.querySelector("#empty-btn");

const randomInRange = (min, max) =>
  Math.round(Math.random() * (max - min)) + min;

const getTimeStr = () => {
  const zeroPad = (num, len = 3) => ("000000000" + num).slice(-len);
  const date = new Date();
  const timeStr = `${date.toTimeString().slice(0, 8)}.${zeroPad(
    date.getMilliseconds()
  )}`;
  return timeStr;
};

const generateNumber = () => {
  const configData = new FormData(configForm);
  const minimum = Number(configData.get("minimum"));
  const maximum = Number(configData.get("maximum"));
  const quantity = Number(configData.get("quantity"));
  const creatTime = getTimeStr();
  const rows = [];
  for (let i = 0; i < quantity; i++) {
    const randomNumber = randomInRange(minimum, maximum);
    const row = numbersList.querySelector("tr:first-child").cloneNode(true);
    const cells = row.querySelectorAll("td");
    cells[0].textContent = creatTime;
    cells[1].textContent = randomNumber;
    rows.push(row);
  }
  numbersList.append(...rows);
  setTimeout(() => {
    numbersList.lastElementChild.scrollIntoView();
  });
};

const emptyList = () => {
  [...numbersList.childNodes].slice(2).forEach((element) => {
    element.remove();
  });
};

generateBtn.addEventListener("click", generateNumber);

regenerateBtn.addEventListener("click", () => {
  emptyList();
  generateNumber();
});

emptyListBtn.addEventListener("click", emptyList);
