import {
  provideVSCodeDesignSystem, vsCodeButton, Button,
  vsCodeDropdown, vsCodeOption, Dropdown, vsCodeProgressRing, vsCodeTextArea
} from "@vscode/webview-ui-toolkit";
import { getUri } from "../utilities/getUri.js";

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeDropdown(), vsCodeOption(), vsCodeProgressRing(), vsCodeTextArea());
const vscode = acquireVsCodeApi();

window.addEventListener('load', main);

function main() {
  const input=document.getElementById('fileInput')as FileInput;
  input?.addEventListener('change',handleFileSelect);
  const dropdown = document.getElementById('dropdown') as Dropdown;
  dropdown?.addEventListener('input', handleDropdownChange);
  const startButton = document.getElementById('start') as Button;
  startButton?.addEventListener('click', handleStartClick);
  const slider = document.getElementById('slider')as Slider;
  const sliderValue = document.getElementById('sliderValue') as slidevalue;

}
sliderValue.addEventListener('input', function() {
  let value = parseFloat(sliderValue.value);
  value = Math.min(100, Math.max(0, value));
  sliderValue.value=value;
  slider.value = value.toString();
});

slider.addEventListener('input', function() {
  sliderValue.value = slider.value;
});

function handleDropdownChange() {
  const selectedOption = (document.getElementById('dropdown') as Dropdown).value;

  switch (selectedOption) {
    case 'option1':
      



      break;
    case 'option2':
      


      break;
    case 'option3':
      

      break;
    default:
     
     }
}

function handleStartClick() {
  vscode.postMessage({
    command: "start",
    text: "ciao"
  });
}
function handleFileSelect() {
  const progressRing=document.getElementById('progressRing');
  const textArea = document.getElementById('textContent');
  const input = document.getElementById('fileInput');
  input?.classList.add('hidden');
  progressRing?.classList.remove('hidden');
  const file = input.files?.[0]; 
  if (!file) return;

  const reader = new FileReader(); 
  reader.onload = function(event) {
      const text = event.target?.result as string; 
      textArea.value = text;
      progressRing?.classList.add('hidden');

      textArea.classList.remove('hidden');
  };

  reader.onerror = function(event) {
      console.error("Errore durante il caricamento del file:", reader.error);
  };

  reader.readAsText(file);
}

