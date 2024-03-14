import {
  provideVSCodeDesignSystem, vsCodeButton, Button,
  vsCodeOption, vsCodeProgressRing, vsCodeTextArea, ProgressRing, vsCodeCheckbox
} from "@vscode/webview-ui-toolkit";


provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeOption(), vsCodeProgressRing(), vsCodeCheckbox(), vsCodeTextArea());
const vscode = acquireVsCodeApi();


let slideValueGlobal = 75;
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
  vscode.postMessage({ command: 'findFile' });
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
    const Value=message.value;

    switch (command) {
      case 'JsonFile': {
        seedLoading(samples);
      }
        break;
      case 'Button': {
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
restoreUnselect();
function createCheckbox(allSamples) {
  
  
  seeds.push(...allSamples);
  seedsCopy = deepClone(allSamples);

  const labelLeft = document.createElement('label');
  labelLeft.textContent = "Seed sentences:\n";
  const leftContainer = document.querySelector('.left-container');
  leftContainer?.appendChild(labelLeft);

  const labelRight = document.createElement('label');
  labelRight.textContent = "Seed sentences:\n";
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
        let indexun = uncheckedSeeds.indexOf(seed);
        if (indexun > -1) {
          uncheckedSeeds.splice(indexun, 1);
        }
      }
      saveSeedsState();
    });
    if (index % 2 === 0) {
      leftContainer?.appendChild(checkbox);
    } else {
      rightContainer?.appendChild(checkbox);
    }});
    TestIsEnable();
    
}
let debounceTimer;

function setSlider() {
  slideValueGlobal = slider.value;
  sliderValue.value = slider.value;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    updateCheckboxesVisibility();
  }, 300);
}


let sliderTimeout;

function setSliderValue() {
  let value = parseFloat(sliderValue.value);
  value = Math.min(100, Math.max(0, value));
  sliderValue.value = value;
  slideValueGlobal = value;
  slider.value = value.toString();

  clearTimeout(sliderTimeout);
  sliderTimeout = setTimeout(() => {
    updateCheckboxesVisibility();
  }, 300); 
}
function updateSliderValue(newValue) {
  let value = parseFloat(newValue);
  value = Math.min(100, Math.max(0, value));
  slideValueGlobal = value;
  slider.value = value.toString();
  sliderValue.value = value;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
      updateCheckboxesVisibility();
  }, 10);
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
  saveSeedsState();
}

function saveSeedsState() {

  const Unselect = {
    Slider_Value: slideValueGlobal,
    Unselect_Seed: uncheckedSeeds,
  };
  localStorage.setItem('Unselect', JSON.stringify(Unselect));
}

function restoreUnselect() {
  const savedState = localStorage.getItem('Unselect');
  if (savedState) {
    const {Slider_Value: sliderValue, Unselect_Seed: unselectSeed } = JSON.parse(savedState);
    if(sliderValue){
    slideValueGlobal = sliderValue;}
    updateSliderValue(slideValueGlobal);
    if (unselectSeed.length > 0) {
      uncheckedSeeds.push(...unselectSeed);
    }
}}

function TestIsEnable(){
  vscode.postMessage({
    command:'TestingButton'

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
    setSamplesAndHideProgress(samples);
  } catch (error) {
    vscode.postMessage({
      command: 'errorMessage',
      text: error.message
    });
  }
}
