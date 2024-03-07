import {
    provideVSCodeDesignSystem, vsCodeButton, Button,
    vsCodeOption, vsCodeProgressRing, vsCodeTextArea, ProgressRing, vsCodeCheckbox
  } from "@vscode/webview-ui-toolkit";


provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeOption(), vsCodeProgressRing(), vsCodeCheckbox(), vsCodeTextArea());
const vscode = acquireVsCodeApi();


let slideValueGlobal = 0;
let startButtonDisable = true;
let seeds = [];
let seedsCopy = [];

const startButton = document.getElementById('start');
const slider = document.getElementById('slider');
const sliderValue = document.getElementById('sliderValue');
const progressRing = document.getElementById('progressRing');

const contentDiv = document.getElementById('content');

window.addEventListener('load', main);
window.addEventListener('load', eventListener);

async function main() {
    // const input = document.getElementById('fileInput');
    // const addSeed = document.getElementById('addSeed');
    // startButton?.addEventListener('click', handleStartClick);
    // addSeed?.addEventListener('click', createInsertedCheckbox);
    // input?.addEventListener('input', handleFileSelect);
    // const resetButton = document.getElementById('reset');
    // resetButton?.addEventListener('click', resetSeeds);
    sliderValue?.addEventListener('input', setSliderValue);
    slider?.addEventListener('input', setSlider);

    sliderValue?.attributes.setNamedItem(document.createAttribute('value'));
    slider?.attributes.setNamedItem(document.createAttribute('value'));
    slider.value = slideValueGlobal.toString();
    sliderValue.value = slideValueGlobal;
    
    vscode.postMessage({ command: 'findFile' });
  }



// *** SLIDER METHODS ***

function setSlider() {
  slideValueGlobal = slider.value;
  sliderValue.value = slider.value;
//   saveSeedsState();
}

function setSliderValue() {
  let value = parseFloat(sliderValue.value);
  value = Math.min(100, Math.max(0, value));
  sliderValue.value = value;
  slideValueGlobal = value;
  slider.value = value.toString();
//   saveSeedsState();
}

// function resetSlider(sliderValue, slider, value) {
//   sliderValue.value = value;
//   slider.value = value.toString();
// }

// 
// *** EVENT LISTENER ***
// 

function eventListener(){
    window.addEventListener('message', event => {
    const message = event.data;
    const command = message.command;
    const samples = message.samples;
    const buttonEnable = message.Boolean;

    switch(message){
      case 'JsonFile':{
        vscode.postMessage({ command: 'showMessage', text: 'Json file loaded' });
        seedLoading(samples);
        break;
      }
    }
    });
  }
    
  

// 
//  *** GRAPHIC METHODS ***
//

function setSamplesAndHideProgress(allSamples) {
  progressRing?.classList.add('hidden');
  hideProgressRing();
  createCheckbox(allSamples);
}

function hideProgressRing() {
  progressRing?.classList.add('hidden');
  startButtonDisable = true;
  startButton?.attributes.setNamedItem(document.createAttribute('disabled'));
}

function createCheckbox(allSamples) {
  seeds.push(...allSamples);
  seedsCopy = deepClone(allSamples);
  
  const label = document.createElement('label');
  label.textContent = "Seed sentences:\n";
  contentDiv?.appendChild(label);

  seeds.forEach((seed) => {
    const checkbox = document.createElement('vscode-checkbox');
    checkbox.setAttribute('checked', '');
    // TODO: modifica angelo
    checkbox.textContent = seed.generate + " | " + seed.score + " (" + seed.intent + ")";
    checkbox.addEventListener('click', () => {
      if(checkbox.hasAttribute('checked')){
        seedsCopy.splice(seedsCopy.indexOf(seed), 1);
      } else {
        seedsCopy.push(seed);
      }
    });
    contentDiv?.appendChild(checkbox);
  });
}

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

function seedLoading(samples) {
  try {
    // const progressRing = document.getElementById('progressRing');
    setSamplesAndHideProgress(samples);
  } catch (error) {
    vscode.postMessage({
      command: 'errorMessage',
      text: error.message
    });
  }
}
