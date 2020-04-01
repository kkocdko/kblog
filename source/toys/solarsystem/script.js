"use strict";

setTimeout(() => {
  window.scrollTo(
    (document.body.clientWidth - window.innerWidth) / 2,
    (document.body.clientHeight - window.innerHeight) / 2
  );
}, 200);

setTimeout(() => {
  document.body.classList.remove("hidden");
}, 300);

window.addEventListener(
  "mousedown",
  ({ clientX: originX, clientY: originY }) => {
    const onMouseMove = ({ clientX: currentX, clientY: currentY }) => {
      const relativeX = currentX - originX;
      const relativeY = currentY - originY;
      window.scrollBy(-relativeX, -relativeY);
      originX = currentX;
      originY = currentY;
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }
);
