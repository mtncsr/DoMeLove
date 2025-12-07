import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './contexts/ProjectContext';
import { Home } from './pages/Home';
import { Editor } from './pages/Editor';
import './i18n/config';

function App() {
  return (
    <ProjectProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ProjectProvider>
  );
}

export default App;
