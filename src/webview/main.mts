import {
  provideVSCodeDesignSystem, vsCodeButton, Button,
  vsCodeOption, vsCodeProgressRing, vsCodeTextArea, ProgressRing, vsCodeCheckbox
} from "@vscode/webview-ui-toolkit";
import { getUri } from "../utilities/getUri.js";
import { text } from "stream/consumers";


provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeOption(), vsCodeProgressRing(), vsCodeCheckbox(), vsCodeTextArea());
const vscode = acquireVsCodeApi();
let seeds = [];
let supportSeeds = [];
let count= true;

window.addEventListener('load', main);
window.addEventListener('load', eventListener);

async function main() {
  const input = document.getElementById('fileInput') as InputFile;
  const slider = document.getElementById('slider') as Slider;
  const sliderValue = document.getElementById('sliderValue') as slidevalue;
  const startButton = document.getElementById('start') as Button;
  const addSeed = document.getElementById('addSeed') as Button;
  startButton?.addEventListener('click', handleStartClick);
  addSeed?.addEventListener('click', createInsertedCheckbox);
  input?.addEventListener('input', handleFileSelect);
  findFile();
  }
document.getElementById('insertedTextContent').addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();
  }
});

function handleStartClick() {
  const startButton = document.getElementById('start');
  startButton?.attributes.setNamedItem(document.createAttribute('disabled'));
  vscode.postMessage({
    command: 'createTxtFile',
    text: seeds.join('\n')
  });
  vscode.postMessage({
    command: 'SliderValue',
    value: sliderValue.value
  });

}
function progressRinghidden() {
  const progressRing = document.getElementById('progressRing');
  const input = document.getElementById('fileInput');
  progressRing?.classList.add('hidden');
  input?.classList.remove('hidden');
}


function findFile() {
  if(localStorage.getItem('seedsState')===null){
    vscode.postMessage({ command: 'findFile' });
    count= false;
  }else{
    restoreSeedsState();
  }
  
}

function setSamplesAndHideProgress(allSamples, progressRing) {
  const startButton = document.getElementById('start');
  const resetButton = document.getElementById('reset');
  const contentDiv = document.getElementById('content');
  const input = document.getElementById('fileInput');

  progressRing.classList.add('hidden');
  startButton?.removeAttribute('disabled');
  createCheckbox(allSamples);

  resetButton.removeAttribute('disabled');
  resetButton.addEventListener('click', () => {
    contentDiv.innerHTML = '';
    localStorage.removeItem('seedsState');
    seeds = seeds.filter(seed => !supportSeeds.includes(seed));
    seeds = seeds.filter(seed => !allSamples.includes(seed));
    resetButton?.attributes.setNamedItem(document.createAttribute('disabled'));
    startButton?.attributes.setNamedItem(document.createAttribute('disabled'));
    input?.classList.remove('hidden');
  });

}

function createCheckbox(allSamples) {
  seeds.push(...allSamples);
  const contentDiv = document.getElementById('content');
  const label = document.createElement('label');
  label.textContent = "Seed sentences:\n";
  contentDiv.appendChild(label);

  seeds.forEach((seed, index) => {
    const container = document.createElement('div');
    container.classList.add('seed-container'); // Classe per lo stile del container

    const checkbox = document.createElement('vscode-checkbox');
    checkbox.setAttribute('checked', '');
    checkbox.textContent = seed;
    checkbox.classList.add('checkbox-container');

    const textArea = document.createElement('vscode-text-area');
    textArea.value = seed;
    textArea.classList.add('hidden');
    textArea.classList.add('vscode-text-area');

    const editButton = document.createElement('vscode-button');
    editButton.textContent = 'Modifica';
    editButton.classList.add('edit-button');

    const saveButton = document.createElement('vscode-button');
    saveButton.textContent = 'Salva';
    saveButton.classList.add('hidden', 'save-button');

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
        seeds[index] = newValue;
        supportSeeds.push(newValue);
      }
      else {
        textArea.value = checkbox.textContent;
      }
      checkbox.classList.remove('hidden');
      editButton.classList.remove('hidden');
      textArea.classList.add('hidden');
      saveButton.classList.add('hidden');
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
}




function createInsertedCheckbox() {
  const insertedDiv = document.getElementById('insertedContent');
  const insertedText = document.getElementById('insertedTextContent');
  if (insertedText.value !== '') {
    const checkbox = document.createElement('vscode-checkbox');
    checkbox.setAttribute('checked', '');
    checkbox.textContent = insertedText.value;
    seeds.push(checkbox.textContent);
    insertedText.value = '';
    checkbox.addEventListener('click', () => {
      if (checkbox.hasAttribute('checked')) {
        seeds.splice(seeds.indexOf(checkbox.textContent), 1);
      } else {
        seeds.push(checkbox.textContent);
      }
    });
    insertedDiv.appendChild(checkbox);
  }
}


function postImplementatio(implementation: string) {
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

      json.interactionModel.languageModel.intents.forEach(intent => {
        if (Array.isArray(intent.samples) && intent.samples.length > 0) {
          allSamples.push(...intent.samples);
        }
      });
      if (allSamples.length === 0) {
        throw new Error("No seed found in JSON file");
      }

      setSamplesAndHideProgress(allSamples, progressRing);

    } catch (error) {
      vscode.postMessage({
        command: 'errorMessage',
        text: "error while loading " + error.message
      });
      progressRinghidden();
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
    progressRinghidden();
  }
}
function saveSeedsState() {
   const seedsState = {
    seeds: seeds,
    supportSeeds: supportSeeds
  };
  localStorage.setItem('seedsState', JSON.stringify(seedsState));
}

function restoreSeedsState() {
  const savedState = localStorage.getItem('seedsState');
  if (savedState) {
    const { seeds: savedSeeds, supportSeeds: savedSupportSeeds } = JSON.parse(savedState);
    if(savedSeeds!==null){
    supportSeeds = savedSupportSeeds;
    seedLoading(savedSeeds);}else{
      findFile();
    }
  }
  
}

function eventListener() {
  window.addEventListener('message', event => {
    const message = event.data;
    const command = message.command;
    const samples = message.samples;
    switch (command) {
      case 'JsonFile': {
        seedLoading(samples);
      }
        break;
      case 'JsonFileNotFound': {
        progressRinghidden();
      }
        break;
      case 'SavedFile': {
        postImplementatio('VUI-UPSET');
        break;
      }
      case 'filteredFinished': {
        const startButton = document.getElementById('start');
        startButton?.removeAttribute('disabled');
        //attivare bottone migloramento robustezza
        break;
      }
      case 'webviewLostFocus':{
        vscode.postMessage({
          command: 'message',
          text: "salvataggio avvio"
      
        });
        saveSeedsState();
        break;}
      case 'webviewGainedFocus':{
        vscode.postMessage({
          command: 'message',
          text: "caricamento avvio"
        });
        break;}
    }
  },
  );
}


sliderValue.addEventListener('input', function () {
  let value = parseFloat(sliderValue.value);
  value = Math.min(100, Math.max(0, value));
  sliderValue.value = value;
  slider.value = value.toString();
});

slider.addEventListener('input', function () {
  sliderValue.value = slider.value;
});

