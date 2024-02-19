import {
  provideVSCodeDesignSystem, vsCodeButton, Button,
  vsCodeDropdown, vsCodeOption, Dropdown, vsCodeProgressRing, vsCodeTextArea, ProgressRing
} from "@vscode/webview-ui-toolkit";
 import { getUri } from "../utilities/getUri.js";


provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeDropdown(), vsCodeOption(), vsCodeProgressRing(), vsCodeTextArea());
const vscode = acquireVsCodeApi();

window.addEventListener('load', main);

  function  main() {
  const input = document.getElementById('fileInput') as InputFile;
  const slider = document.getElementById('slider')as Slider;
  const sliderValue = document.getElementById('sliderValue') as slidevalue;
  const startButton = document.getElementById('start') as Button;
  const dropdown = document.getElementById('dropdown') as Dropdown;
  dropdown?.addEventListener('input', handleDropdownChange);
  startButton?.addEventListener('click', handleStartClick);
  input?.addEventListener('change', handleFileSelect);
  WebviewMessageListener();
 // findFile();
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
  vscode.postMessage({command:'findFile',text:"caricamento file"});
  vscode.postMessage({
    command: "start",
    text: "ciao"
  });
}
function progressRinghidden(){
  const progressRing=document.getElementById('progressRing');
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
  reader.onload = function(event) {
      const text = event.target?.result as string; 
      textArea.value = text;
      progressRing?.classList.add('hidden');
      textArea.classList.remove('hidden');
  };

  reader.onerror = function(event) {
    vscode.postMessage({command: "start",text: "errore Caricamento file"});
  };

  reader.readAsText(file);
}
 function WebviewMessageListener() {
  vscode.postMessage({ command: 'start',text:"caricato messageListnerwebui" });
  window.addEventListener('message', event => {
    const message = event.data;
    const command = message.command;
    const files = message.files;
       switch (command) {
        case "JsonFile":
          vscode.postMessage({
            command: "start",
            text: "trovato"
          });
          seedLoading(files);
          break;
          case "JsonFileNotFound":
            vscode.postMessage({
              command: "start",
              text: "non trovato"
            });
          progressRinghidden();
          break;
      
        }
    },
    undefined,
    this._disposables
  );
}
function seedLoading(file) {
  const input = document.getElementById('fileInput');
  try{
    const progressRing=document.getElementById('progressRing');
    const textArea = document.getElementById('textContent');
    const jsonString = JSON.stringify(file, null, 2);
    textArea.value=jsonString;
    progressRing?.classList.add('hidden');
    textArea?.classList.remove('hidden');
  }catch (error){
    vscode.postMessage({
      command: "start",
      text: "errore caricamento"
    });
    progressRinghidden();
  }
 }
 function findFile(){
  vscode.postMessage({command:'findFile',text:"caricamento file"});
}

