import * as vscode from 'vscode';

export class InfoProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (element === undefined) {
            // Qui definisci i nodi radice della tua TreeView
            const startPanelItem = new vscode.TreeItem("Generation Panel", vscode.TreeItemCollapsibleState.None);
            startPanelItem.command = { command: 'alexa-skill-test-robustness.GenerationPanel', title: "Generation Panel", arguments: [] };
            const openReadmeItem = new vscode.TreeItem("README", vscode.TreeItemCollapsibleState.None);
            openReadmeItem.command = { command: 'alexa-skill-test-robustness.openReadme', title: "README", arguments: [] };
            const TestingPanelItem = new vscode.TreeItem("Testing Panel", vscode.TreeItemCollapsibleState.None);
            TestingPanelItem.command = { command: 'alexa-skill-test-robustness.TestingPanel', title: "Testing Panel", arguments: [] };



            return Promise.resolve([
                startPanelItem,
                openReadmeItem,
                TestingPanelItem
            ]);
        }
        return Promise.resolve([]);
    }
}
