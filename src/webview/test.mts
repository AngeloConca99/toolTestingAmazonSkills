import {
    provideVSCodeDesignSystem, vsCodeButton, Button,
    vsCodeOption, vsCodeProgressRing, vsCodeTextArea, ProgressRing, vsCodeCheckbox
  } from "@vscode/webview-ui-toolkit";
import { text } from "stream/consumers";


provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeOption(), vsCodeProgressRing(), vsCodeCheckbox(), vsCodeTextArea());
const vscode = acquireVsCodeApi();


let startButtonDisable = true;
let seeds = [];
let seedsCopy = [];
let uncheckedSeeds = [];

const startButton = document.getElementById('start');
const addTestButton=document.getElementById('addTest');
const idTextArea=document.getElementById('insertedTextContent');
const saveName=document.getElementById('saveName');
const progressRing2=document.getElementById('progressRing2');

const contentDiv = document.getElementById('content');

window.addEventListener('load', main);
window.addEventListener('load', eventListener);

async function main() {
    addTestButton?.addEventListener('click', handleADDClick);
     startButton?.addEventListener('click', handleTestingClick);
     saveName?.addEventListener('click', handlePostName);
   
 vscode.postMessage({command:"skillName"});
  
  restoreUnselect();
    
  vscode.postMessage({ command: 'findFile' });
  }
  function handlePostName(){
    vscode.postMessage({
      command:'nameSkill',
      text:idTextArea.value
    });
    localStorage.clear();
  }
  document.getElementById('insertedTextContent').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handlePostName();
    }
    
  });
  function handleTestingClick() {
    vscode.postMessage({
      command: 'StartTesting',
      value: seedsCopy
    });
  }
  function handleADDClick(){
    vscode.postMessage({
      command:'AddTest'
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
        case'skillNameSelected':{
          idTextArea.value=message.text;
        }
        case 'Button': {
          if (buttonEnable) {
            startButton.removeAttribute('disabled');
  
          } else {
            startButton.setAttribute('disabled', '');
          }
        }
          break;
          case 'Result': {
            const resultButton = document.getElementById(`${Value}`); 
            if (resultButton) {
                resultButton.simulationData = message.simulation; 
                
                
                resultButton.removeAttribute('disabled');
                resultButton.textContent = message.text;
                if (message.text === 'Success') {
                    resultButton.classList.add('test-result-success');
                    resultButton.classList.remove('test-result-failed');
                } else {
                    resultButton.classList.add('test-result-failed');
                    resultButton.classList.remove('test-result-success');
                }
            }
          saveSeedsState();}
            break;   
          }   
    });
  }

function setSamplesAndHideProgress(allSamples) {
  startButton?.removeAttribute('disabled');
 createCheckbox(allSamples);
}

function createCheckbox(allSamples) {
  
  seeds.push(...allSamples);
  seedsCopy = deepClone(allSamples);

  const container = document.getElementById('all');

  seeds.forEach((seed,index) => {
    const seedContainer = document.createElement('div');
    seedContainer.className = 'seed-container';
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
      saveSeedsState();
      if (checkbox.checked) {
       let seedindex= seedsCopy.findIndex(item => item.generate === seed.generate);
        if(seedindex>-1){
        seedsCopy.splice(seedindex, 1);}
        if(!uncheckedSeeds.includes(seed.generate)){
          uncheckedSeeds.push(seed.generate);
        }
      } else {
        seedsCopy.push(seed);
        let indexun = uncheckedSeeds.indexOf(seed.generate);
        if (indexun > -1) {
          uncheckedSeeds.splice(indexun, 1);
        }
      }
      saveSeedsState();
    });
    seedContainer.appendChild(checkbox);
    const testButton = document.createElement('vscode-button');
    testButton.textContent = 'Test';
    testButton.className = 'test-button';
    testButton.addEventListener('click', () => {
      let seedtest=[];
      seedtest.push(seed);
      vscode.postMessage({
        command: 'StartTesting',
        value: seedtest
      });
    });
    seedContainer.appendChild(testButton);
    const editArea = document.createElement('vscode-text-area');
        editArea.value = seed.generate;
        editArea.style.display = 'none'; 
        editArea.addEventListener('keydown', function (event) {
          if (event.key === 'Enter') {
            event.preventDefault();
          }});
        seedContainer.appendChild(editArea);
        const editButton = document.createElement('vscode-button');
        editButton.textContent = 'Edit';
        editButton.className = 'edit-button';
        let isEditing = false;
        
        editButton.addEventListener('click', () => {
            if (!isEditing) {
                checkbox.style.display = 'none';
                testButton.style.display = 'none';
                editArea.style.display = '';
                editButton.textContent = 'Save';
                isEditing = true;
            } else {
                const newSeedText = editArea.value;
                if (newSeedText.length > 0) {
                    seed.generate = newSeedText;
                    checkbox.textContent = newSeedText + " (" + seed.intent + ")";
                    updateSeeds(seed, newSeedText);
                }
                editArea.style.display = 'none';
                checkbox.style.display = '';
                testButton.style.display = '';
                editButton.textContent = 'Edit';
                isEditing = false; 
                
            }
            resultArea.id=seed.generate;

        });
        seedContainer.appendChild(editButton);

        const resultArea = document.createElement('vscode-button');
        resultArea.className = 'result-area invisible-button';
        resultArea.id = seed.generate; 
        resultArea.setAttribute('disabled', '');
        resultArea.addEventListener('click', () => {
          const simulationData = resultArea.simulationData;
          vscode.postMessage({command:'ResultSimulation',value:simulationData});
      
      });
   
    seedContainer.appendChild(resultArea);

    container.appendChild(seedContainer);
    
    });
    
    TestIsEnable();
    restoreUnselect();
    progressRing2?.classList.add('hidden');
}

function updateSeeds(seed, newSeedText) {
  let seedIndex = seeds.findIndex(s => s === seed);
  if (seedIndex > -1) {
      seeds[seedIndex].generate = newSeedText;
      seed[seedIndex].score=0;
  }
  seedIndex = seedsCopy.findIndex(s => s.generate === seed.generate && s.intent === seed.intent);
  if (seedIndex > -1) {
      seedsCopy[seedIndex].generate = newSeedText;
  }
  vscode.postMessage({
    command: 'Save',
    value: seeds
  });
}
function saveSeedsState() {
  const buttonStates = [];
  document.querySelectorAll('.result-area').forEach(button => {
    if (button.id) {
      const state = {
        id: button.id,
        text: button.textContent,
        isSuccess: button.classList.contains('test-result-success'),
        simulationData: button.simulationData
      };
      buttonStates.push(state);
    }
  });

  
  const stateToSave = {
    Unselect_Seed: uncheckedSeeds,
    ButtonsState: buttonStates
  };

  localStorage.setItem('UnselectTest', JSON.stringify(stateToSave));
}

function restoreUnselect() {
  const savedState = localStorage.getItem('UnselectTest');
  if (savedState) {
    const { Unselect_Seed, ButtonsState } = JSON.parse(savedState);
    
    
    if (Unselect_Seed) {
      uncheckedSeeds = Unselect_Seed;
    }

    
    if (ButtonsState) {
      ButtonsState.forEach(({ id, text, isSuccess, simulationData }) => {
        const button = document.getElementById(id);
        if (button) {
          button.textContent = text;
          button.simulationData = simulationData;
          button.removeAttribute('disabled');
          button.classList.toggle('test-result-success', isSuccess);
          button.classList.toggle('test-result-failed', !isSuccess);
        }
      });
    }
  }
}


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