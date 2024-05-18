import * as React from 'react';
import * as pnpPsCommands from '../../../../data/pnpPsModel.json';
import './App.css';
import { IAppProps } from './IAppProps';
import { IAppState } from './IAppState';
import axios from 'axios';
import Docs from '../docsComponent/Docs';
import Loader from '../loaderComponent/Loader';
import NotFound from '../notFoundComponent/NotFound';


export default class App extends React.Component<IAppProps, IAppState> {

  constructor(props: IAppProps) {
    super(props);

    this.state = {
      loading: true,
      notFound: false,
      docs: '',
      docsUrl: '',
      docsCommandName: ''
    };
  }

  public componentDidMount(): void {
    const commandName = this.props.commandName;
    const command = pnpPsCommands.commands.find(command => command.name === commandName);

    if(!command)
    {
      this.setState({
        loading: false,
        notFound: true
      });
      return;
    }

    axios
      .get(command.url)
      .then(res => {
        this.setState({
          docs: res.data,
          docsUrl: command.docs,
          docsCommandName: command.name,
          loading: false
        });
      })
      .catch(() => {
        this.setState({
          loading: false,
          notFound: true
        });
      });
  }

  public render(): React.ReactElement<IAppProps> {
    const { loading, notFound, docs, docsUrl, docsCommandName } = this.state;

    return (
      <main className='docs'>
        {notFound ?
          <NotFound /> :
          loading ? <Loader /> : <Docs docsMarkDown={docs} docsUrl={docsUrl} docsCommandName={docsCommandName} />
        }
      </main>
    );
  }
}
