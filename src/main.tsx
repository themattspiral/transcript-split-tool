import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import 'react-contexify/dist/ReactContexify.css';

import './main.css';
import './shared/styles.scss';
import 'components/components.scss';

import { ViewStateProvider } from 'context/view-state-provider';
import { ProjectDataProvider } from 'context/project-data-provider';
import { StructureEditProvider } from 'context/structure-edit-provider';
import { TranscriptInteractionProvider } from 'context/transcript-interaction-provider';
import { PersistenceProvider } from 'context/persistence/persistence-provider';
import { AppSettingsProvider } from 'context/app-settings-provider';
import { AppRoutes } from './routes';

// reference
// import reactLogo from './assets/react.svg' // src
// import viteLogo from '/vite.svg'           // public

createRoot(document.getElementById('root')!).render(

  <StrictMode>

    <BrowserRouter>

      <ViewStateProvider>
        <ProjectDataProvider>
          <StructureEditProvider>
            <TranscriptInteractionProvider>
              <PersistenceProvider>
                <AppSettingsProvider>

                  <AppRoutes />

                </AppSettingsProvider>
              </PersistenceProvider>
            </TranscriptInteractionProvider>
          </StructureEditProvider>
        </ProjectDataProvider>
      </ViewStateProvider>

    </BrowserRouter>

  </StrictMode>
);
