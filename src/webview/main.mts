import {
  provideVSCodeDesignSystem, vsCodeButton, Button,
  vsCodeDropdown, vsCodeOption, Dropdown, vsCodeProgressRing, vsCodeTextArea, ProgressRing
} from "@vscode/webview-ui-toolkit";
import { getUri } from "../utilities/getUri.js";


provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeDropdown(), vsCodeOption(), vsCodeProgressRing(), vsCodeTextArea());
const vscode = acquireVsCodeApi();

window.addEventListener('load', main);
window.addEventListener('load', eventlistern);

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
  vscode.postMessage({
    command: "start",
    text: "prova ricerca" + handleDropdownChange()
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
  const samplesText = allSamples.join('\n');
  textArea.value = samplesText;
  progressRing.classList.add('hidden');
  textArea.classList.remove('hidden');
}

function handleDropdownChange(): number {
  const selectedOption = (document.getElementById('dropdown') as Dropdown).value;
  let selection;
  switch (selectedOption) {
    case 'option1': {
      selection = 1;
    }
      break;
    case 'option2': {
      selection = 2;
    } break;
    case 'option3': {
      selection = 3;
    }
      break;
    default:
      selection = 1;
  }
  return selection;
}
function handleFileSelect() {
  const textArea = document.getElementById('textContent');
  const input = document.getElementById('fileInput');
  const progressRing = document.getElementById('progressRing');

  if (!input.files || input.files.length === 0) {
    throw new Error("Nessun file Selezionato");
  }

  const file = input.files[0];
  if (!file || !file.name.endsWith('.json')) {
    throw new Error("seleziona un file json valido");
  }

  input.classList.add('hidden');
  progressRing.classList.remove('hidden');

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const json = JSON.parse(event.target.result);
      const allSamples = [];

      if (!json || !json.interactionModel || !json.interactionModel.languageModel || !json.interactionModel.languageModel.intents) {
        throw new Error("Struttura del file JSON non valida");
      }

      json.interactionModel.languageModel.intents.forEach(intent => {
        if (Array.isArray(intent.samples) && intent.samples.length > 0) {
          allSamples.push(...intent.samples);
        }
      });

      if (allSamples.length === 0) {
        throw new Error("Nessuna 'seed' trovata negli intenti del file JSON");
      }
      setSamplesAndHideProgress(allSamples, textArea, progressRing);

    } catch (error) {
      vscode.postMessage({
        command: "start",
        text: "Errore durante il caricamento del file JSON: " + error.message
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
      command: "start",
      text: "Errore durante il caricamento " + error.message
    });
    progressRinghidden();
  }
}


async function eventlistern() {
  window.addEventListener('message', event => {
    const message = event.data;
    const command = message.command;
    const samples = message.samples;
    switch (command) {
      case "JsonFile": {
        seedLoading(samples);
      }
        break;
      case "JsonFileNotFound": {
        progressRinghidden();
      }
        break;

    }
  },
    undefined,
    this._disposables
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
