import * as vscode from 'vscode';

export class InfoProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (element === undefined) {
            // Qui definisci i nodi radice della tua TreeView
            const startPanelItem = new vscode.TreeItem("Avvia l'estensione", vscode.TreeItemCollapsibleState.None);
            startPanelItem.command = { command: 'alexa-skill-test-robustness.helloWorld', title: "Avvia", arguments: [] };
            const openReadmeItem = new vscode.TreeItem("Apri README", vscode.TreeItemCollapsibleState.None);
            openReadmeItem.command = { command: 'alexa-skill-test-robustness.openReadme', title: "Apri README", arguments: [] };

            return Promise.resolve([
                startPanelItem,
                openReadmeItem
            ]);
        }
        return Promise.resolve([]);
    }
}
