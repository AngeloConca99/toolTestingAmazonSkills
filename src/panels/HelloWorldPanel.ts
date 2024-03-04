// file: src/panels/HelloWorldPanel.ts



import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import { lstat } from "fs";
import { quoteSpaces } from "../utilities/quoteSpaces";
import * as path from 'path';
import * as childProcess from 'child_process';
import * as fs from 'fs/promises';
import * as vscode from "vscode";

export class HelloWorldPanel {

  public static currentPanel: HelloWorldPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private readonly timeoutMillis: number = 20000;
  private workspaceTmpPath: string = '';
  private outputPath: string = '';
  private TextFilePath: string = '';
  private ScoreSeed: number = 0;
  private invocationName:string="";


  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
  }

  public static render(extensionUri: vscode.Uri) {
    if (HelloWorldPanel.currentPanel) {
      HelloWorldPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
    } else {
      const panel = vscode.window.createWebviewPanel("alexa-skill-test-robustness", "Skill Test Robustness", vscode.ViewColumn.Two, {
        // Enable javascript in the webview
        enableScripts: true,
        // Restrict the webview to only load resources from the `out` directory
        // localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')]
      });

      HelloWorldPanel.currentPanel = new HelloWorldPanel(panel, extensionUri);
    }
  }

  public dispose() {
    HelloWorldPanel.currentPanel = undefined;

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
           <title>Hello World</title>
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
    const fs = require('fs');
    const path = require('path');
    try {
      const cssDefault = require("../../out/styles.js").default;
      const cssUri = getUri(webview, extensionUri, ["out", cssDefault]);
      return cssUri;
    } catch (error) {
      throw new Error("Error retrieving CSS content");
    }
  }

  private CreateTxtFile(text: string, webview: vscode.Webview) {
    
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("Workspace folder not found");
        return;
      }

      const workspaceFolder = workspaceFolders[0];
      this.workspaceTmpPath = path.join(workspaceFolder.uri.fsPath, 'tmp');
      this.outputPath = path.join(this.workspaceTmpPath, 'output');
      const folderPath = this.workspaceTmpPath;
      const fileName = 'input.txt';
      this.TextFilePath = path.join(this.workspaceTmpPath, fileName);
      this.saveFileInFolder(text, folderPath, fileName, webview);
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

        
        const filteredData = jsonData.filter((item: any) => item.score >=  this.ScoreSeed);

        await fs.writeFile(outputPath, JSON.stringify(filteredData, null, 2));
        

        await fs.unlink(combinedOutputPath);
    

        
            await fs.access(outputFolderPath);
            await fs.rm(outputFolderPath, { recursive: true });
      
    } catch (error) {
        vscode.window.showErrorMessage("An error occurred during file management: " + error.message);
    }
    
}

  private runScript(command: string,webview: vscode.Webview) {
    try {
        if (!this.workspaceTmpPath) {
            vscode.window.showErrorMessage("Temporary folder not found");
            return;
        }


        childProcess.exec(command, async (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage("Error while executing the script: " + error.message);
                return;
            }
            vscode.window.showInformationMessage("Script successfully executed. Output saved in " + this.outputPath);
            
            
           await this.filteredGenerated();

           webview.postMessage({ command: 'filteredFinished' });
           vscode.commands.executeCommand('vscode.open', vscode.Uri.file(this.outputPath + ".json"), { preview: false, viewColumn: vscode.ViewColumn.One });
        });
    } catch (error) {
        vscode.window.showErrorMessage("Error while executing the script: " + error.message);
    }
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

  private async postseed(webview: vscode.Webview) {
    try {
      const jsonFiles = await this.findFilesWithTimeout('**/skill-package/interactionModels/custom/en-US.json', '**/node_modules/**', 1, this.timeoutMillis);
      let allSamples = [];

      for (const jsonFileUri of jsonFiles) {
        const jsonFileContent = await vscode.workspace.fs.readFile(jsonFileUri);
        const jsonString = new TextDecoder().decode(jsonFileContent);
        const fileJsonObject = JSON.parse(jsonString);
        

        if (fileJsonObject && fileJsonObject.interactionModel && fileJsonObject.interactionModel.languageModel && fileJsonObject.interactionModel.languageModel.intents) {
            fileJsonObject.interactionModel.languageModel.intents.forEach(intent => {
            if (Array.isArray(intent.samples) && intent.samples.length > 0) {
              allSamples.push(...intent.samples);
            }
          });
        } else {
          throw new Error("Invalid or missing JSON file structure");
        }
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
  

  private _setWebviewMessageListener(webview: vscode.Webview) {
    let absoluteScriptPath;
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;
        const text = message.text;
        const value = message.value;
        switch (command) {
          case 'message':
            vscode.window.showInformationMessage(text);
            break;
          case 'findFile':
            this.postseed(webview);
            break;
          case 'errorMessage':
            vscode.window.showErrorMessage(text);
            break;
          case 'SliderValue':
            this.ScoreSeed = value / 100;
            break;
          case 'createTxtFile':
            this.CreateTxtFile(text, webview);
            break;
          case 'VUI-UPSET':
            absoluteScriptPath = path.join(__dirname, '/implementations/VUI-UPSET.jar');
            this.runScript(`java -jar ${quoteSpaces(absoluteScriptPath)} ${quoteSpaces(this.TextFilePath)} ${quoteSpaces(this.outputPath)}`,webview);
            break;
            console.log(this.outputPath + ".json");
            
            //apri il file;
            break;

        }
      },
      undefined,
      this._disposables
    );
  }
}
/*const tester = new AlexaUtteranceTester('./path/to/your/file.json', 'your-skill-id');
tester.runSimulations();*/