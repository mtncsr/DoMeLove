import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { useProject } from '../contexts/ProjectContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ProfilePage() {
  const { projects, setCurrentProject, deleteProject, exportProject, importProject } = useProject();
  const navigate = useNavigate();
  const { autosaveEnabled, setAutosaveEnabled, theme, setTheme } = useAppSettings();
  const [showSettings, setShowSettings] = useState(false);
  const { t } = useTranslation();

  const handleEdit = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    setCurrentProject(project);
    navigate('/editor');
  };

  const handleExport = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const json = exportProject(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name || 'project'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          const result = importProject(jsonData);
          if (result.success && result.project) {
            alert('Project imported successfully.');
          } else {
            alert(`Import failed: ${result.error || 'Unknown error'}`);
          }
        } catch (err) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 py-12 space-y-10">
        <section className="glass rounded-2xl p-6 border border-white/60 shadow-md">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{t('marketing.profile.title')}</h1>
          <p className="text-slate-700">{t('marketing.profile.subtitle')}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 font-semibold">{t('marketing.profile.currentPlan')}</span>
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
              {t('marketing.profile.projectsLabel')}: {projects.length}
            </span>
            <button
              className="ml-auto p-2 rounded-full hover:bg-slate-100 transition-colors border border-slate-200"
              onClick={() => setShowSettings(true)}
              aria-label={t('marketing.profile.openSettings')}
            >
              <Settings className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">{t('marketing.profile.yourProjects')}</h2>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleImport}>
                {t('marketing.profile.importProject')}
              </Button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="glass rounded-2xl p-6 border border-white/60 text-slate-700">
              {t('marketing.profile.noProjects')}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="glass rounded-2xl p-5 border border-white/60 shadow-sm flex flex-col gap-3"
                >
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{project.name}</h3>
                    <p className="text-sm text-slate-600">{t('marketing.profile.templatePrefix')} {project.templateId}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleEdit(project.id)} className="px-3 py-2 text-sm">
                      {t('marketing.profile.edit')}
                    </Button>
                    <Button variant="secondary" onClick={() => handleExport(project.id)} className="px-3 py-2 text-sm">
                      {t('marketing.profile.exportJson')}
                    </Button>
                    <Button variant="danger" onClick={() => deleteProject(project.id)} className="px-3 py-2 text-sm">
                      {t('marketing.profile.delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Settings modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">{t('marketing.profile.settingsTitle')}</h3>
                <button
                  className="text-slate-500 hover:text-slate-800"
                  onClick={() => setShowSettings(false)}
                  aria-label={t('marketing.profile.closeSettings')}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{t('marketing.profile.autosaveTitle')}</p>
                    <p className="text-sm text-slate-600">{t('marketing.profile.autosaveDescription')}</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={autosaveEnabled}
                      onChange={(e) => setAutosaveEnabled(e.target.checked)}
                    />
                    <div
                      className="w-11 h-6 rounded-full transition-colors relative"
                      style={{
                        backgroundColor: autosaveEnabled ? '#f472b6' : '#e2e8f0',
                      }}
                    >
                      <span
                        className="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200"
                        style={{
                          left: autosaveEnabled ? '1.4rem' : '0.25rem',
                        }}
                      />
                    </div>
                  </label>
                </div>

                <div>
                  <p className="font-semibold text-slate-900 mb-2">{t('marketing.profile.themeLabel')}</p>
                  <div className="flex gap-3">
                    <Button
                      variant={theme === 'light' ? 'primary' : 'secondary'}
                      onClick={() => setTheme('light')}
                    >
                      {t('marketing.profile.themeLight')}
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'primary' : 'secondary'}
                      onClick={() => setTheme('dark')}
                    >
                      {t('marketing.profile.themeDark')}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white px-4 py-3 rounded-2xl">
                  <div>
                    <p className="font-semibold">{t('marketing.profile.upgradeTitle')}</p>
                    <p className="text-sm opacity-90">{t('marketing.profile.upgradeDescription')}</p>
                  </div>
                  <Button className="bg-white text-fuchsia-600 hover:shadow-lg" onClick={() => alert('Upgrade flow coming soon')}>
                    {t('marketing.profile.upgrade')}
                  </Button>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowSettings(false)}>
                  {t('marketing.profile.close')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}


