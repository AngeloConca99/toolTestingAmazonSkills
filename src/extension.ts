// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HelloWorldPanel } from "./panels/HelloWorldPanel";
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
// file: src/extension.ts

export function activate(context: vscode.ExtensionContext) {
	const start= vscode.commands.registerCommand("alexa-skill-test-robustness.helloWorld", () => {
		HelloWorldPanel.render(context.extensionUri);
	});
  
	context.subscriptions.push(start);
  }

// This method is called when your extension is deactivated
export function deactivate() {}
