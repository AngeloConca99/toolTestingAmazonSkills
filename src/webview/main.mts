import {
  provideVSCodeDesignSystem, vsCodeButton, Button,
  vsCodeOption,vsCodeProgressRing, vsCodeTextArea, ProgressRing, vsCodeCheckbox
} from "@vscode/webview-ui-toolkit";
import { getUri } from "../utilities/getUri.js";
import { text } from "stream/consumers";


provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeOption(), vsCodeProgressRing(), vsCodeCheckbox(), vsCodeTextArea());
const vscode = acquireVsCodeApi();
let seeds = [];

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
  input?.addEventListener('change', handleFileSelect);
  findFile();
}
document.getElementById('insertedTextContent').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
      event.preventDefault();
  }
});

function handleStartClick() {
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
  vscode.postMessage({ command: 'findFile' });
}

function setSamplesAndHideProgress(allSamples, progressRing) {
  const startButton = document.getElementById('start');
  progressRing.classList.add('hidden');
  startButton?.removeAttribute('disabled');
  createCheckbox(allSamples);
}

function createCheckbox(allSamples) {
  seeds.push(...allSamples);
  const contentDiv = document.getElementById('content');
  const label = document.createElement('label');
  label.textContent="Seed sentences:\n";
  contentDiv.appendChild(label);
  seeds.forEach((seed) => {
    const checkbox = document.createElement('vscode-checkbox');
    checkbox.setAttribute('checked', '');
    checkbox.textContent = seed;
    checkbox.addEventListener('click', () => {
      if (checkbox.hasAttribute('checked')) {
        seeds.splice(seeds.indexOf(seed), 1);
      } else {
        seeds.push(seed);
      }
    });
    contentDiv.appendChild(checkbox);
  });
}

function createInsertedCheckbox(){
  const insertedDiv = document.getElementById('insertedContent');
  const insertedText = document.getElementById('insertedTextContent');
  if(insertedText.value !== ''){
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
      case'filteredFinished':{
        //attivare bottone migloramento robustezza
        break;
      }


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

