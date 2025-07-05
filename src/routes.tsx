import { Navigate, Route, Routes } from 'react-router-dom';

import { SettingsPage } from 'pages/settings/settings-page';
import { ProjectPage } from 'pages/project/project-page';
import { TranscriptView } from 'pages/project/transcript-view/transcript-view';
import { StructuresView } from 'pages/project/structures-view/structures-view';

export const AppRoutes: React.FC = () => (
  <Routes>

    {/* temp */}
    <Route path="/" element={ <Navigate to="/transcript" /> } />

    <Route element={<ProjectPage />}>
      <Route path="/transcript" element={ <TranscriptView /> } />
      <Route path="/structures" element={ <StructuresView /> } />
    </Route>

    <Route path="/settings" element={ <SettingsPage /> } />
    <Route path={import.meta.env.TST_OAUTH_GOOGLE_REDIRECT_PATH} element={ <SettingsPage /> } />

  </Routes>
);
