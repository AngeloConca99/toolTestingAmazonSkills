// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { GenerationPanel } from "./panels/GenerationPanel";
import { InfoProvider } from './InfoProvider';
import { TestingPanel } from './panels/TestingPanel';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
// file: src/extension.ts

export function activate(context: vscode.ExtensionContext) {
	const infoProvider = new InfoProvider();
	vscode.window.registerTreeDataProvider('alexaSkillTestRobustnessView', infoProvider);

	context.subscriptions.push(
		
		vscode.commands.registerCommand('alexa-skill-test-robustness.openReadme', () => {
		const readmePath = vscode.Uri.file(path.join(context.extensionPath, "README.md"));
		vscode.commands.executeCommand('markdown.showPreview', readmePath);
		vscode.window.showInformationMessage('Opening README');
		}),

		vscode.commands.registerCommand("alexa-skill-test-robustness.GenerationPanel", () => {
			GenerationPanel.render(context.extensionUri, context);
		}),

		vscode.commands.registerCommand("alexa-skill-test-robustness.TestingPanel",  (arg) => {
			
			vscode.workspace.findFiles("**/tmp/output.json", "**/node_modules/**", 1).then((files) => {
				if (files.length > 0){
					TestingPanel.render(context.extensionUri, context,arg);
					TestingPanel.setFile(files[0].fsPath);
				} else{
					vscode.window.showErrorMessage('No \'output.json\' file found. Please generate \'output.json\' file using the skill test robustness extension.');
				}
			});
		})
	);

	

	
}

// This method is called when your extension is deactivated
export function deactivate() { }
