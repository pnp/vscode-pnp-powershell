import React from 'react';
import { ICommandsSearchProps } from './ICommandsSearchProps';
import { ICommandsSearchState } from './ICommandsSearchState';
import { VSCodeTextField } from '@vscode/webview-ui-toolkit/react';


export default class CommandsSearch extends React.Component<ICommandsSearchProps, ICommandsSearchState> {

    constructor(props: ICommandsSearchProps) {
        super(props);
    }

    render(): React.ReactElement<ICommandsSearchProps> {
        const { initialSearchInput } = this.props;

        return (
            <VSCodeTextField placeholder='Search' size={50} value={initialSearchInput !== undefined ? initialSearchInput : ''} onInput={this.props.onSearch}>
                <span slot='start' className='codicon codicon-search'></span>
            </VSCodeTextField>
        );
    }
}
