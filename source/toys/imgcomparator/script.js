"use strict";

class ImageComparator {
  constructor(container) {
    this.mode = "abs";
    this.contrastMultiple = 20;
    this.width = 0;
    this.height = 0;
    this.firstDX = 0; // Department X
    this.firstDY = 0;
    this.secondDX = 0;
    this.secondDY = 0;
    this.firstCanvas = document.createElement("canvas");
    this.firstCanvasCtx = this.firstCanvas.getContext("2d");
    this.secondCanvas = document.createElement("canvas");
    this.secondCanvasCtx = this.secondCanvas.getContext("2d");
    this.diffCanvas = document.createElement("canvas");
    this.diffCanvasCtx = this.diffCanvas.getContext("2d");
    container.appendChild(this.diffCanvas);
  }

  setSize(width, height) {
    this.diffCanvas.width = this.width = width;
    this.diffCanvas.height = this.height = height;
  }

  displaceBy(firstMoveX, firstMoveY, secondMoveX, secondMoveY) {
    this.firstDX += firstMoveX;
    this.firstDY += firstMoveY;
    this.secondDX += secondMoveX;
    this.secondDY += secondMoveY;
  }

  displaceTo(firstDX, firstDY, secondDX, secondDY) {
    this.firstDX = firstDX;
    this.firstDY = firstDY;
    this.secondDX = secondDX;
    this.secondDY = secondDY;
  }

  displaceFirstTo(dx, dy) {
    this.firstDX = dx;
    this.firstDY = dy;
  }

  autoAlign(searchWidth = 10, searchHeight = 10) {
    const startDX = this.firstDX - searchWidth / 2;
    const startDY = this.firstDY - searchHeight / 2;
    const endDX = startDX + searchWidth;
    const endDY = startDY + searchHeight;
    const diffSumList = [];
    const diffConfigList = [];
    for (let dx = startDX; dx < endDX; dx++) {
      for (let dy = startDY; dy < endDY; dy++) {
        this.displaceFirstTo(dx, dy);
        const diffSum = this.compare().sum;
        diffSumList.push(diffSum);
        diffConfigList.push({ dx, dy });
      }
    }
    const minDiffSum = Math.min(...diffSumList);
    const minDiffSumIndex = diffSumList.indexOf(minDiffSum);
    const diffConfig = diffConfigList[minDiffSumIndex];
    this.displaceFirstTo(diffConfig.dx, diffConfig.dy);
    this.refresh();
  }

  compare() {
    const firstImgData = this.firstCanvasCtx.getImageData(
      -this.firstDX,
      -this.firstDY,
      this.width,
      this.height
    );
    const secondImgData = this.secondCanvasCtx.getImageData(
      -this.secondDX,
      -this.secondDY,
      this.width,
      this.height
    );
    const diffImgData = new window.ImageData(this.width, this.height);
    let diffSum = 0;
    const fixRange = (num) => Math.min(num * this.contrastMultiple, 255);
    for (let i = 0, l = firstImgData.data.length; i < l; i += 4) {
      const firstR = firstImgData.data[i];
      const firstG = firstImgData.data[i + 1];
      const firstB = firstImgData.data[i + 2];
      const firstA = firstImgData.data[i + 3];
      const secondR = secondImgData.data[i];
      const secondG = secondImgData.data[i + 1];
      const secondB = secondImgData.data[i + 2];
      const secondA = secondImgData.data[i + 3];
      switch (this.mode) {
        case "strict": {
          if (
            firstR === secondR &&
            firstG === secondG &&
            firstB === secondB &&
            firstA === secondA
          ) {
            diffImgData.data[i] = diffImgData.data[i + 1] = diffImgData.data[
              i + 2
            ] = 0;
          } else {
            diffImgData.data[i] = diffImgData.data[i + 1] = diffImgData.data[
              i + 2
            ] = 255;
            diffSum += 255 / l;
          }
          diffImgData.data[i + 3] = 255;
          break;
        }
        case "gray": {
          const diffAverage = fixRange(
            (Math.abs(firstR - secondR) +
              Math.abs(firstG - secondG) +
              Math.abs(firstB - secondB)) /
              3
          );
          diffImgData.data[i] = diffImgData.data[i + 1] = diffImgData.data[
            i + 2
          ] = diffAverage;
          diffImgData.data[i + 3] = 255;
          diffSum += diffAverage / l;
          break;
        }
        case "abs": {
          const diffR = fixRange(Math.abs(firstR - secondR));
          const diffG = fixRange(Math.abs(firstG - secondG));
          const diffB = fixRange(Math.abs(firstB - secondB));
          diffImgData.data[i] = diffR;
          diffImgData.data[i + 1] = diffG;
          diffImgData.data[i + 2] = diffB;
          diffImgData.data[i + 3] = 255;
          diffSum += (diffR + diffG + diffB) / 3 / l;
          break;
        }
        case "reduce": {
          const diffR = fixRange(Math.max(firstR - secondR, 0));
          const diffG = fixRange(Math.max(firstG - secondG, 0));
          const diffB = fixRange(Math.max(firstB - secondB, 0));
          diffImgData.data[i] = diffR;
          diffImgData.data[i + 1] = diffG;
          diffImgData.data[i + 2] = diffB;
          diffImgData.data[i + 3] = 255;
          diffSum += (diffR + diffG + diffB) / 3 / l;
          break;
        }
      }
    }
    return { sum: diffSum, data: diffImgData };
  }

  refresh() {
    const compareResult = this.compare();
    this.diffCanvasCtx.clearRect(0, 0, this.width, this.height);
    this.diffCanvasCtx.putImageData(compareResult.data, 0, 0);
  }

  async loadImg(firstSrc, secondSrc) {
    const drawImgToCanvas = async (src, canvas, canvasCtx) =>
      new Promise((resolve) => {
        const img = document.createElement("img");
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
          canvasCtx.drawImage(img, 0, 0);
          resolve();
        };
        img.src = src;
      });
    return Promise.all([
      drawImgToCanvas(firstSrc, this.firstCanvas, this.firstCanvasCtx),
      drawImgToCanvas(secondSrc, this.secondCanvas, this.secondCanvasCtx),
    ]);
  }
}

async function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const fileReader = new window.FileReader();
    fileReader.onload = (event) => resolve(event.target.result);
    fileReader.readAsDataURL(file);
  });
}

const imageComparator = new ImageComparator(document.querySelector("#viewer"));
(async () => {
  imageComparator.setSize(50, 50);
  await imageComparator.loadImg(
    "./examples/first-img.png",
    "./examples/second-img.png"
  );
  imageComparator.refresh();
})();

document
  .querySelectorAll(
    "#displace-console .first button, #displace-console .second button"
  )
  .forEach((el) => {
    el.addEventListener("click", function () {
      const displacement = this.dataset.displace
        .split(",")
        .map((str) => Number(str));
      imageComparator.displaceBy(...displacement);
      imageComparator.refresh();
    });
  });

const firstImgFileInputer = document.querySelector("#input-img-first input");
const secondImgFileInputer = document.querySelector("#input-img-second input");

document.querySelector("#compare-img").addEventListener("click", async () => {
  if (firstImgFileInputer.files[0] && secondImgFileInputer.files[0]) {
    const firstDataUrl = await fileToDataUrl(firstImgFileInputer.files[0]);
    const secondDataUrl = await fileToDataUrl(secondImgFileInputer.files[0]);
    await imageComparator.loadImg(firstDataUrl, secondDataUrl);
    imageComparator.refresh();
  }
});

document
  .querySelector("#displace-console .all .reset")
  .addEventListener("click", () => {
    imageComparator.displaceTo(0, 0, 0, 0);
    imageComparator.refresh();
  });

document
  .querySelector("#displace-console .all .auto-align")
  .addEventListener("click", () => {
    // imageComparator.autoAlign()
    imageComparator.refresh();
    window.alert("this function is developing...");
  });
