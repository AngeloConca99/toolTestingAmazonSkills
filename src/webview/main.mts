import {
  provideVSCodeDesignSystem, vsCodeButton, Button,
  vsCodeDropdown, vsCodeOption, Dropdown, vsCodeProgressRing, vsCodeTextArea, ProgressRing
} from "@vscode/webview-ui-toolkit";
import { getUri } from "../utilities/getUri.js";


provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeDropdown(), vsCodeOption(), vsCodeProgressRing(), vsCodeTextArea());
const vscode = acquireVsCodeApi();

window.addEventListener('load', main);

function main() {
  let selection=1;
  const input = document.getElementById('fileInput') as InputFile;
  const slider = document.getElementById('slider') as Slider;
  const sliderValue = document.getElementById('sliderValue') as slidevalue;
  const startButton = document.getElementById('start') as Button;
  const dropdown = document.getElementById('dropdown') as Dropdown;
  startButton?.addEventListener('click', handleStartClick);
  input?.addEventListener('change', handleFileSelect);

  window.addEventListener('message', event => {
    const message = event.data;
    const command = message.command;
    const files = message.files;
    switch (command) {
      case "JsonFile": {
        seedLoading(files);
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
  findFile();
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


function handleDropdownChange():number {
  const selectedOption = (document.getElementById('dropdown') as Dropdown).value;
  let selection;
  switch (selectedOption) {
    case 'option1':{
       selection=1;}
    break;
    case 'option2':{
      selection=2;
    }break;
    case 'option3':{
      selection=3;
    }
    break;
    default:
    selection=1;
    }
    return selection;
}

function handleStartClick() {
  vscode.postMessage({
    command: "start",
    text: "prova ricerca"+handleDropdownChange()
  });
  
}
function progressRinghidden() {
  const progressRing = document.getElementById('progressRing');
  const input = document.getElementById('fileInput');
  progressRing?.classList.add('hidden');
  input?.classList.remove('hidden');
}
function handleFileSelect() {
  const textArea = document.getElementById('textContent');
  const input = document.getElementById('fileInput');
  input?.classList.add('hidden');
  progressRing?.classList.remove('hidden');
  const file = input.files?.[0];

  const reader = new FileReader();
  reader.onload = function (event) {
    const text = event.target?.result as string;
    textArea.value = text;
    progressRing?.classList.add('hidden');
    textArea.classList.remove('hidden');
  };

  reader.onerror = function (event) {
    vscode.postMessage({ command: "start", text: "errore Caricamento file" });
  };

  reader.readAsText(file);
}
function WebviewMessageListener() {

}
function seedLoading(files) {
  const input = document.getElementById('fileInput');
  try {
    const progressRing = document.getElementById('progressRing');
    const textArea = document.getElementById('textContent');
    const allSamples = [];


    files.forEach(file => {

      if (file && file.interactionModel && file.interactionModel.languageModel && file.interactionModel.languageModel.intents) {

        file.interactionModel.languageModel.intents.forEach(intent => {

          if (Array.isArray(intent.samples) && intent.samples.length > 0) {

            allSamples.push(...intent.samples);
          }
        });
      } else {

        vscode.postMessage({
          command: "start",
          text: "Struttura del file JSON non valida o mancante"
        });
        progressRinghidden();
        return;
      }
    });
    if (allSamples.length === 0) {
      vscode.postMessage({
        command: "start",
        text: "Nessun campione trovato negli intenti dei file JSON"
      });
      progressRinghidden();
      return;
    }


    const samplesText = allSamples.join('\n');

    textArea.value = samplesText;


    progressRing?.classList.add('hidden');
    textArea?.classList.remove('hidden');


    
  } catch (error) {
    vscode.postMessage({
      command: "start",
      text: "Errore durante il caricamento " + error
    });
    progressRinghidden();
  }
}

function findFile() {
  vscode.postMessage({ command: 'findFile' });
}

