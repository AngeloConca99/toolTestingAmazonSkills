import * as vscode from 'vscode';

export class QuickPickManager{
    public static async showQuickPick(array) {
        const intent = vscode.window.showQuickPick(
          array,
          {placeHolder: "Choose an intent"}).then((value) => {
            return value;
          });
          
      }
}