import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProjectProvider } from './contexts/ProjectContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { LiveExamplesPage } from './pages/LiveExamplesPage';
import { PricingPage } from './pages/PricingPage';
import { FAQPage } from './pages/FAQPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { Editor } from './pages/Editor';
import { ProfilePage } from './pages/ProfilePage';
import { PageTransition } from './components/layout/PageTransition';
import './i18n/config';

function AppRoutes() {
  const location = useLocation();

  return (
    <PageTransition>
      <Routes key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/live-examples" element={<LiveExamplesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
  );
}

function App() {
  return (
    <ProjectProvider>
      <ErrorBoundary>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
        </Router>
      </ErrorBoundary>
    </ProjectProvider>
  );
}

export default App;
