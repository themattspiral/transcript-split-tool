import { Navigate, Route, Routes } from 'react-router-dom';

import { App } from './app';
import { TranscriptView } from 'pages/project/transcript-view/transcript-view';
import { StructuresGrid } from 'pages/project/structures-view/structures-grid';

export const AppRoutes: React.FC = () => (
  <Routes>
    
    <Route path="/" element={ <Navigate to="/transcript" /> } />

    <Route element={<App />}>
      <Route path="/transcript" element={ <TranscriptView /> } />
      <Route path="/structures" element={ <StructuresGrid /> } />
    </Route>

  </Routes>
);
