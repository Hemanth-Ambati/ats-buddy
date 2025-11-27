import * as React from 'react';
import ReactDOM from 'react-dom/client';
import Main from './Main';
import './index.css';

import { SpeedInsights } from "@vercel/speed-insights/react"

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Main />
    <SpeedInsights />
  </React.StrictMode>
);