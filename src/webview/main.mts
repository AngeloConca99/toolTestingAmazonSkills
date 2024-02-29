import {
  provideVSCodeDesignSystem, vsCodeButton, Button,
  vsCodeDropdown, vsCodeOption, Dropdown, vsCodeProgressRing, vsCodeTextArea, ProgressRing, vsCodeCheckbox
} from "@vscode/webview-ui-toolkit";
import { getUri } from "../utilities/getUri.js";


provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeDropdown(), vsCodeOption(), vsCodeProgressRing(), vsCodeCheckbox(), vsCodeTextArea());
const vscode = acquireVsCodeApi();

window.addEventListener('load', main);
window.addEventListener('load', eventListern);

async function main() {
  let selection = 1;
  const input = document.getElementById('fileInput') as InputFile;
  const slider = document.getElementById('slider') as Slider;
  const sliderValue = document.getElementById('sliderValue') as slidevalue;
  const startButton = document.getElementById('start') as Button;
  const dropdown = document.getElementById('dropdown') as Dropdown;
  startButton?.addEventListener('click', handleStartClick);
  input?.addEventListener('change', handleFileSelect);
  findFile();
}

function handleStartClick() {
  const textArea = document.getElementById('textContent');
  vscode.postMessage({
    command: 'message',
    text: "prova ricerca"
  });
  vscode.postMessage({
    command: 'createTxtFile',
    text: textArea.value
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

function setSamplesAndHideProgress(allSamples, textArea, progressRing) {
  const startButton = document.getElementById('start');
  //const samplesText = allSamples.join('\n');
  //textArea.value = samplesText;
  progressRing.classList.add('hidden');
  //textArea.classList.remove('hidden');
  startButton?.removeAttribute('disabled');
  provachekbox(allSamples);
}
function provachekbox(allSamples) {
  const textArea = document.getElementById('textContent');
  let seeds = allSamples.slice();
  const contentDiv = document.getElementById('content');

  seeds.forEach((seed, index) => {
    const checkbox = document.createElement('vscode-checkbox');
    checkbox.setAttribute('checked', '');
    checkbox.textContent = seed;
    checkbox.addEventListener('click', () => {
      if (checkbox.hasAttribute('checked')) {
        seeds.splice(seeds.indexOf(seed), 1);
      } else {
        seeds.push(seed);
      }
      updateTextarea(seeds, textArea);
    });
    contentDiv.appendChild(checkbox);
  });
  textArea.value = seeds.join('\n');
  //textArea.classList.remove('hidden'); //eliminare il commento se si verificano problemi nella creazione del file
}

function updateTextarea(seeds, textArea) {
  textArea.value = seeds.join('\n');
}


function postImplementatio(implementation: string) {
  vscode.postMessage({
    command: implementation,
  });
}

function chosenimplementation() {
  const selectedOption = (document.getElementById('dropdown') as Dropdown).value;
  let selection;
  switch (selectedOption) {
    case 'option1': {
      postImplementatio('VUI-UPSET');

    }
      break;
    case 'option2': {
      postImplementatio('GRSBV');

    } break;
    case 'option3': {
      postImplementatio('ChatGpt');
    }
      break;
    default:
      postImplementatio('ChatGpt');
  }
}

function handleFileSelect() {
  const textArea = document.getElementById('textContent');
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
      setSamplesAndHideProgress(allSamples, textArea, progressRing);

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
    const textArea = document.getElementById('textContent');
    setSamplesAndHideProgress(samples, textArea, progressRing);
  } catch (error) {
    vscode.postMessage({
      command: 'errorMessage',
      text: "error while loading " + error.message
    });
    progressRinghidden();
  }
}

async function eventListern() {
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
        chosenimplementation();

      }


    }
  },
  );
}


sliderValue.addEventListener('input', function () {
  let value = parseFloat(sliderValue.value);
  value = Math.min(10, Math.max(0, value));
  sliderValue.value = value;
  slider.value = value.toString();
});

slider.addEventListener('input', function () {
  sliderValue.value = slider.value;
});
