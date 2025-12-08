import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { format } from 'date-fns';

export function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projects, createProject, deleteProject, setCurrentProject, importProject } = useProject();
  const [importError, setImportError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      // For now, default to romantic template - user will select in editor
      const project = createProject('romantic', newProjectName.trim());
      setCurrentProject(project);
      setNewProjectName('');
      setShowCreateModal(false);
      navigate('/editor');
    }
  };

  const handleEdit = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      navigate('/editor');
    }
  };

  const handleDelete = (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(projectId);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          const result = importProject(jsonData);
          if (result.success) {
            setImportError(null);
            if (result.project) {
              setCurrentProject(result.project);
              navigate('/editor');
            }
          } else {
            setImportError(result.error || 'Import failed');
          }
        } catch (error) {
          setImportError('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('app.title')}</h1>
          <h2 className="text-3xl font-semibold text-gray-700">{t('app.subtitle')}</h2>
        </div>

        <div className="flex gap-4 mb-8">
          <Button onClick={handleCreateNew}>
            {t('app.createNewGift')}
          </Button>
          <Button variant="secondary" onClick={handleImport}>
            {t('app.importProject')}
          </Button>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('app.createNewGift')}</h2>
              <form onSubmit={handleCreateSubmit}>
                <Input
                  label="Project Name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  autoFocus
                  className="mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewProjectName('');
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={!newProjectName.trim()}>
                    {t('common.save')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {importError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{importError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No projects yet</p>
              <Button onClick={handleCreateNew}>
                {t('app.createNewGift')}
              </Button>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
                <p className="text-sm text-gray-600 mb-1">Template: {project.templateId}</p>
                <p className="text-xs text-gray-500 mb-4">
                  Updated: {format(new Date(project.updatedAt), 'MMM d, yyyy HH:mm')}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => handleEdit(project.id)}
                    className="flex-1"
                  >
                    {t('app.edit')}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(project.id)}
                  >
                    {t('app.delete')}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">{t('app.privacy.title')}</h3>
          <p className="text-blue-800 text-sm">{t('app.privacy.description')}</p>
        </div>
      </div>
    </div>
  );
}

