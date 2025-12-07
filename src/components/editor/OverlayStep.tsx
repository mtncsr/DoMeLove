import React from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import { Input } from '../ui/Input';

export function OverlayStep() {
  const { t } = useTranslation();
  const { currentProject, updateProject } = useProject();

  if (!currentProject) return null;

  const updateOverlay = (field: string, value: string | 'heart' | 'birthday' | 'save_the_date' | 'custom') => {
    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        overlay: {
          ...currentProject.data.overlay,
          [field]: value,
        },
      },
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('editor.steps.overlay')}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('editor.overlay.overlayType')}
          </label>
          <select
            value={currentProject.data.overlay.type}
            onChange={(e) => updateOverlay('type', e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="heart">Heart</option>
            <option value="birthday">Birthday</option>
            <option value="save_the_date">Save the Date</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <Input
          label={t('editor.overlay.mainText')}
          value={currentProject.data.overlay.mainText || ''}
          onChange={(e) => updateOverlay('mainText', e.target.value)}
        />
        <Input
          label={t('editor.overlay.subText')}
          value={currentProject.data.overlay.subText || ''}
          onChange={(e) => updateOverlay('subText', e.target.value)}
        />
        <Input
          label={t('editor.overlay.buttonText')}
          value={currentProject.data.overlay.buttonText || 'Tap to Begin'}
          onChange={(e) => updateOverlay('buttonText', e.target.value)}
        />
      </div>
    </div>
  );
}



