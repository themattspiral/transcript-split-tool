import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'react-contexify/dist/ReactContexify.css';

import './main.css';
import './shared/styles.scss';
import './shared/components/components.scss';

import { App } from './app';
import { ViewStateProvider } from './context/view-state-provider';
import { UserDataProvider } from './context/user-data-provider';
import { StructureEditProvider } from './context/structure-edit-provider';
import { TranscriptInteractionProvider } from './context/transcript-interaction-provider';

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
