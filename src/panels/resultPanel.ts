import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import * as path from 'path';
import * as childProcess from 'child_process';
import * as fs from 'fs/promises';
import * as vscode from "vscode";
import { group } from "console";

export class resultPanel {
  public static currentPanel: resultPanel | undefined;
  public static context: vscode.ExtensionContext; 
  public readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private TestResult:any;
  

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext,testResult?: any) {
      resultPanel.context = context;
      this.TestResult = testResult;
      this._panel = panel;
      this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
      this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
      this._setWebviewMessageListener(this._panel.webview);
  }

  public static render(extensionUri: vscode.Uri, context: vscode.ExtensionContext, resultTest: any) {
    if (resultPanel.currentPanel) {
      resultPanel.currentPanel._panel.dispose();}
      const panel = vscode.window.createWebviewPanel("alexa-skill-test-robustness", "Skill Test Robustness", vscode.ViewColumn.One, {
        enableScripts: true,
      });

      resultPanel.currentPanel = new resultPanel(panel, extensionUri, context, resultTest);
    
  }


  public dispose() {
     resultPanel.currentPanel = undefined;
  
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
  const webviewUri = getUri(webview, extensionUri, ["out", "result.js"]);
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
          <title>Result Panel</title>
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
      const htmlPath = path.join(extensionUri.fsPath, "src", "component", "result.html");
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
            case'main':
            webview.postMessage({
              command:'result',
              value:this.TestResult
            });
            break;  
          }
        }
      );
    }
}