import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import "react-contexify/dist/ReactContexify.css";

import SplitGrid from './SplitGrid.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SplitGrid />
  </StrictMode>,
);
