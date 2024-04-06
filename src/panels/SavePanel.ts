import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import * as path from 'path';
import * as childProcess from 'child_process';
import * as fs from 'fs/promises';
import * as vscode from "vscode";
import { groupSorting } from "../utilities/groupSorting";
import  {TestingPanel} from "./TestingPanel";
export class SavePanel {
    public static currentPanel: SavePanel | undefined;
    public static context: vscode.ExtensionContext;
    public readonly _panel: vscode.WebviewPanel;
    private invocationName:string;
    private _disposables: vscode.Disposable[] = [];
    private buttonEnable:boolean=false;
    private TextFilePath:string;

    private static filePath : string;
    

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        SavePanel.context = context;
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        this._setWebviewMessageListener(this._panel.webview);
      }

      public static render(extensionUri: vscode.Uri, context: vscode.ExtensionContext, invocation_name?: string) {
         if (!invocation_name) {
           invocation_name = context.globalState.get('invocationName', 'defaultInvocationName');
         }
      
        if (SavePanel.currentPanel) {
          SavePanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
        } else {
          const panel = vscode.window.createWebviewPanel("alexa-skill-test-robustness", "Skill Test Robustness", vscode.ViewColumn.One, {
            enableScripts: true,
          });
      
          SavePanel.currentPanel = new SavePanel(panel, extensionUri, context);
        }
        this.invocationName = invocation_name;
        SavePanel.context.globalState.update('invocationName', invocation_name);
      }
      

  public dispose() {
     SavePanel.context.globalState.update('TestState', true); 
      SavePanel.currentPanel = undefined;
  
      this._panel.dispose();
  
      while (this._disposables.length) {
        const disposable = this._disposables.pop();
        if (disposable) {
          disposable.dispose();
        }
      }
  
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const webviewUri = getUri(webview, extensionUri, ["out", "saved.js"]);
  const stylesUri = this.getCss(webview, extensionUri);
  const nonce = getNonce();
  return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>SAVE PANEL</title>
        </head>
        <body>
        <h1>Save Panel</h1>

        <div class="slider-container">
            <label>Similarity percentage</label>
            <input type="number" id="sliderValue" min="0" max="100" step="1">
            <input type="range" id="slider" min="0" max="100" step="1">
        </div>
        
        <vscode-button id="Test">Save Test Case</vscode-button>
        <vscode-button id="Del">Delete All Test Cases</vscode-button>
        <div id="content"></div>
                <div class="centered">
                    <vscode-progress-ring id="progressRing1"></vscode-progress-ring>
                </div>
            </div>
        
        <div id="container">
           
            <div class="left-container">
            </div>
        
            <div class="right-container">
            </div>
        </div>
          <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
    `;
  }

  private getCss(webview: vscode.Webview, extensionUri: vscode.Uri): vscode.Uri {
      try {
        const cssDefault = require("../../out/savedStyles.js").default;
        const cssUri = getUri(webview, extensionUri, ["out", cssDefault]);
        return cssUri;
      } catch (error) {
        throw new Error("Error retrieving CSS content");
      }
    }
  private _setWebviewMessageListener(webview: vscode.Webview){
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;
        const text = message.text;
        const value = message.value;
        switch (command) {
          case'message':
          vscode.window.showInformationMessage(text);
          break;
          case 'findFile':
            this.postSeed(webview);
            break;
          case 'errorMessage':
            vscode.window.showErrorMessage(text);
            break;
          case 'showMessage':
            vscode.window.showInformationMessage(text);
            break;
          case'StartTesting':
          SavePanel.context.globalState.update('TestState', false);
          this.CreateJsonFile(value,webview);
          break;
          case 'TestingButton':
            this.buttonIsEnable(webview);
            break;
          case 'Del':
            this.deleteTest();
        }
      }
    );
  }
  private deleteTest() {
    TestingPanel.currentPanel?.dispose();
    vscode.workspace.findFiles("**/SkillTestSaved/saved.json", "**/node_modules/**", 1).then((files) => {
        if (files.length > 0) {
            const fileUri = files[0];
            vscode.workspace.fs.delete(fileUri, { recursive: false, useTrash: true })
                .then(() => {
                    vscode.window.showInformationMessage('The \'saved.json\' file was successfully deleted.');
                })
                .catch((error) => {
                    vscode.window.showErrorMessage('An error occurred while deleting the file: ' + error.message);
                });
        } else {
            vscode.window.showErrorMessage('No \'saved.json\' file found. Please generate \'saved.json\' file using Save Panel.');
        }
    });
}

  private async CreateJsonFile(text: any, webview: vscode.Webview) {
    this.start = true;

    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage("Workspace folder not found");
            return;
        }

        const workspaceFolder = workspaceFolders[0];
        const folderPath =  path.join(workspaceFolder.uri.fsPath, 'SkillTestSaved');
        const fileName = 'saved.json';
        this.TextFilePath = path.join(folderPath, fileName);
        
        
        const jsonString = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
        
        await this.saveFileInFolder(jsonString, folderPath, fileName, webview);
        vscode.commands.executeCommand('alexa-skill-test-robustness.TestingPanel', this.invocationName);
    } catch (error) {
        vscode.window.showErrorMessage("Error in file creation: " + error.message);
    }
}

private async saveFileInFolder(content: string, folderPath: string, fileName: string, webview: vscode.Webview) {
  const fullPath = vscode.Uri.file(path.join(folderPath, fileName));

  try {

      const existingContent = await vscode.workspace.fs.readFile(fullPath);
      const existingArray = JSON.parse(existingContent.toString());

      const newArray = JSON.parse(content);

      newArray.forEach(newItem => {
          const exists = existingArray.some(existingItem => 
              existingItem.intent === newItem.intent && 
              existingItem.seed === newItem.seed &&
              existingItem.generate === newItem.generate);
          if (!exists) {
              existingArray.push(newItem);
          }
      });
      const updatedContent = JSON.stringify(existingArray, null, 2);
      const contentBuffer = Buffer.from(updatedContent, 'utf8');
      await vscode.workspace.fs.writeFile(fullPath, contentBuffer);
      vscode.window.showInformationMessage("File successfully saved");
  } catch (error) {
      if (error.code === 'FileNotFound') {
          const contentBuffer = Buffer.from(content, 'utf8');
          await vscode.workspace.fs.writeFile(fullPath, contentBuffer);
          vscode.window.showInformationMessage("File successfully saved");
      } else {
          vscode.window.showErrorMessage("An error occurred while saving the file: " + error.message);
      }
  }
  SavePanel.context.globalState.update('TestState', true);
}






  private buttonIsEnable(webview:vscode.Webview){
    webview.postMessage({
      command:'Button',
      Boolean: SavePanel.context.globalState.get('TestState',true)
    });
  }
  
  public static setFile(filePath: string) {
      this.filePath = filePath;
    }

  public async postSeed(webview: vscode.Webview) {
    try {

      const jsonFile = await vscode.workspace.fs.readFile(vscode.Uri.file(SavePanel.filePath));
      const jsonString = new TextDecoder().decode(jsonFile);
      const jsonObject = JSON.parse(jsonString);

      let allSamples = [];

      if (jsonObject) {
            allSamples.push(...groupSorting(jsonObject));
            webview.postMessage({
              command: 'Button',
              Boolean: SavePanel.context.globalState.get('TestState',true)
            });
      } else {
        throw new Error("Invalid or missing JSON file structure");
      }

      if (allSamples.length === 0) {
        throw new Error("No seeds found in JSON file intents.");
      } else {
        webview.postMessage({ command: 'JsonFile', samples: allSamples });
      }
    } catch (error) {
      vscode.window.showErrorMessage("Error loading file: " + error.message);
      
    }

  }

}