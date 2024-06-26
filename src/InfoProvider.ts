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
            const SavePanelItem = new vscode.TreeItem("Save Panel", vscode.TreeItemCollapsibleState.None);
            SavePanelItem.command = { command: 'alexa-skill-test-robustness.SavePanel', title: "Save Panel", arguments: [] };
            const TestingPanelItem = new vscode.TreeItem("Testing Panel", vscode.TreeItemCollapsibleState.None);
            TestingPanelItem.command = { command: 'alexa-skill-test-robustness.TestingPanel', title: "Test Panel", arguments: [] };



            return Promise.resolve([
                startPanelItem,
                openReadmeItem,
                SavePanelItem,
                TestingPanelItem
            ]);
        }
        return Promise.resolve([]);
    }
}
