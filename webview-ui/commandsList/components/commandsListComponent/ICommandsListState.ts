import { ICommand } from '../../../../models/ICommand';
import { ICommandGroup } from './model/ICommandGroup';


export interface ICommandsListState {
    commandsListView: ICommand[];
    commandsTreeView: ICommandGroup[];
    isTreeViewEnabled: boolean;
    previousSearchInput: string;
}