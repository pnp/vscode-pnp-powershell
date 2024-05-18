import * as vscode from 'vscode';
import { WebviewViewProvider } from 'vscode';
import * as samples from '../../data/samples.json';
import axios from 'axios';


export class WebViewPanels implements WebviewViewProvider {

  private docsView: any = null;
  private sampleView: any = null;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private data: any,
    private _view: any = null
  ) { }

  public refresh(): void {
    this._onDidChangeTreeData.fire(null);
    this._view.webview.html = this._getHtmlWebviewForCommandsList(this._view?.webview);
  }

  public resolveWebviewView(webviewView: vscode.WebviewView): void | Promise<void> {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };
    webviewView.webview.html = this._getHtmlWebviewForCommandsList(webviewView.webview);
    this._view = webviewView;
    this._activateListener(this._view.webview);
  }

  public getHtmlWebviewForSamplesView(searchQuery: string = ''): void {
    if (this.sampleView === null) {
      this.sampleView = vscode.window.createWebviewPanel(
        'PnPPSSamples',
        'PnP PowerShell - samples',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [this.context.extensionUri],
          retainContextWhenHidden: true
        }
      );

      this.sampleView.iconPath = {
        dark: vscode.Uri.file(vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'logo.svg').path),
        light: vscode.Uri.file(vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'logo.svg').path)
      };

      this.sampleView.onDidDispose(() => {
        this.sampleView = null;
      });
    }

    const scriptUri = this.sampleView.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'samplesView', 'build', 'assets', 'index.js'));
    const stylesUri = this.sampleView.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'samplesView', 'build', 'assets', 'index.css'));

    this.sampleView.webview.html = this._getHtmlWebview(this.sampleView.webview, scriptUri, stylesUri, searchQuery);
    this._activateListener(this.sampleView.webview);
    this.sampleView.reveal();
  }

  public getHtmlWebviewForDocsView(commandName: string): void {
    if (this.docsView === null) {
      this.docsView = vscode.window.createWebviewPanel(
        'PnPPSManual',
        'PnP PowerShell - docs',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [this.context.extensionUri],
          enableFindWidget: true
        }
      );

      this.docsView.iconPath = {
        dark: vscode.Uri.file(vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'logo.svg').path),
        light: vscode.Uri.file(vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'logo.svg').path)
      };

      this.docsView.onDidDispose(() => {
        this.docsView = null;
      });

      this._activateListener(this.docsView.webview);
    }

    const scriptUri = this.docsView.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'docsView', 'build', 'assets', 'index.js'));
    const stylesUri = this.docsView.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'docsView', 'build', 'assets', 'index.css'));

    this.docsView.webview.html = this._getHtmlWebview(this.docsView.webview, scriptUri, stylesUri, commandName);
    this.docsView.reveal();
  }

  private _getHtmlWebviewForCommandsList(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'commandsList', 'build', 'assets', 'index.js'));
    const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'commandsList', 'build', 'assets', 'index.css'));
    return this._getHtmlWebview(webview, scriptUri, stylesUri);
  }

  private _activateListener(webview: vscode.Webview): void {
    webview.onDidReceiveMessage((message: any) => {
      switch (message.command) {
        case 'showCommandManual':
          this.getHtmlWebviewForDocsView(message.value);
          break;
        case 'openLink':
          vscode.env.openExternal(vscode.Uri.parse(message.value));
          break;
        case 'createScriptFile':
          this._createScriptFile(message.value);
          break;
        case 'showSamples':
          this.getHtmlWebviewForSamplesView(message.value);
          break;
        default:
          break;
      }
    });
  }

  private _createScriptFile(sampleTitle: string): void {
    const sample = samples.samples.find(sample => sample.title === sampleTitle);
    const sampleUrl = sample.rawUrl;

    axios
      .get(sampleUrl)
      .then(res => {
        const content: string = res.data.split(sample.tabTag)[1].split('```' + sample.type + '\n')[1].split('```')[0];
        const language = sample.type;
        vscode.workspace.openTextDocument({ content, language }).then(document => vscode.window.showTextDocument(document));
      })
      .catch(() => {
        vscode.window.showErrorMessage('Error while creating script file based on sample');
      });
  }

  private _getHtmlWebview(webview: vscode.Webview, scriptUri: vscode.Uri, stylesUri: vscode.Uri, initialData: string = ''): string {

    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'codicon', 'codicon.css'));

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <link rel="stylesheet" type="text/css" href="${codiconsUri}">
        </head>
        ${initialData !== '' ?
        `<script>window.initialData = "${initialData}";</script>`
        : ''
      }
        <body>
          <div id="root"></div>
          <script type="module" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  private _onDidChangeTreeData: vscode.EventEmitter<any | undefined | null | void> = new vscode.EventEmitter<any | undefined | null | void>();
}
