import { Navigate, Route, Routes } from 'react-router-dom';

import { SettingsPage } from 'pages/settings/settings-page';
import { ProjectPage } from 'pages/project/project-page';
import { TranscriptView } from 'pages/project/transcript-view/transcript-view';
import { StructuresView } from 'pages/project/structures-view/structures-view';
import { HomePage } from 'pages/home/home-page';
import { ProjectSettingsView } from 'pages/project/settings-view/project-settings-view';
import { ProjectsListPage } from 'pages/projects-list/projects-list-page';

export const AppRoutes: React.FC = () => (
  <Routes>

    <Route index path="/" element={ <HomePage /> } />

    <Route path="/projects" element={ <ProjectsListPage /> } />

    <Route path="/settings" element={ <SettingsPage /> } />
    <Route path={import.meta.env.TST_OAUTH_GOOGLE_REDIRECT_PATH} element={ <SettingsPage /> } />

    <Route path="/project/:projectFileId">
      <Route index element= { <Navigate to="transcript" /> } />

      <Route element={ <ProjectPage /> }>
        <Route path="transcript" element={ <TranscriptView /> } />
        <Route path="structures" element={ <StructuresView /> } />
        <Route path="settings" element={ <ProjectSettingsView /> } />
      </Route>
    </Route>

  </Routes>
);
