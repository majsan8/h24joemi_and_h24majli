function updateValue() {
  var screenWidthElement = document.getElementById("screenWidth");
  var width = window.innerWidth;
  screenWidthElement.innerText = "Screen width: " + width + "px";

  if (width === 768 || width === 1024) {
    screenWidthElement.classList.add("sizeAlert");
  } else {
    screenWidthElement.classList.remove("sizeAlert");
  }
}

var screenWidthDiv = document.createElement("div");
screenWidthDiv.id = "screenWidth";
document.querySelector("header").appendChild(screenWidthDiv);

window.addEventListener("resize", updateValue);
updateValue();

var outOfRangeElement = document.createElement("outofrange");

var toNarrowElement = document.createElement("tonarrow");
toNarrowElement.innerHTML = "&lt;500";
outOfRangeElement.appendChild(toNarrowElement);

var toWideElement = document.createElement("towide");
toWideElement.innerHTML = "&gt;1280";
outOfRangeElement.appendChild(toWideElement);

document.body.appendChild(outOfRangeElement);
