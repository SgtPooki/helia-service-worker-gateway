import React from 'react'
import ReactDOMClient from 'react-dom/client';

import './app.css';
import App from './app.tsx'

const container = document.getElementById('root')
const root = ReactDOMClient.createRoot(container);


root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
const sw = await navigator.serviceWorker.register(new URL('sw/index.ts', import.meta.url));
console.log(`sw: `, sw);

sw.update();
