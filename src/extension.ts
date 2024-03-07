// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { HelloWorldPanel } from "./panels/HelloWorldPanel";
import { InfoProvider } from './InfoProvider';
import { SecondPanel } from './panels/SecondPanel';
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

		vscode.commands.registerCommand("alexa-skill-test-robustness.helloWorld", () => {
			HelloWorldPanel.render(context.extensionUri, context);
		}),

		vscode.commands.registerCommand("alexa-skill-test-robustness.secondPanel", () => {
			
			vscode.workspace.findFiles("**/tmp/output.json", "**/node_modules/**", 1).then((files) => {
				if (files.length > 0){
					SecondPanel.render(context.extensionUri, context);
					SecondPanel.setFile(files[0].fsPath);
				} else{
					vscode.window.showErrorMessage('No \'output.json\' file found. Please generate \'output.json\' file using the skill test robustness extension.');
				}
			});
		})
	);

	

	
}

// This method is called when your extension is deactivated
export function deactivate() { }
