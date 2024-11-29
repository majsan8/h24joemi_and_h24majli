function normalizeLineBreaks(content) {
  return content.replace(/\r\n|\r|\n/g, '\n');
}

function minifyCss(css) {
  css = normalizeLineBreaks(css);
  return css.replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, "$1").trim();
}

const studentFiles = new Map();
[
  "css/flexbox.css",
  "css/css-grid.css",
  "css/css-grid-area.css",
].forEach((file) => studentFiles.set(file, ""));

const referenceFiles = new Map();
studentFiles.forEach((value, key) => {
  referenceFiles.set(`control/${key}`, value);
});

async function fetchFileContent(file) {
  console.log('Entered fetchFileContent function');
  try {
    const response = await fetch(file);
    if (!response.ok) {
      throw new Error(`Network response was not ok for ${file}`);
    }
    const content = await response.text();
    console.log(`Fetched ${file}:`, content);
    return minifyCss(content); // Directly calling minifyCss here
  } catch (error) {
    console.error(`Fetch error for ${file}:`, error);
    return null;
  }
}

async function loadFiles() {
  console.log('Entered loadFiles function');
  const studentPromises = Array.from(studentFiles.keys()).map((file, index) => {
    console.log(`Fetching student file ${index + 1}: ${file}`);
    return fetchFileContent(file).then(content => {
      if(content !== null) {
        console.log(`Successfully fetched and minified student file ${index + 1}: ${file}`);
        console.log(content);
        studentFiles.set(file, content);
      }
    });
  });

  const referencePromises = Array.from(referenceFiles.keys()).map((file, index) => {
    console.log(`Fetching reference file ${index + 1}: ${file}`);
    return fetchFileContent(file).then(content => {
      if(content !== null) {
        console.log(`Successfully fetched and minified reference file ${index + 1}: ${file}`);
        console.log(content);
        referenceFiles.set(file, content);
      }
    });
  });

  return Promise.all([...studentPromises, ...referencePromises])
    .then(() => {
      console.log("All files successfully loaded");
    })
    .catch((error) => {
      console.error("An error occurred during file loading:", error);
    });
}

function extractRules(css, category) {
  console.log('Entered extractRules function');
  let regex = new RegExp(
    category + "[\\s\\S]*?--------------------------",
    "g"
  );
  let matched = css.match(regex)[0];
  let rules = matched
    .match(/¤ (.*?)(?=[|\n])/g)
    .map((rule) => rule.slice(2).trim());
  return rules;
}

function readRulesFromReferenceFiles(referenceFiles) {
  console.log('Entered readRulesFromReferenceFiles function');
  const ruleFiles = [
    "control/css/flexbox.css",
    "control/css/css-grid.css",
    "control/css/css-grid-area.css",
  ];
  let rules = {};
  ruleFiles.forEach((file) => {
    let css = referenceFiles.get(file);
    if (css) {
      rules[file] = {
        mandatoryDeclaration: extractRules(css, "Mandatory declaration"),
        permittedMediaQueries: extractRules(css, "Permitted media queries"),
        permittedProperties: extractRules(css, "Permitted properties"),
      };
    }
    console.log(`Extracted rules for ${file}: `, rules[file]);
  });
  return rules;
}

function removeCssComments(css) {
  console.log('Entered removeCssComments function');
  let regex = /\/\*[\s\S]*?\*\//g;
  return css.replace(regex, "").trim();
}

function validateMandatoryDeclarations(
  css,
  mandatoryDeclarations,
  allowedDisplayValue
) {
  console.log('Entered validateMandatoryDeclarations function');
  css = removeCssComments(css);
  let isValid = true;
  if (css.length === 0) {
    return ["Empty file"];
  }
  mandatoryDeclarations.forEach((declaration) => {
    if (!css.includes(declaration)) {
      isValid = false;
    }
  });
  const displayPropertyPattern = /display:\s*([^;]*);/g;
  let match;
  while ((match = displayPropertyPattern.exec(css)) !== null) {
    const displayValue = match[1].trim();
    if (displayValue !== allowedDisplayValue) {
      isValid = false;
    }
  }

  return isValid;
}

function validatePermittedMediaQueries(css, permittedMediaQueries) {
  console.log('Entered validatePermittedMediaQueries function');
  css = removeCssComments(css);
  if (css.length === 0) {
    return ["Empty file"];
  }
  
  let isValid = true;
  let regex = /@media[^{]+\{/g;
  let foundMediaQueries = css.match(regex) || [];
  
  if (foundMediaQueries.length === 0) {
    return ["No Media Query"];
  } else if (foundMediaQueries.length === 1) {
    return ["Requires Two"];
  }
  
  foundMediaQueries.forEach((query) => {
    if (!permittedMediaQueries.includes(query.trim())) {
      isValid = false;
    }
  });

  return isValid;
}


function validatePermittedProperties(css, permittedProperties) {
  console.log('Entered validatePermittedProperties function');
  css = removeCssComments(css);
  if (css.length === 0) {
    return ["Empty file"];
  }

  let invalidProperties = [];

  css = css.replace(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, "") // remove comments
  console.log('No comments:', css);
  css = css.replace(/@[^{]*\{/g, "") // remove @media and everything up to opening brace
  console.log('No @media:', css);
  css = css.replace(/[^{]*\{([^}]*)\}/g, "$1") // remove selectors and braces
  console.log('No selectors:', css);
  css = css.replace(/}/g, ""); // remove all stray closing braces
  console.log('No closing braces:', css);

  css = css.split(';');
  let foundProperties = css.map(pair => pair.split(':')[0]).filter(Boolean);
/*   let foundProperties = css.match(/[^:\s]+(?=:)/g); // regex to match css properties */
  console.log('FoundProperties:', foundProperties);

  foundProperties.forEach((property) => {
    if (!permittedProperties.includes(property)) {
      invalidProperties.push(property);
    }
  });

  console.log('Invalid properties:', invalidProperties);
  return invalidProperties;
}

function validateStudentCss(studentFiles, rules) {
  let validationResults = {};
  console.log('Entered validateStudentCss function');
  console.log('Initial rules:', rules);
  
  for (const [file, css] of studentFiles) {
    console.log(`Processing ${file}`);
    let strippedFile = `control/${file}`;
    
    console.log(strippedFile);
    console.log(rules[strippedFile]);
    if (rules[strippedFile]) {
      console.log(`Validating file: ${strippedFile}`);
      console.log(`Rules for ${strippedFile}:`, rules[strippedFile]);
      
      const allowedDisplayValue = strippedFile.includes("flexbox") ? "flex" : "grid";
      
      // Perform validation and log the intermediate results
      const mandatoryDeclarations = validateMandatoryDeclarations(css, rules[strippedFile].mandatoryDeclaration, allowedDisplayValue);
      console.log(`Mandatory declarations check result for ${strippedFile}: ${mandatoryDeclarations}`);
      
      const permittedMediaQueries = validatePermittedMediaQueries(css, rules[strippedFile].permittedMediaQueries);
      console.log(`Permitted media queries check result for ${strippedFile}: ${permittedMediaQueries}`);
      
      const invalidProperties = validatePermittedProperties(css, rules[strippedFile].permittedProperties);
      console.log(`Invalid properties found for ${strippedFile}:`, invalidProperties);
      
      // Store results
      validationResults[strippedFile] = {
        mandatoryDeclarations,
        permittedMediaQueries,
        invalidProperties,
      };
      
      // Log final validation result for this file
      console.log(`Validation results for ${strippedFile}:`, validationResults[strippedFile]);
    }
  }
  
  // Log final validation results
  console.log('Final validation results:', validationResults);
  
  return validationResults;
}

function generateFeedbackHtml(validationResults) {
  console.log(validationResults);
  let feedbackHtml = `
                  <h2 style="font-size: 2rem; color: white; margin-bottom: 1rem;">Rules</h2>
                  <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
                    <thead style="background-color: white;">
                      <tr>
                        <th style="font-size: 1rem; text-align: left; word-wrap: break-all; padding: 10px; border: 1px solid white;">File</th>
                        <th style="font-size: 1rem; text-align: left; word-wrap: break-all; padding: 10px; border: 1px solid white;">Prop&shy;erties</th>
                        <th style="font-size: 1rem; text-align: left; word-wrap: break-all; padding: 10px; border: 1px solid white;">Declar&shy;ations</th>
                        <th style="font-size: 1rem; text-align: left; word-wrap: break-all; padding: 10px; border: 1px solid white;">Media Queries</th>
                      </tr>
                    </thead>
                    <tbody>
                    `;
  
  for (let [file, result] of Object.entries(validationResults)) {
    let fileName = file.replace("control/css/", "").replace(".css", "").replace("-", " ");
    let propertiesStatus = '';
    let declarationsStatus = '';
    let mediaQueriesStatus = '';

    for (let [rule, value] of Object.entries(result)) {
      if (rule === "invalidProperties") {
        if (value[0] === "Empty file") {
          propertiesStatus = '<span style="color: red;">File is Empty!</span>';
        } else {
          if (value.length > 0) {
            propertiesStatus = '<span style="font-size: 1rem; color: red;">Not allowed:</span>';
            propertiesStatus += '<ul style="font-size: 1rem; color: white; margin: 0; padding-left: 20px;">';
            for (let prop of value) {
              propertiesStatus += `<li style="font-size: 1rem; text-align: left; word-wrap: break-all;">${prop}</li>`;
            }
            propertiesStatus += '</ul>';
          } else {
            propertiesStatus = '<span style="color: #2D5;">No rule broken</span>';
          }
        }
      } else if (rule === "mandatoryDeclarations") {
          if (value[0] === "Empty file") {
            declarationsStatus = '<span style="color: red;">File is Empty!</span>';
          } else {
              declarationsStatus = value ? '<span style="font-size: 1rem; color: #2D5;">No rule broken</span>' : '<span style="color: red;">Failed</span>';
          }
        }
        else {
          if (value[0] === "Empty file") {
            mediaQueriesStatus = '<span style="color: red;">File is Empty!</span>';
          } else if (value[0] === "No Media Query") {
            mediaQueriesStatus = '<span style="color: red;">None Present</span>';
          } else if (value[0] === "Requires Two") {
            mediaQueriesStatus = '<span style="color: red;">Requires Two</span>';
          } else {
            mediaQueriesStatus = value ? '<span style="font-size: 1rem; color: #2D5;">No rule broken</span>' : '<span style="color: red;">Failed</span>';
          }
      }
    }

    feedbackHtml += `<tr style="border: 1px solid white;">`;
    feedbackHtml += `<td style="font-size: 1rem; text-transform: uppercase; text-align: left; word-wrap: break-all; color: white; padding: 10px; border: 1px solid white;">${fileName}</td>`;
    feedbackHtml += `<td style="font-size: 1rem; text-align: left; word-wrap: break-all; padding: 10px; border: 1px solid white;">${propertiesStatus}</td>`;
    feedbackHtml += `<td style="font-size: 1rem; text-align: left; word-wrap: break-all; padding: 10px; border: 1px solid white;">${declarationsStatus}</td>`;
    feedbackHtml += `<td style="font-size: 1rem; text-align: left; word-wrap: break-all; padding: 10px; border: 1px solid white;">${mediaQueriesStatus}</td>`;
    feedbackHtml += `</tr>`;
  }
  
  feedbackHtml += '</tbody>';
  feedbackHtml += '</table>';
  
  return feedbackHtml;
}

function resetProgramState() {
  studentFiles.clear();
  [
    "css/flexbox.css",
    "css/css-grid.css",
    "css/css-grid-area.css",
  ].forEach((file) => studentFiles.set(file, ""));

  referenceFiles.clear();
  studentFiles.forEach((value, key) => {
    referenceFiles.set(`control/${key}`, value);
  });

  changeFeedbackHtml = "";

  document.querySelector("#output").innerHTML = "";
}

async function runAllFunctions(e) {
  await loadFiles();
  console.log("Completed loading files.");

  const rules = readRulesFromReferenceFiles(referenceFiles);
  console.log("Read rules from reference files.");
  console.log("Student files:", studentFiles);
  console.log("Rules:", rules);

  const validationResults = validateStudentCss(studentFiles, rules);
  console.log("Validation completed.");

  const feedbackHtml = generateFeedbackHtml(validationResults);
  console.log("Feedback HTML generated.");

  document.querySelector("#output").innerHTML = feedbackHtml;
}

function generateButtonAndModal() {
  const button = document.createElement('button');
  button.id = 'run-button';
  button.innerHTML = '&#10067;';
  button.style.position = 'fixed';
  button.style.zIndex = '25';
  button.style.top = '10px';
  button.style.left = '5px';
  button.style.height = '40px';
  button.style.width = '40px';
  button.style.fontSize = "18px";
  button.style.color = "black";
  button.style.background = "white";
  button.style.border = "2px solid black";
  button.style.borderRadius = '10px';
  button.style.margin= "0";
  button.style.boxShadow = 'none';
  document.body.appendChild(button);

  const modal = document.createElement('div');
  modal.id = 'myModal';
  modal.className = 'modal';
  modal.style.display = 'none';
  modal.style.position = 'fixed';
  modal.style.zIndex = '30';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.height = '100%';
  modal.style.width = '100%';
  modal.style.padding= "0";
  modal.style.border= "none";
  modal.style.margin= "0";
  modal.style.overflow = 'auto';
  modal.style.backgroundColor = 'rgba(255,255,255,0.75)';
  modal.style.boxShadow = 'none';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.style.position = 'relative';
  modalContent.style.width = '80%';
  modalContent.style.padding = '40px';
  modalContent.style.border = 'none';
  modalContent.style.margin = 'auto';
  modalContent.style.placeContent = 'center'
  modalContent.style.backgroundColor = 'black';
  modalContent.style.boxShadow = 'none';
  modalContent.style.overflow = 'hidden';

  const closeButton = document.createElement('span');
  closeButton.className = 'close';
  closeButton.innerHTML = '&#10006;';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '5px';
  closeButton.style.display = 'block';
  closeButton.style.height = '24px';
  closeButton.style.width = '24px';
  closeButton.style.padding= "0";
  closeButton.style.border= "none";
  closeButton.style.margin= "0";
  closeButton.style.color = '#FFF';
  closeButton.style.fontSize = '16px';
  closeButton.style.fontWeight = 'bold';
  closeButton.style.cursor = 'pointer';
  closeButton.style.lineHeight = '24px';
  closeButton.style.textAlign = 'center';
  closeButton.style.backgroundColor = 'red';
  closeButton.style.borderRadius = '100vmax';
  closeButton.style.boxShadow = 'none';
  
  const outputDiv = document.createElement('div');
  outputDiv.id = 'output';
  outputDiv.style.position = 'relative';
  outputDiv.style.width = '100%';
  outputDiv.style.padding = '20px';
  outputDiv.style.border = 'none';
  outputDiv.style.margin = 'auto';
  outputDiv.style.fontSize = '28px';
  outputDiv.style.fontWeight = 'bold';
  outputDiv.style.backgroundColor = 'black';
  outputDiv.style.boxShadow = 'none';

  modalContent.appendChild(closeButton);
  modalContent.appendChild(outputDiv);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  closeButton.onclick = function () {
    modal.style.display = 'none';
  };

  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };

  button.addEventListener('click', async function () {
    await runAllFunctions();
    modal.style.display = 'grid';
  });
}

document.addEventListener('DOMContentLoaded', function () {
  generateButtonAndModal();
});
