import * as vscode from 'vscode';
import { WebViewPanels } from './panels/WebViewPanels';
import * as pnpPsCommands from '../data/pnpPsModel.json';


export function activate(context: vscode.ExtensionContext) {
    const pnpPsProvider = new WebViewPanels(context, {});
    const view = vscode.window.registerWebviewViewProvider('PnPPS', pnpPsProvider);
    context.subscriptions.push(view);

    const openSamplesWebviewCommand = vscode.commands.registerCommand('PnPPS.showSamples', () => pnpPsProvider.getHtmlWebviewForSamplesView());
    context.subscriptions.push(openSamplesWebviewCommand);

    const openManualWebviewCommand = vscode.commands.registerCommand('PnPPS.showManual', async () => {
        const editor = vscode.window.activeTextEditor;

        let selectedCommand: string = '';
        if (editor)
            selectedCommand = editor.document.getText(editor.selection);

        const commandName = await vscode.window.showInputBox({
            placeHolder: 'e.g. spo list get',
            prompt: 'Enter command name',
            value: selectedCommand
        });

        if (!commandName)
            return;

        if (!pnpPsCommands.commands.some(command => command.name === commandName)) {
            vscode.window.showErrorMessage(`the command ${commandName} does not exist`);
            return;
        }

        pnpPsProvider.getHtmlWebviewForDocsView(commandName);
    });
    context.subscriptions.push(openManualWebviewCommand);
}

export function deactivate() { }