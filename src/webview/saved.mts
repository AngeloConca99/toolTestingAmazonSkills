import {
  provideVSCodeDesignSystem, vsCodeButton, Button,
  vsCodeOption, vsCodeProgressRing, vsCodeTextArea, ProgressRing, vsCodeCheckbox
} from "@vscode/webview-ui-toolkit";


provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeOption(), vsCodeProgressRing(), vsCodeCheckbox(), vsCodeTextArea());
const vscode = acquireVsCodeApi();


let slideValueGlobal = 0;
let seeds = [];
let seedsCopy = [];
let  uncheckedSeeds=[];
const slider = document.getElementById('slider');
const sliderValue = document.getElementById('sliderValue');

const TestButton = document.getElementById('Test');
const contentDiv = document.getElementById('content');

window.addEventListener('load', main);
window.addEventListener('load', eventListener);

async function main() {
  TestButton?.addEventListener('click', handleTestingClick);
  sliderValue?.addEventListener('input', setSliderValue);
  slider?.addEventListener('input', setSlider);
  sliderValue?.attributes.setNamedItem(document.createAttribute('value'));
  slider?.attributes.setNamedItem(document.createAttribute('value'));
  slider.value = slideValueGlobal.toString();
  sliderValue.value = slideValueGlobal;
 // restoreSeedsState();
  vscode.postMessage({ command: 'findFile' });
}
function buttonEnable() {
  vscode.postMessage({
    command: 'TestingButton'
  });
}


// *** SLIDER METHODS ***

function setSlider() {
  slideValueGlobal = slider.value;
  sliderValue.value = slider.value;
  updateCheckboxesVisibility();
}

function setSliderValue() {
  let value = parseFloat(sliderValue.value);
  value = Math.min(100, Math.max(0, value));
  sliderValue.value = value;
  slideValueGlobal = value;
  slider.value = value.toString();
  updateCheckboxesVisibility();
}
function handleTestingClick() {
  vscode.postMessage({
    command: 'StartTesting',
    value: seedsCopy
  });
}

function eventListener() {
  window.addEventListener('message', event => {
    const message = event.data;
    const command = message.command;
    const samples = message.samples;
    const buttonEnable = message.Boolean;

    switch (command) {
      case 'JsonFile': {
        seedLoading(samples);
      }
        break;
      case 'Button': {
        vscode.postMessage({
          command: 'message',
          text: "Roberto"
        });
        if (buttonEnable) {
          TestButton.removeAttribute('disabled');

        } else {
          TestButton.setAttribute('disabled', '');
        }
      }
        break;

    }
  });
}
function setSamplesAndHideProgress(allSamples) {
  const progressRing = document.getElementById('progressRing1');
  progressRing?.classList.add('hidden');
  createCheckbox(allSamples);
}

function createCheckbox(allSamples) {
  restoreSeedsState();
  seeds.push(...allSamples);
  seedsCopy = deepClone(allSamples);

  const labelLeft = document.createElement('label');
  labelLeft.textContent = "Seed sentences (Left):\n";
  const leftContainer = document.querySelector('.left-container');
  leftContainer?.appendChild(labelLeft);

  const labelRight = document.createElement('label');
  labelRight.textContent = "Seed sentences (Right):\n";
  const rightContainer = document.querySelector('.right-container');
  rightContainer?.appendChild(labelRight);



  seeds.forEach((seed,index) => {
    const checkbox = document.createElement('vscode-checkbox');
    if (!uncheckedSeeds.includes(seed.generate)) {
      checkbox.setAttribute('checked', '');
    } else {
      let seedindex= seedsCopy.findIndex(item => item.generate === seed.generate);
      if(seedindex>-1){
      seedsCopy.splice(seedindex, 1);}
    } 
    checkbox.setAttribute('data-score', seed.score.toString());
    checkbox.textContent = seed.generate + " (" + seed.intent + ")";
    checkbox.addEventListener('click', () => {
      if (checkbox.checked) {
       let seedindex= seedsCopy.findIndex(item => item.generate === seed.generate);
        if(seedindex>-1){
        seedsCopy.splice(seedindex, 1);}
        if(!uncheckedSeeds.includes(seed.generate)){
          uncheckedSeeds.push(seed.generate);
        }
      } else {
        seedsCopy.push(seed);
        if(uncheckedSeeds.includes(seed.generate)){
          uncheckedSeeds.splice(uncheckedSeeds.indexOf(seed.generate),1);
        }
      }
      saveSeedsState();
    });
    if (index % 2 === 0) {
      leftContainer?.appendChild(checkbox);
    } else {
      rightContainer?.appendChild(checkbox);
    }});
    
  buttonEnable();
}
function updateCheckboxesVisibility() {
  let sliderScore = parseFloat(slider.value); 
  sliderScore=sliderScore/100;
  const allCheckboxes = document.querySelectorAll('vscode-checkbox');

  
  seedsCopy = deepClone(seeds);

  seedsCopy = seedsCopy.filter(seed => !uncheckedSeeds.includes(seed.generate));

  allCheckboxes.forEach(checkbox => {
    let checkboxScore = parseFloat(checkbox.getAttribute('data-score'));
    if (checkboxScore < sliderScore) {
      checkbox.style.display = 'none'; 
      
      const seedToRemove = seedsCopy.find(seed => seed.generate + " (" + seed.intent + ")" === checkbox.textContent);
      if (seedToRemove) {
        const index = seedsCopy.indexOf(seedToRemove);
        if (index > -1) {
          seedsCopy.splice(index, 1); 
        }
      }

    } else {
      checkbox.style.display = ''; 
    }
  });
}

function saveSeedsState() {
  const Unselect = {
    Unselect_Seed: uncheckedSeeds,
  };
  localStorage.setItem('Unselect', JSON.stringify(seedsState));
}

function restoreSeedsState() {
  const savedState = localStorage.getItem('Unselect');
  if (savedState) {
    const {Unselect_Seed: unselectSeed } = JSON.parse(savedState);
    if (uncheckedSeed.length > 0) {
      uncheckedSeeds.push(...unselectSeed);
    }
}}

  


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
    setSamplesAndHideProgress(samples);
  } catch (error) {
    vscode.postMessage({
      command: 'errorMessage',
      text: error.message
    });
  }
}
