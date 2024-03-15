import {
    provideVSCodeDesignSystem, vsCodeButton, Button,
    vsCodeOption, vsCodeProgressRing, vsCodeTextArea, ProgressRing, vsCodeCheckbox
  } from "@vscode/webview-ui-toolkit";


provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeOption(), vsCodeProgressRing(), vsCodeCheckbox(), vsCodeTextArea());
const vscode = acquireVsCodeApi();

window.addEventListener('load', main);
window.addEventListener('load', eventListener);

async function main() {
    vscode.postMessage({
        command:'main'
    });
}





function eventListener(){
    window.addEventListener('message', event => {
    const message = event.data;
    const command = message.command;
    const buttonEnable = message.Boolean;

    switch(command){
        case 'result':{
      resultRender(message.value);}
      break;
    }
    });
  }
  function resultRender(result) {
    const statusContainer=document.getElementById('container');
    const contentContainer = document.getElementById('content');
    const insertedContentContainer = document.getElementById('insertedContent');
    const resultsContainer = document.getElementById('resultsContainer');
   
    const resultStatusDiv = document.createElement('div');
    resultStatusDiv.className = result.simulationResult.status === 'Failed' ? 'test-result-failed' : 'test-result-success'; 
    resultStatusDiv.textContent = result.simulationResult.status;
    contentContainer.appendChild(resultStatusDiv);
  
    const intentDiv = document.createElement('div');
    intentDiv.className = 'result-intent';
    intentDiv.textContent = ` Expected Intent: ${result.intent}`;
    intentDiv.style.fontSize = '20px'; 

   
    const consideredIntentDiv = document.createElement('div');
    consideredIntentDiv.className = 'result-considered-intent';
    consideredIntentDiv.textContent = `Result Intent: ${result.simulationResult.result.alexaExecutionInfo.consideredIntents && result.simulationResult.result.alexaExecutionInfo.consideredIntents.length > 0 ? result.simulationResult.result.alexaExecutionInfo.consideredIntents[0].name : 'N/A'}`;
    consideredIntentDiv.style.fontSize = '20px'; 

    
    const jsonResultDiv = document.createElement('div');
    jsonResultDiv.className = 'result-json';
    jsonResultDiv.textContent = JSON.stringify(result, null, 2);
    jsonResultDiv.style.fontSize = '12px';
    jsonResultDiv.style.whiteSpace = 'pre-wrap'; 
    
    contentContainer.appendChild(intentDiv);
    insertedContentContainer.appendChild(consideredIntentDiv);

    resultsContainer.appendChild(jsonResultDiv);
}
