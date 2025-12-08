import React from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { LanguageSelector } from '../ui/LanguageSelector';

export function GiftDetailsStep() {
  const { t } = useTranslation();
  const { currentProject, updateProject } = useProject();

  if (!currentProject) return null;

  const updateField = (field: string, value: string) => {
    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        [field]: value,
      },
    });
  };

  const updateLanguage = (language: string) => {
    updateProject({
      ...currentProject,
      language,
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('editor.steps.giftDetails')}</h2>
      <div className="space-y-4">
        <Input
          label={t('editor.giftDetails.recipientName')}
          value={currentProject.data.recipientName || ''}
          onChange={(e) => updateField('recipientName', e.target.value)}
        />
        <Input
          label={t('editor.giftDetails.senderName')}
          value={currentProject.data.senderName || ''}
          onChange={(e) => updateField('senderName', e.target.value)}
        />
        <Input
          label={t('editor.giftDetails.eventTitle')}
          value={currentProject.data.eventTitle || ''}
          onChange={(e) => updateField('eventTitle', e.target.value)}
        />
        <Textarea
          label={t('editor.giftDetails.mainGreeting')}
          value={currentProject.data.mainGreeting || ''}
          onChange={(e) => updateField('mainGreeting', e.target.value)}
          rows={4}
        />
        <LanguageSelector
          label={t('editor.giftDetails.language')}
          value={currentProject.language}
          onChange={updateLanguage}
        />
      </div>
    </div>
  );
}





