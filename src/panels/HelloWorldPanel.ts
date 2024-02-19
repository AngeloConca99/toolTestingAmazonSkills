// file: src/panels/HelloWorldPanel.ts

import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
export class HelloWorldPanel {
  public static currentPanel: HelloWorldPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private readonly timeoutMillis: number = 20000; 
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
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')]
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
    const stylesUri = this.getCss(webview,extensionUri);
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
        const displayDefault = require("../../out/display.js").default;
        const htmlPath = path.join(extensionUri.fsPath, "out", displayDefault);
        const displayHtmlContent = fs.readFileSync(htmlPath, 'utf-8');
        return displayHtmlContent;
    } catch (error) {
        console.error(error);
        throw new Error('Errore durante il recupero del contenuto HTML');
    }
}
private getCss(webview: vscode.Webview, extensionUri: vscode.Uri): vscode.Uri {
  const fs = require('fs');
    const path = require('path');
    try {
        const cssDefault = require("../../out/styles.js").default;
        const cssUri= getUri(webview, extensionUri, ["out", cssDefault]);
        return cssUri;
    } catch (error) {
        console.error(error);
        throw new Error('Errore durante il recupero del contenuto Css');
    }
}
private async findFilesWithTimeout(include: vscode.GlobPattern,exclude?: vscode.GlobPattern,maxResults?: number, timeoutMillis?: number): Thenable<vscode.Uri[]> {
  const tokenSource = new vscode.CancellationTokenSource();
  const timeout = timeoutMillis? setTimeout(() => tokenSource.cancel(), timeoutMillis) : undefined;

  const filesPromise = vscode.workspace.findFiles(include, exclude, maxResults, tokenSource.token)
      .then((files) => {
          clearTimeout(timeout); 
          return files;
      });

  return new Promise((resolve, reject) => {
      filesPromise.then(resolve, reject);
  });

}

private _setWebviewMessageListener(webview: vscode.Webview) {
  webview.onDidReceiveMessage(
    async (message: any) => {
      const command = message.command;
      const text = message.text;

      switch (command) {
        case "start":
          vscode.window.showInformationMessage(text);
          return;
        case "findFile":
          vscode.window.showInformationMessage(text);
          
          try {
            const jsonFile = await this.findFilesWithTimeout('**/skill-package/interactionModels/custom/*.json','**/node_modules/**',1,this.timeoutMillis);
            if (jsonFile && jsonFile.length > 0) {
              vscode.window.showInformationMessage("File trovato: " + jsonFile[0].fsPath);
              console.log("File trovato: " + jsonFile);
              webview.postMessage({ command: 'JsonFile', files: jsonFile });
          } else {
            
              vscode.postMessage({ command: 'JsonFileNotFound' });
              vscode.window.showErrorMessage('Nessun file JSON trovato.');
             
          }
          } catch (error) {
            vscode.window.showErrorMessage('Errore durante la ricerca dei file: ' + error);
            webview.postMessage({ command: 'JsonFileNotFound' });
          }
          return;
      }
    },
    undefined,
    this._disposables
  );
}
}