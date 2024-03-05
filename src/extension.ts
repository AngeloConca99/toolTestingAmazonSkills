// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { HelloWorldPanel } from "./panels/HelloWorldPanel";
import { InfoProvider } from './InfoProvider';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
// file: src/extension.ts

export function activate(context: vscode.ExtensionContext) {
	const infoProvider = new InfoProvider();
	vscode.window.registerTreeDataProvider('alexaSkillTestRobustnessView', infoProvider);

	const start= vscode.commands.registerCommand("alexa-skill-test-robustness.helloWorld", () => {
		HelloWorldPanel.render(context.extensionUri,context);
	});
	
	const openReadme = vscode.commands.registerCommand('alexa-skill-test-robustness.openReadme', () => {
        const readmePath = vscode.Uri.file(path.join(context.extensionPath, "README.md"));
        vscode.commands.executeCommand('markdown.showPreview', readmePath);
        vscode.window.showInformationMessage('Opening README');
    });
  
	context.subscriptions.push(start);
  }

// This method is called when your extension is deactivated
export function deactivate() {}
