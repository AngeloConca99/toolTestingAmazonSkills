// file: src/panels/SecondPanel.ts



import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import * as path from 'path';
import * as childProcess from 'child_process';
import * as fs from 'fs/promises';
import * as vscode from "vscode";
import { groupSorting } from "../utilities/groupSorting";
import  {AlexaUtteranceTester} from'./../utilities/AlexaUtteranceTester';
export class SecondPanel {
    public static currentPanel: SecondPanel | undefined;
    public static context: vscode.ExtensionContext;
    public readonly _panel: vscode.WebviewPanel;
    private invocationName:string;
    private _disposables: vscode.Disposable[] = [];
    private buttonEnable:boolean=false;

    private static filePath : string;
    

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        SecondPanel.context = context;
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        this._setWebviewMessageListener(this._panel.webview);
      }

      public static render(extensionUri: vscode.Uri, context: vscode.ExtensionContext, invocation_name?: string) {
         if (!invocation_name) {
           invocation_name = context.globalState.get('invocationName', 'defaultInvocationName');
         }
      
        if (SecondPanel.currentPanel) {
          SecondPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
        } else {
          const panel = vscode.window.createWebviewPanel("alexa-skill-test-robustness", "Skill Test Robustness", vscode.ViewColumn.One, {
            enableScripts: true,
          });
      
          SecondPanel.currentPanel = new SecondPanel(panel, extensionUri, context);
        }
        this.invocationName = invocation_name;
        SecondPanel.context.globalState.update('invocationName', invocation_name);
      }
      

  public dispose() {
     SecondPanel.context.globalState.update('TestState', true); 
      SecondPanel.currentPanel = undefined;
  
      this._panel.dispose();
  
      while (this._disposables.length) {
        const disposable = this._disposables.pop();
        if (disposable) {
          disposable.dispose();
        }
      }
  
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
      const displayHtmlContent = this.getDisplayHtmlContent(webview, extensionUri);
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
          <title>Second Hello</title>
        </head>
        <body>
          ${displayHtmlContent}
          <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; font-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
    `;
  }

  private getDisplayHtmlContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const fs = require('fs');
    const path = require('path');
    try {
      const htmlPath = path.join(extensionUri.fsPath, "src", "component", "secondPanel.html");
      const displayHtmlContent = fs.readFileSync(htmlPath, 'utf-8');
      return displayHtmlContent;
    } catch (error) {
      throw new Error("Error retrieving HTML content");
        }
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
    private async startUtteranceTesting(value:any,webview: vscode.Webview) {
      this.buttonEnable=false;
      SecondPanel.context.globalState.update('TestState', true); 
      this.buttonIsEnable(webview);
      try {
          const workspaceFolders = vscode.workspace.workspaceFolders;
          if (!workspaceFolders || workspaceFolders.length === 0) {
              vscode.window.showErrorMessage("Workspace folder not found");
              return;
          }
  
          const workspaceFolder = workspaceFolders[0];
          const workspaceTmpPath = path.join(workspaceFolder.uri.fsPath, 'tmp');
          const filePath=path.join( workspaceTmpPath, 'output.json');
    
      const utteranceTester = new AlexaUtteranceTester(filePath,value,SecondPanel.context.globalState.get('invocationName', " "));
        await utteranceTester.runSimulations();
      } catch (error) {
        vscode.window.showErrorMessage(`Errore durante il test delle utterances: ${error}`);
      }
      SecondPanel.context.globalState.update('TestState', true); 
      this.buttonEnable=true;
      this.buttonIsEnable(webview); 
    }

  private _setWebviewMessageListener(webview: vscode.Webview){
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;
        const text = message.text;
        const value = message.value;
        switch (command) {
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
          SecondPanel.context.globalState.update('TestState', false);
          this.startUtteranceTesting(value,webview);
          break;
          case 'TestingButton':
            this.buttonIsEnable(webview);
            break;
        }
      }
    );
  }
  private buttonIsEnable(webview:vscode.Webview){
    webview.postMessage({
      command:'Button',
      Boolean: SecondPanel.context.globalState.get('TestState',false)
    });
  }
  
  public static setFile(filePath: string) {
      this.filePath = filePath;
    }

  public async postSeed(webview: vscode.Webview) {
    try {

      const jsonFile = await vscode.workspace.fs.readFile(vscode.Uri.file(SecondPanel.filePath));
      const jsonString = new TextDecoder().decode(jsonFile);
      const jsonObject = JSON.parse(jsonString);

      let allSamples = [];

      if (jsonObject) {
            allSamples.push(...groupSorting(jsonObject));
            webview.postMessage({
              command: 'Button',
              Boolean: SecondPanel.context.globalState.get('TestState',true)
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