import * as React from 'react';
import './Loader.css';
import { ILoaderProps } from './ILoaderProps';
import { ILoaderState } from './ILoaderState';
import { VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react';


export default class Loader extends React.Component<ILoaderProps, ILoaderState> {

  constructor(props: ILoaderProps) {
    super(props);
  }

  public render(): React.ReactElement<ILoaderProps> {
    return (
      <div className='loader'>
        <div>
          <VSCodeProgressRing />
        </div>
      </div>
    );
  }
}
