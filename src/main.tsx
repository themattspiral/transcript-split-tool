import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'react-contexify/dist/ReactContexify.css';

import './main.css';
import './shared/styles.scss';
import './shared/components/components.scss';

import { App } from './app';
import { ViewStateProvider } from './context/view-state-provider';
import { ProjectDataProvider } from './context/project-data-provider';
import { StructureEditProvider } from './context/structure-edit-provider';
import { TranscriptInteractionProvider } from './context/transcript-interaction-provider';
import { ClientSessionProvider } from './context/client-session-provider';
import { PersistenceProvider } from './context/persistence/persistence-provider';

// reference
// import reactLogo from './assets/react.svg' // src
// import viteLogo from '/vite.svg'           // public

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ViewStateProvider>
      <ProjectDataProvider>
        <StructureEditProvider>
          <TranscriptInteractionProvider>
            <PersistenceProvider>
              <ClientSessionProvider>
                <App />
              </ClientSessionProvider>
            </PersistenceProvider>
          </TranscriptInteractionProvider>
        </StructureEditProvider>
      </ProjectDataProvider>
    </ViewStateProvider>
  </StrictMode>
);
