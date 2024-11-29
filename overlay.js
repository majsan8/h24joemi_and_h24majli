document.addEventListener("DOMContentLoaded", function () {
  const body = document.querySelector("body");

  const toggleWrapper = document.createElement("div");
  toggleWrapper.className = "toggle-wrapper";
  toggleWrapper.style.position = "fixed";
  toggleWrapper.style.left = "50px";
  toggleWrapper.style.top = "30px";
  toggleWrapper.style.padding= "0";
  toggleWrapper.style.border= "none";
  toggleWrapper.style.margin= "0";
  toggleWrapper.style.zIndex = "50";
  toggleWrapper.style.transform = "translateY(-50%)";

  const toggleSwitch = document.createElement("input");
  toggleSwitch.type = "checkbox";
  toggleSwitch.id = "toggleReference";
  toggleSwitch.className = "toggle-switch";
  toggleSwitch.style.display = "none";

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "switch";
  toggleLabel.htmlFor = "toggleReference";
  toggleLabel.style.display = "block";
  toggleLabel.style.width = "20px";
  toggleLabel.style.height = "40px";
  toggleLabel.style.padding= "0";
  toggleLabel.style.border= "2px solid black";
  toggleLabel.style.margin= "0";
  toggleLabel.style.background = "white";
  toggleLabel.style.position = "relative";
  toggleLabel.style.borderRadius = "12px";

  const knob = document.createElement("span");
  knob.className = "slider";
  knob.style.position = "absolute";
  knob.style.top = "2px";
  knob.style.left = "1px";
  knob.style.width = "14px";
  knob.style.height = "14px";
  knob.style.padding= "0";
  knob.style.border= "1px solid black";
  knob.style.margin= "0";
  knob.style.borderRadius = "10px";
  knob.style.background = "red";
  knob.style.boxShadow = "none";
  knob.style.transition = "0.4s";

  toggleLabel.appendChild(knob);
  toggleWrapper.appendChild(toggleSwitch);
  toggleWrapper.appendChild(toggleLabel);

  body.appendChild(toggleWrapper);

  toggleSwitch.addEventListener("change", function() {
    if (this.checked) {
      knob.style.top = "20px";
      knob.style.background = "#2D5";
    } else {
      knob.style.top = "2px";
      knob.style.background = "red";
    }
  });

  const fetchWidthHeightMap = async () => {
    const response = await fetch(`./control/images/ass_layout_w_h.json`);
    console.log(response);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to load ass_layout width-height map`);
    }
  };

  const updateBackgroundImage = (widthHeightMap) => {
    const w = window.innerWidth;
    if (w >= 392 && w <= 1600) {
      const h = widthHeightMap[w.toString()];
      if (h) {
        const imagePath = `./control/images/ass_layout_${h}_${w}.webp`;
        
        const referenceImage = document.createElement("div");
        referenceImage.className = "reference_image";

        let scrollbarWidth = (w - document.documentElement.clientWidth) / 2;
        /* window.alert(scrollbarWidth); */

        referenceImage.style.position = "absolute";
        referenceImage.style.top = "0px";
        referenceImage.style.left = `-${scrollbarWidth}px`;
        referenceImage.style.zIndex = "20";
        referenceImage.style.width = "100%";
        referenceImage.style.height = `${h}px`;
        referenceImage.style.backgroundImage = `url('${imagePath}')`;
        referenceImage.style.backgroundSize = "cover";
        referenceImage.style.backgroundPosition = "left";
        referenceImage.style.backgroundRepeat = "no-repeat";
        referenceImage.style.opacity = "1";
        
        body.appendChild(referenceImage);
      }
    }
  };

  const applyBackground = (widthHeightMap) => {
    const existingReference = document.querySelector(".reference_image");
    if (existingReference) {
      existingReference.remove();
    }
    if (toggleSwitch.checked) {
      updateBackgroundImage(widthHeightMap);
    }
  };

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  fetchWidthHeightMap()
  .then((widthHeightMap) => {
    const debouncedUpdate = debounce(() => applyBackground(widthHeightMap), 150);
    debouncedUpdate();
    window.addEventListener("resize", debouncedUpdate);
    toggleSwitch.addEventListener("change", debouncedUpdate);
  })
  .catch((error) => {
    console.error(`Failed to load ass_layout width-height map:`, error);
  });
});
