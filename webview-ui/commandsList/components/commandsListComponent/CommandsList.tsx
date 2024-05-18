import * as React from 'react';
import * as pnpPsCommands from '../../../../data/pnpPsModel.json';
import { ICommand } from '../../../../models/ICommand';
import './CommandsList.css';
import { ICommandsListProps } from './ICommandsListProps';
import { ICommandsListState } from './ICommandsListState';
import { vscode } from '../../utilities/vscode';
import { VSCodeDivider } from '@vscode/webview-ui-toolkit/react';
import CommandsSearch from '../commandsSearchComponent/CommandsSearch';
import CommandsAction from '../commandsActionComponent/CommandsAction';
import { ICommandGroup } from './model/ICommandGroup';


export default class CommandsList extends React.Component<ICommandsListProps, ICommandsListState> {

  constructor(props: ICommandsListProps) {
    super(props);

    const commands = pnpPsCommands.commands as ICommand[];

    this.state = {
      commandsListView: commands,
      commandsTreeView: this._getTreeView(commands),
      isTreeViewEnabled: false,
      previousSearchInput: ''
    };
  }

  public componentDidMount(): void {
    const previousState = vscode.getState() as ICommandsListState;
    if (previousState
      && previousState.commandsListView
      && previousState.commandsTreeView) {
      this.setState({
        isTreeViewEnabled: previousState.isTreeViewEnabled,
        previousSearchInput: previousState.previousSearchInput,
        commandsListView: previousState.commandsListView,
        commandsTreeView: previousState.commandsTreeView
      });
    }
  }

  public render(): React.ReactElement<ICommandsListProps> {
    const { commandsListView,
      isTreeViewEnabled,
      commandsTreeView,
      previousSearchInput } = this.state;

    return (
      <div>
        <div className='pnp-commands-list-controls'>
          <CommandsAction isTreeViewEnabled={isTreeViewEnabled} showListView={() => this._handleShowListViewButtonClick()} showTreeView={() => this._handleShowTreeViewButtonClick()} />
          <VSCodeDivider />
          <CommandsSearch initialSearchInput={previousSearchInput} onSearch={event => this._handleSearch(event)} />
        </div>
        <div className='pnp-commands-list-wrapper'>
          {isTreeViewEnabled ?
            <div className='pnp-commands-tree'>
              {commandsTreeView.map((group: ICommandGroup) => {
                const chevronExpandedIcon = group.isExpanded ? 'codicon-chevron-down' : 'codicon-chevron-right';
                return (
                  <div key={group.name}>
                    <div className='pnp-commands-tree-group' onClick={() => this._handleGroupNameClick(group.name)}>
                      <span className={'codicon ' + chevronExpandedIcon}></span>
                      <span className='pnp-commands-tree-group-name'>{group.name}</span>
                    </div>
                    <div className='pnp-commands-tree-commands'>
                      {group.isExpanded ?
                        <ul>
                          {group.commands.map(command => (<li key={commandsListView.indexOf(command)} onClick={() => this._handleCommandClick(command.name)}>{command.name}</li>))}
                        </ul> :
                        ''
                      }
                    </div>
                  </div>
                );
              })
              }
            </div> :
            <div className='pnp-commands-list'>
              <ul>
                {commandsListView.map(command => (<li key={commandsListView.indexOf(command)} onClick={() => this._handleCommandClick(command.name)}>{command.name}</li>))}
              </ul>
            </div>
          }
        </div>
      </div>);
  }

  private _handleGroupNameClick(groupName: string): void {
    const commandsTreeView = this.state.commandsTreeView;
    commandsTreeView.forEach(group => {
      if (group.name === groupName) {
        group.isExpanded = !group.isExpanded;
      }
    });

    this.setState({ commandsTreeView: commandsTreeView });

    const state = vscode.getState() as ICommandsListState ?? {} as ICommandsListState;
    state.commandsTreeView = commandsTreeView;
    vscode.setState(state);
  }

  private _handleShowListViewButtonClick(): void {
    const treeView = this.state.commandsTreeView;
    const listView = this.state.commandsListView;
    treeView.forEach(group => group.isExpanded = false);
    this.setState({
      isTreeViewEnabled: false,
      commandsTreeView: treeView
    });
    const state = vscode.getState() as ICommandsListState ?? {} as ICommandsListState;
    state.isTreeViewEnabled = false;
    state.commandsTreeView = treeView;
    state.commandsListView = listView;
    vscode.setState(state);
  }

  private _handleShowTreeViewButtonClick(): void {
    this.setState({ isTreeViewEnabled: true });
    const treeView = this.state.commandsTreeView;
    const listView = this.state.commandsListView;
    const state = vscode.getState() as ICommandsListState ?? {} as ICommandsListState;
    state.isTreeViewEnabled = true;
    state.commandsTreeView = treeView;
    state.commandsListView = listView;
    vscode.setState(state);
  }

  private _handleSearch(event: any): void {
    const searchInput: string = (event.target as HTMLInputElement)?.value;
    this._search(searchInput);
  }

  private _search(searchInput: string): void {
    const commands: ICommand[] = pnpPsCommands.commands as ICommand[];
    const searchResult: ICommand[] = commands.filter(command => command.name.toLowerCase().includes(searchInput.toLowerCase()));
    const searchResultTreeView: ICommandGroup[] = this._getTreeView(searchResult);
    this.setState({
      commandsListView: searchResult,
      commandsTreeView: searchResultTreeView,
      previousSearchInput: searchInput
    });
    const state = vscode.getState() as ICommandsListState ?? {} as ICommandsListState;
    state.commandsListView = searchResult;
    state.commandsTreeView = searchResultTreeView;
    state.previousSearchInput = searchInput;
    vscode.setState(state);
  }

  private _handleCommandClick(commandName: string): void {
    vscode.postMessage({
      command: 'showCommandManual',
      value: commandName,
    });
  }

  private _getTreeView(commands: ICommand[]): ICommandGroup[] {
    const groups = commands.map(command => command.name.split('-')[0]).filter((value, index, self) => self.indexOf(value) === index);
    const treeView = groups.map(group => {
      return {
        name: group,
        isExpanded: false,
        commands: commands.filter(command => command.name.startsWith(group))
      } as ICommandGroup;
    });

    if (this.state) {
      treeView.forEach(group => {
        this.state.commandsTreeView.find(treeGroup => treeGroup.name === group.name)?.isExpanded ? group.isExpanded = true : group.isExpanded = false;
      });
    }

    return treeView;
  }
}