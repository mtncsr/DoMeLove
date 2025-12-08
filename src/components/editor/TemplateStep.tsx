import React from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import { Button } from '../ui/Button';

const templates = [
  { id: 'romantic', name: 'Romantic / Couple' },
  { id: 'adult-birthday', name: 'Adult Birthday' },
  { id: 'kids-birthday', name: 'Kids Birthday' },
  { id: 'new-baby', name: 'New Baby / Birth' },
  { id: 'bar-mitzvah', name: 'Bar/Bat Mitzvah' },
  { id: 'wedding', name: 'Wedding / Save the Date' },
  { id: 'single-screen', name: 'Single Screen' },
];

export function TemplateStep() {
  const { t } = useTranslation();
  const { currentProject, updateProject } = useProject();

  const handleSelectTemplate = (templateId: string) => {
    if (currentProject) {
      updateProject({
        ...currentProject,
        templateId,
      });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('editor.template.selectTemplate')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`p-6 border-2 rounded-lg cursor-pointer transition-colors ${
              currentProject?.templateId === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'
            }`}
            onClick={() => handleSelectTemplate(template.id)}
          >
            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}




