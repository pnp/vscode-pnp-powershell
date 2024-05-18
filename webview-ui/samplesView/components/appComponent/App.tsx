import * as React from 'react';
import * as samples from '../../../../data/samples.json';
import { ISample } from '../../../../models/ISample';
import './App.css';
import { IAppProps } from './IAppProps';
import { IAppState } from './IAppState';
import Loader from '../loaderComponent/Loader';
import Card from '../cardComponent/Card';
import { VSCodeDivider, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';


export default class App extends React.Component<IAppProps, IAppState> {

  constructor(props: IAppProps) {
    super(props);

    this.state = {
      loading: true,
      samples: null,
      searchQueryInput: ''
    };
  }

  public componentDidMount(): void {
    const { searchQuery } = this.props;

    this.setState({
      samples: samples.samples as ISample[],
      loading: false,
      searchQueryInput: searchQuery ?? ''
    });

    if(searchQuery !== undefined) {
      this._handleSearch(searchQuery);
    }
  }

  public render(): React.ReactElement<IAppProps> {
    const { loading, samples } = this.state;

    return (
      <main>
        <div className='app-title'>
          <h2>PnP PowerShell samples</h2>
        </div>
        <div className='app-search'>
          <VSCodeTextField placeholder="Search for sample" size={50} value={this.state.searchQueryInput} onInput={e => this._handleSearch((e.target as HTMLInputElement)?.value)}>
            <span slot="start" className="codicon codicon-search"></span>
          </VSCodeTextField>
          <VSCodeDivider />
        </div>
        <div className='app-samples'>
          {loading ?
            <Loader /> :
            samples?.map((sample: ISample, index: number) => <Card key={index} sample={sample} />)}
        </div>
      </main>
    );
  }

  private _handleSearch(givenSearchInput: string): void {
    const allSamples: ISample[] = samples.samples as ISample[];
    const searchInput = givenSearchInput?.toLowerCase() ?? '';
    const searchResult: ISample[] = allSamples.filter(sample =>
      sample.title.toLowerCase().includes(searchInput) ||
      (sample.tags !== null && sample.tags.some(tag => tag.toLowerCase().includes(searchInput)) ||
        (sample.authors !== null && sample.authors.some(author => author.name.toLowerCase().includes(searchInput)))));

    this.setState({
      samples: searchResult,
      searchQueryInput: givenSearchInput
    });
  }
}
