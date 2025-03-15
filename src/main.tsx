import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import "react-contexify/dist/ReactContexify.css";

import { App } from './App';

// reference
// import reactLogo from './assets/react.svg' // src
// import viteLogo from '/vite.svg'           // public

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
