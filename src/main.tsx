import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import "react-contexify/dist/ReactContexify.css";

import { App } from './App';
import { ViewStateProvider } from './context/ViewStateContext';
import { UserDataProvider } from './context/UserDataContext';
import { StructureEditProvider } from './context/StructureEditContext';
import { TranscriptInteractionProvider } from './context/TranscriptInteractionContext';

// reference
// import reactLogo from './assets/react.svg' // src
// import viteLogo from '/vite.svg'           // public

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ViewStateProvider>
      <UserDataProvider>
        <StructureEditProvider>
          <TranscriptInteractionProvider>
            <App />
          </TranscriptInteractionProvider>
        </StructureEditProvider>
      </UserDataProvider>
    </ViewStateProvider>
  </StrictMode>,
);
