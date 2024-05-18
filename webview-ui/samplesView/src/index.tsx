import React from 'react';
import ReactDOM from 'react-dom';
import App from '../components/appComponent/App';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    initialData: string;
  }
}

ReactDOM.render(
  <React.StrictMode>
    <App searchQuery={window.initialData} />
  </React.StrictMode>,
  document.getElementById('root')
);
