// file: src/panels/GenerationPanel.ts



import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { quoteSpaces } from "../utilities/quoteSpaces";

import * as path from 'path';
import * as childProcess from 'child_process';
import * as fs from 'fs/promises';
import * as vscode from "vscode";

export class GenerationPanel {
  public static currentPanel: GenerationPanel | undefined;
  private static context: vscode.ExtensionContext;
  private invocationName: string=" ";
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  
  private readonly timeoutMillis: number = 20000;
  private workspaceTmpPath: string = '';
  private outputPath: string = '';
  private TextFilePath: string = '';
  
  private start: boolean = false;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    GenerationPanel.context = context;
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
    vscode.window.onDidChangeActiveTextEditor(this.handleActiveEditorChange, null, this._disposables);
  }

  public static render(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    if (GenerationPanel.currentPanel) {
      GenerationPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
    } else {
      const panel = vscode.window.createWebviewPanel("alexa-skill-test-robustness", "Skill Test Robustness", vscode.ViewColumn.Two, {
        // Enable javascript in the webview
        enableScripts: true,
        // Restrict the webview to only load resources from the `out` directory
        // localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')]
      });

      GenerationPanel.currentPanel = new GenerationPanel(panel, extensionUri, context);
    }
  }
  private handleActiveEditorChange = (editor: vscode.TextEditor | undefined) => {
    if (!GenerationPanel.currentPanel) {
      return;
    }

  
    const isWebviewFocused = GenerationPanel.currentPanel._panel.visible;

    GenerationPanel.currentPanel._panel.webview.postMessage({
      command: isWebviewFocused ? 'webviewLostFocus' : 'webviewGainedFocus'
    });
  };

  public dispose() {
    GenerationPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }

  }
 

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const displayHtmlContent = this.getDisplayHtmlContent(webview, extensionUri);
    const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
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
           <title>Generation Panel</title>
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
      const htmlPath = path.join(extensionUri.fsPath, "src", "component", "display.html");
      const displayHtmlContent = fs.readFileSync(htmlPath, 'utf-8');
      return displayHtmlContent;
    } catch (error) {
      throw new Error("Error retrieving HTML content");
    }
  }

  private getCss(webview: vscode.Webview, extensionUri: vscode.Uri): vscode.Uri {

    try {
      const cssDefault = require("../../out/styles.js").default;
      const cssUri = getUri(webview, extensionUri, ["out", cssDefault]);
      return cssUri;
    } catch (error) {
      throw new Error("Error retrieving CSS content");
    }
  }

  private CreateJsonFile(text: any, webview: vscode.Webview) {
    this.start = true;
    GenerationPanel.context.globalState.update('startState', this.start);

    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage("Workspace folder not found");
            return;
        }

        const workspaceFolder = workspaceFolders[0];
        this.workspaceTmpPath = path.join(workspaceFolder.uri.fsPath, 'GenerateSeeds');
        this.outputPath = path.join(this.workspaceTmpPath, 'output');
        const folderPath = this.workspaceTmpPath;
        const fileName = 'input.json';
        this.TextFilePath = path.join(this.workspaceTmpPath, fileName);
        
        
        const jsonString = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
        
        this.saveFileInFolder(jsonString, folderPath, fileName, webview);
    } catch (error) {
        vscode.window.showErrorMessage("Error in file creation: " + error.message);
    }
}

  private saveFileInFolder(content: string, folderPath: string, fileName: string, webview: vscode.Webview) {
    const fullPath = vscode.Uri.file(path.join(folderPath, fileName));
    const contentBuffer = Buffer.from(content, 'utf8');
    try {
      vscode.workspace.fs.writeFile(fullPath, contentBuffer);
      vscode.window.showInformationMessage("File successfully saved");
    } catch (error) {
      vscode.window.showErrorMessage("An error occurred shile saving the file: " + error.message);
    }
    webview.postMessage({ command: 'SavedFile' });
  }

  private async filteredGenerated(): Promise<void> {
    const workspacePath = this.workspaceTmpPath;
    const combinedOutputPath = path.join(workspacePath, 'combined_output.json');
    const outputPath = path.join(workspacePath, 'output.json');
    const outputFolderPath = path.join(workspacePath, 'output');

    try {

      const data = await fs.readFile(combinedOutputPath, 'utf8');
      const jsonData = JSON.parse(data);


      const filteredData = jsonData;

      await fs.writeFile(outputPath, JSON.stringify(filteredData, null, 2));


      await fs.unlink(combinedOutputPath);



      await fs.access(outputFolderPath);
      await fs.rm(outputFolderPath, { recursive: true });

    } catch (error) {
      vscode.window.showErrorMessage("An error occurred during file management: " + error.message);
    }

  }
  private runScript(command: string, webview: vscode.Webview) {
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Executing script...",
        cancellable: false // Imposta su false se l'operazione non può essere annullata
    }, async (progress) => {
        return new Promise<void>((resolve, reject) => {
            if (!this.workspaceTmpPath) {
                vscode.window.showErrorMessage("Temporary folder not found");
                return reject(new Error("Temporary folder not found"));
            }

            childProcess.exec(command, async (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage("Error while executing the script: " + error.message);
                    return reject(error);
                }
                vscode.window.showInformationMessage("Script successfully executed. Output saved in " + this.outputPath);

                try {
                    await this.filteredGenerated();
                    this.start = false;
                    GenerationPanel.context.globalState.update('startState', this.start);
                    webview.postMessage({ command: 'filteredFinished' });
                    this.invocationName = GenerationPanel.context.globalState.get('invocationName', this.invocationName);
                    vscode.commands.executeCommand('alexa-skill-test-robustness.SavePanel', this.invocationName);
                    resolve();
                } catch (innerError) {
                    vscode.window.showErrorMessage("Error after executing the script: " + innerError.message);
                    reject(innerError);
                }
            });
        });
    }).then(() => {
        vscode.window.showInformationMessage("Script execution and post-processing completed successfully.");
    }).catch(error => {
        vscode.window.showErrorMessage("An error occurred during script execution or post-processing:", error);
    });
}
  private async findFilesWithTimeout(include: vscode.GlobPattern, exclude?: vscode.GlobPattern, maxResults?: number, timeoutMillis?: number): Thenable<vscode.Uri[]> {
    const tokenSource = new vscode.CancellationTokenSource();
    const timeout = timeoutMillis ? setTimeout(() => tokenSource.cancel(), timeoutMillis) : undefined;

    const filesPromise = vscode.workspace.findFiles(include, exclude, maxResults, tokenSource.token)
      .then((files) => {
        clearTimeout(timeout);
        return files;
      });

    return new Promise((resolve, reject) => {
      filesPromise.then(resolve, reject);
    });

  }
  private async postSeed(webview: vscode.Webview) {
    try {
      const jsonFiles = await this.findFilesWithTimeout('**/skill-package/interactionModels/custom/en-US.json', '**/node_modules/**', 1, this.timeoutMillis);
      if (jsonFiles.length === 0) {
        throw new Error("JSON file not found.");
      }
      const jsonFileUri = jsonFiles[0];
      let allSamples = [];
  
      const jsonFileContent = await vscode.workspace.fs.readFile(jsonFileUri);
      const jsonString = new TextDecoder().decode(jsonFileContent);
      const fileJsonObject = JSON.parse(jsonString);
      
      if (fileJsonObject && fileJsonObject.interactionModel && fileJsonObject.interactionModel.languageModel && fileJsonObject.interactionModel.languageModel.intents) {
        let invocationName = fileJsonObject.interactionModel.languageModel.invocationName;
        this.invocationName = invocationName.toString();
        GenerationPanel.context.globalState.update('invocationName', this.invocationName);
        allSamples.push(...fileJsonObject.interactionModel.languageModel.intents);
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
      webview.postMessage({ command: 'JsonFileNotFound' });
    }
  }
  
  private async showQuickPick(array): Promise<string | undefined> {
    const intent = await vscode.window.showQuickPick(array, {
      placeHolder: "Choose an intent"
    });
    return intent; 
  }
  
  public async quickPick(allSamples, webview) {
    const intents: string[] = [];
  
    allSamples.forEach((intent) => {
      intents.push(intent.name);
    });
  
    const intentSelect = await this.showQuickPick(intents); 
  
      webview.postMessage({
        command: 'IntentResponse',
        text: intentSelect
      });
    
  }
 private _setWebviewMessageListener(webview: vscode.Webview) {
    let absoluteScriptPath = path.join(__dirname, '/implementations/VUI-UPSET.jar');
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;
        const text = message.text;
        const value = message.value;
        const samples=message.samples;
        switch (command) {
          case'intentRequest':
          this.quickPick(samples,webview);
          break;
          case 'message':
            vscode.window.showInformationMessage(text);
            break;
          case 'findFile':
            this.postSeed(webview);
            break;
          case 'errorMessage':
            vscode.window.showErrorMessage(text);
            break;
          case 'createTxtFile':
            this.CreateJsonFile(text, webview);
            break;
          case 'VUI-UPSET':
              this.runScript(`java -jar ${quoteSpaces(absoluteScriptPath)} ${quoteSpaces(this.TextFilePath)} ${quoteSpaces(this.outputPath)}`, webview);
            break;
          case 'buttonEnable':
             this.start = GenerationPanel.context.globalState.get('startState', false);
            await webview.postMessage({
              command: 'button',
              Boolean: this.start
            });
            break;
            case'SkillName':
            this.saveInvocationName(text);
            break;
            
        }
      },
      undefined,
      this._disposables
    );
  }
  private saveInvocationName(text){
    this.invocationName=text;
    GenerationPanel.context.globalState.update('invocationName', this.invocationName);
  }
}