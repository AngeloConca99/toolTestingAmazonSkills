import {
  provideVSCodeDesignSystem, vsCodeButton, Button,
  vsCodeOption, vsCodeProgressRing, vsCodeTextArea, ProgressRing, vsCodeCheckbox
} from "@vscode/webview-ui-toolkit";
import { getUri } from "../utilities/getUri.js";
import { text } from "stream/consumers";
import { QuickPickManager } from "../utilities/QuickPickManager.js";



provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeOption(), vsCodeProgressRing(), vsCodeCheckbox(), vsCodeTextArea());
const vscode = acquireVsCodeApi();
let seeds = [];
let uncheckedSeeds = [];
let supportSeeds = [];
let editedSeeds = [];
let seedsCopy = [];
let startButtonDisable = true;
let slideValueGlobal = 0;
const startButton = document.getElementById('start');
const resetButton = document.getElementById('reset');
// const slider = document.getElementById('slider') as Slider;
// const sliderValue = document.getElementById('sliderValue') as slidevalue;



window.addEventListener('load', main);
window.addEventListener('load', eventListener);

async function main() {
  const input = document.getElementById('fileInput');
  const addSeed = document.getElementById('addSeed');
  startButton?.addEventListener('click', handleStartClick);
  addSeed?.addEventListener('click', createInsertedCheckbox);
  input?.addEventListener('input', handleFileSelect);
  // const resetButton = document.getElementById('reset');
  resetButton?.addEventListener('click', resetSeeds);
  // sliderValue.addEventListener('input', sliderValueSet);
  // slider.addEventListener('input', sliderSet);
  // sliderValue?.attributes.setNamedItem(document.createAttribute('value'));
  // slider?.attributes.setNamedItem(document.createAttribute('value'));
  // slider.value = slideValueGlobal.toString();
  // sliderValue.value = slideValueGlobal;
  findFile();
}

document.getElementById('insertedTextContent').addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    createInsertedCheckbox();
  }
});

function handleStartClick() {
  startButtonDisable = true;
  startButton?.attributes.setNamedItem(document.createAttribute('disabled'));
  vscode.postMessage({
    command: 'createTxtFile',
    text: seedsCopy
  });
  vscode.postMessage({
    command: 'SliderValue',
    value: 0
  });
  saveSeedsState();

}

function hideProgressRing() {
  const progressRing = document.getElementById('progressRing');
  const input = document.getElementById('fileInput');
  progressRing?.classList.add('hidden');
  input?.classList.remove('hidden');
  startButtonDisable = true;
  startButton?.attributes.setNamedItem(document.createAttribute('disabled'));
}


function findFile() {
  const savedState = localStorage.getItem('seedsState');
  if (savedState) {
    const { slideValueGlobal: slideValueSaved, edited_seeds: editedSeed, seeds: savedSeeds, support_Seeds: savedSupportSeeds, unchecked_Seed: uncheckedSeed } = JSON.parse(savedState);
    slideValueGlobal = slideValueSaved;
    // setSlider(sliderValue, slider, slideValueSaved);
    vscode.postMessage({
      command: 'message',
      text: " " + savedState
    });
    if ((uncheckedSeed.length > 0 || savedSupportSeeds.length > 0 || editedSeed.length > 0) && savedSeeds.length > 0) {
      restoreSeedsState();
    } else {
      vscode.postMessage({ command: 'findFile' });
    }
  } else {
    vscode.postMessage({ command: 'findFile' });
  }
}

function setSamplesAndHideProgress(allSamples, progressRing) {
  createCheckbox(allSamples);
  progressRing.classList.add('hidden');
  vscode.postMessage({
    command: 'buttonEnable'
  });
}

function resetSeeds() {
  const insertedDiv = document.getElementById('insertedContent');
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = '';
  seeds = [];
  seedsCopy = [];
  uncheckedSeeds = [];
  supportSeeds = [];
  editedSeeds = [];
  insertedDiv.innerHTML = "";
  localStorage.removeItem('seedsState');
  localStorage.clear();
  findFile();
  resetButton?.attributes.setNamedItem(document.createAttribute('disabled'));
  startButtonDisable = true;
  startButton?.attributes.setNamedItem(document.createAttribute('disabled'));
}

function createCheckbox(allSamples) {
  seeds.push(...allSamples);
  filterSamplesWithBraces(seeds);
  seedsCopy = deepClone(allSamples);
  resetButton.removeAttribute('disabled');
  const contentDiv = document.getElementById('content');
  const label = document.createElement('label');
  label.textContent = "Seed sentences:\n";
  contentDiv.appendChild(label);

  seeds.forEach((seed1, index1) => {
    seed1.samples.forEach((seed, index) => {
      let index_copy = seedsCopy.findIndex(sc => sc.name === seed1.name);
      const container = document.createElement('div');
      container.classList.add('seed-container');

      const checkbox = document.createElement('vscode-checkbox');
      if (!uncheckedSeeds.includes(seed)) {
        checkbox.setAttribute('checked', '');
      } else {

        if (index_copy) {
          let indexco = seedsCopy[index_copy].samples.indexOf(seed);
          if (indexco) {
            seedsCopy[index_copy].samples.splice(indexco, 1);
          }
        }
      }
      checkbox.textContent = seed;
      checkbox.classList.add('checkbox-container');

      const textArea = document.createElement('vscode-text-area');
      textArea.value = seed;
      textArea.classList.add('hidden');
      textArea.classList.add('vscode-text-area');

      const editButton = document.createElement('vscode-button');
      editButton.textContent = 'Edit';
      editButton.classList.add('edit-button');

      const saveButton = document.createElement('vscode-button');
      saveButton.textContent = 'Save';
      saveButton.classList.add('hidden', 'save-button');

      checkbox.addEventListener('click', () => {
        if (checkbox.checked) {
          if (index_copy) {
            let indexco = seedsCopy[index_copy].samples.indexOf(seed);
            if (indexco) {
              seedsCopy[index_copy].samples.splice(indexco, 1);
            }
          }
          if (!uncheckedSeeds.includes(seed)) {
            uncheckedSeeds.push(seed);
          }
        } else {
          if (!seedsCopy.includes(seed)) {
            seedsCopy[index_copy].samples.push(seed);
          }
          let indexun = uncheckedSeeds.indexOf(seed);
          if (indexun > -1) {
            uncheckedSeeds.splice(indexun, 1);
          }
        }
        saveSeedsState();
      });

      editButton.addEventListener('click', () => {
        checkbox.classList.add('hidden');
        editButton.classList.add('hidden');
        textArea.classList.remove('hidden');
        saveButton.classList.remove('hidden');
      });

      saveButton.addEventListener('click', () => {
        if (textArea.value !== "") {
          const newValue = textArea.value;
          checkbox.textContent = newValue;
          let index_cop = seedsCopy.findIndex(sc => sc.name === seeds[index1].name);
          let old = seeds[index1].samples[index];
          let indexseed = seedsCopy[index_cop].samples.indexOf(old);
          seedsCopy[index_cop].samples[indexseed] = newValue;
          seeds[index1].samples[index] = newValue;
          editedSeeds.push(newValue);

        }
        textArea.value = checkbox.textContent;
        checkbox.classList.remove('hidden');
        editButton.classList.remove('hidden');
        textArea.classList.add('hidden');
        saveButton.classList.add('hidden');
        saveSeedsState();
      });

      textArea.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
        }
      });
      container.appendChild(checkbox);
      container.appendChild(textArea);
      container.appendChild(saveButton);
      contentDiv.appendChild(container);
      contentDiv.appendChild(editButton);
    });
  });
  saveSeedsState();
}

function restoreInsertedCheckbox() {
  const insertedDiv = document.getElementById('insertedContent');
  supportSeeds.forEach((obj, index) => {
    obj.samples.forEach((seed,index)=>{
    const checkbox = document.createElement('vscode-checkbox');
    if (!uncheckedSeeds.includes(seed)) {
      checkbox.setAttribute('checked', '');
        addSeedsAndIntent(seed,obj.name,seedsCopy);
    }
    checkbox.textContent = seed;
    checkbox.addEventListener('click', () => {
      if (checkbox.checked) {
          removeSeedsFromIntent(seed,obj.name,seedsCopy);
        if (!uncheckedSeeds.includes(seed)) {
          uncheckedSeeds.push(seed);
        }
      } else {
          addSeedsAndIntent(seed,obj.name,seedsCopy);
        let indexun = uncheckedSeeds.indexOf(seed);
        if (indexun > -1) {
          uncheckedSeeds.splice(indexun, 1);
        }
      }
      saveSeedsState();
    });
    insertedDiv.appendChild(checkbox);
  });});
}

function addSeedsAndIntent(newSeeds, targetIntentName, array) {
  if (!Array.isArray(newSeeds)) {
    newSeeds = [newSeeds];
  }

  const intentIndex = array.findIndex(intentObj => intentObj.name === targetIntentName);

 
  if (intentIndex !== -1) {
    newSeeds.forEach(seed => {
      if (!array[intentIndex].samples.includes(seed)) {
        array[intentIndex].samples.push(seed);
      }
    });
  } else {
    const newIntent = {
      name: targetIntentName,
      samples: newSeeds,
    };
    array.push(newIntent);
  }
}
function removeSeedsFromIntent(seedsToRemove, targetIntentName, array) {
  if (!Array.isArray(seedsToRemove)) {
    seedsToRemove = [seedsToRemove];
  }
  const intentIndex = array.findIndex(intentObj => intentObj.name === targetIntentName);
  if (intentIndex !== -1) {
    array[intentIndex].samples = array[intentIndex].samples.filter(seed => !seedsToRemove.includes(seed));
  }
}
async function createInsertedCheckbox() {
  const insertedDiv = document.getElementById('insertedContent');
  const insertedText = document.getElementById('insertedTextContent');
  if (insertedText.value !== '') {
    const intent =await IntentResponse();
    if(intent){
    const checkbox = document.createElement('vscode-checkbox');
    checkbox.setAttribute('checked', '');
    checkbox.textContent = insertedText.value;
    addSeedsAndIntent(checkbox.textContent,intent,supportSeeds);
    addSeedsAndIntent(checkbox.textContent,intent,seedsCopy);
    insertedText.value = '';
    checkbox.addEventListener('click', () => {
      if (checkbox.checked) {
          removeSeedsFromIntent(checkbox.textContent,intent,seedsCopy);
        if (!uncheckedSeeds.includes(checkbox.textContent)) {
          uncheckedSeeds.push(checkbox.textContent);
        }
      } else {
        addSeedsAndIntent(checkbox.textContent,intent,seedsCopy);
        let indexun = uncheckedSeeds.indexOf(checkbox.textContent);
        if (indexun > -1) {
          uncheckedSeeds.splice(indexun, 1);
        }
      }
      saveSeedsState();
    });
    insertedDiv.appendChild(checkbox);
  saveSeedsState();}
}}

function postImplementation(implementation: string) {
  vscode.postMessage({
    command: implementation,
  });
}


function handleFileSelect() {
  const input = document.getElementById('fileInput');
  const progressRing = document.getElementById('progressRing');

  if (!input.files || input.files.length === 0) {
    throw new Error("No file selected");
  }

  const file = input.files[0];
  if (!file || !file.name.endsWith('.json')) {
    throw new Error("Json file not selected");
  }

  input.classList.add('hidden');
  progressRing.classList.remove('hidden');

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const json = JSON.parse(event.target.result);
      const allSamples = [];

      if (!json || !json.interactionModel || !json.interactionModel.languageModel || !json.interactionModel.languageModel.intents) {
        throw new Error("Invalid JSON file structure");
      }
      allSamples.push(...json.interactionModel.languageModel.intents);
      if (allSamples.length === 0) {
        throw new Error("No seed found in JSON file");
      }

      setSamplesAndHideProgress(allSamples, progressRing);

    } catch (error) {
      vscode.postMessage({
        command: 'errorMessage',
        text: "error while loading " + error.message
      });
      hideProgressRing();
    }

    input.value = '';
  };

  reader.readAsText(file);
}




function seedLoading(samples) {
  const input = document.getElementById('fileInput');
  try {
    const progressRing = document.getElementById('progressRing');
    setSamplesAndHideProgress(samples, progressRing);

  } catch (error) {
    vscode.postMessage({
      command: 'errorMessage',
      text: error.message
    });
    hideProgressRing();
  }
}

function saveSeedsState() {
  // const isStartButtonDisabled = startButtonDisable;
  const seedsState = {
    slideValueGlobal: 0,
    edited_seeds: editedSeeds,
    seeds: seeds,
    support_Seeds: supportSeeds,
    unchecked_Seed: uncheckedSeeds,
  };
  localStorage.setItem('seedsState', JSON.stringify(seedsState));
}

function restoreSeedsState() {
  const savedState = localStorage.getItem('seedsState');
  if (savedState) {
    const { slideValueGlobal: slideValueSaved, edited_seeds: editedSeed, seeds: savedSeeds, support_Seeds: savedSupportSeeds, unchecked_Seed: uncheckedSeed } = JSON.parse(savedState);
    slideValueGlobal = slideValueSaved;
    // setSlider(sliderValue, slider, slideValueSaved);
    if ((uncheckedSeed.length > 0 || savedSupportSeeds.length > 0 || editedSeed.length > 0) && savedSeeds.length > 0) {
      vscode.postMessage({
        command: 'message',
        text: "1 " + savedState
      });
      editedSeeds.push(...editedSeed);
      supportSeeds.push(...savedSupportSeeds);
      uncheckedSeeds.push(...uncheckedSeed);
      seedLoading(savedSeeds);
      restoreInsertedCheckbox();
    }
    else {
      hideProgressRing();
    }
  } else {
    hideProgressRing();
  }
}
function IntentResponse() {
  return new Promise((resolve) => {
    function listener(event) {
      const message = event.data; 
      if (message.command === 'IntentResponse') {
        window.removeEventListener('message', listener); 
        resolve(message.text); 
      }
    }
    window.addEventListener('message', listener);
    vscode.postMessage({
      command:'intentRequest',
      samples: seeds

    });
  });
}

function eventListener() {
  window.addEventListener('message', event => {
    const message = event.data;
    const command = message.command;
    const samples = message.samples;
    const text =message.text;
    const buttonEnable = message.Boolean;
    switch (command) {
      case 'JsonFile': {
        seedLoading(samples);
      }
        break;
      case 'JsonFileNotFound': {
        restoreSeedsState();
      }
        break;
      case 'SavedFile': {
        postImplementation('VUI-UPSET');
      }
        break;
      
      case 'filteredFinished': {
        vscode.postMessage({
          command: 'buttonEnable'
        });}
        break;
      
      case 'webviewLostFocus': {
        saveSeedsState();
        vscode.postMessage({
          command: 'buttonEnable'
        });}
        break;
      
      case 'webviewGainedFocus': {
        vscode.postMessage({
          command: 'buttonEnable'
        });}
        break;
      
      case 'button': {
        startButtonDisable = buttonEnable;
        if (buttonEnable) {
          startButton.setAttribute('disabled', '');
        } else {
          startButton.removeAttribute('disabled');
        }}
        break;
      
    }
  },
  );
}

// function sliderSet() {
//   slideValueGlobal = slider.value;
//   sliderValue.value = slider.value;
//   saveSeedsState();
// }

// function sliderValueSet() {
//   let value = parseFloat(sliderValue.value);
//   value = Math.min(100, Math.max(0, value));
//   sliderValue.value = value;
//   slideValueGlobal = value;
//   slider.value = value.toString();
//   saveSeedsState();
// }
// function setSlider(sliderValue, slider, value) {
//   sliderValue.value = value;
//   slider.value = value.toString();
// }

function deepClone(allseeds) {
  if (allseeds === null || typeof allseeds !== 'object') {
    return allseeds;
  }

  if (allseeds instanceof Date) {
    return new Date(allseeds.getTime());
  }

  if (Array.isArray(allseeds)) {
    const clonedArr = [];
    allseeds.forEach((element) => {
      clonedArr.push(deepClone(element));
    });
    return clonedArr;
  }

  const clonedObj = {};
  for (const key in allseeds) {
    if (allseeds.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(allseeds[key]);
    }
  }
  return clonedObj;
}
function filterSamplesWithBraces(allseeds) {
  if (allseeds === null || typeof allseeds !== 'object') {
    return;
  }

  if (Array.isArray(allseeds)) {
    for (let i = allseeds.length - 1; i >= 0; i--) {
      if (typeof allseeds[i] === 'string' && allseeds[i].includes('{')) {
        allseeds.splice(i, 1); 
      } else {
        filterSamplesWithBraces(allseeds[i]); 
      }
    }
  } else {
    for (const key in allseeds) {
      if (allseeds.hasOwnProperty(key)) {
        filterSamplesWithBraces(allseeds[key]);
      }
    }
  }
}
