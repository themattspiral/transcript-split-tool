import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'react-contexify/dist/ReactContexify.css';

import './main.css';
import './shared/styles.scss';
import './shared/components/components.scss';

import { ViewStateProvider } from './context/view-state-provider';
import { ProjectDataProvider } from './context/project-data-provider';
import { StructureEditProvider } from './context/structure-edit-provider';
import { TranscriptInteractionProvider } from './context/transcript-interaction-provider';
import { PersistenceProvider } from './context/persistence/persistence-provider';
import { AppSettingsProvider } from './context/app-settings-provider';
import { App } from './app';

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
              <AppSettingsProvider>
                <App />
              </AppSettingsProvider>
            </PersistenceProvider>
          </TranscriptInteractionProvider>
        </StructureEditProvider>
      </ProjectDataProvider>
    </ViewStateProvider>
  </StrictMode>
);
