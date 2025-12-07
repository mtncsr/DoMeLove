import React from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { TemplateMeta } from '../../types/template';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';

interface ScreenTextsStepProps {
  templateMeta: TemplateMeta | null;
}

export function ScreenTextsStep({ templateMeta }: ScreenTextsStepProps) {
  const { t } = useTranslation();
  const { currentProject, updateProject } = useProject();

  if (!currentProject || !templateMeta) return null;

  const updateScreenField = (screenId: string, field: string, value: string) => {
    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        screens: {
          ...currentProject.data.screens,
          [screenId]: {
            ...currentProject.data.screens[screenId],
            [field]: value,
          },
        },
      },
    });
  };

  const updateBlessing = (index: number, field: 'sender' | 'text', value: string) => {
    const blessings = [...(currentProject.data.blessings || [])];
    if (!blessings[index]) {
      blessings[index] = { sender: '', text: '' };
    }
    blessings[index][field] = value;
    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        blessings,
      },
    });
  };

  const addBlessing = () => {
    const blessings = [...(currentProject.data.blessings || []), { sender: '', text: '' }];
    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        blessings,
      },
    });
  };

  const removeBlessing = (index: number) => {
    const blessings = currentProject.data.blessings || [];
    blessings.splice(index, 1);
    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        blessings,
      },
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('editor.steps.screenTexts')}</h2>
      <div className="space-y-8">
        {templateMeta.screens.map((screen) => (
          <div key={screen.screenId} className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{screen.screenId}</h3>
            
            {screen.placeholders.includes('title') && (
              <Input
                label="Title"
                value={currentProject.data.screens[screen.screenId]?.title || ''}
                onChange={(e) => updateScreenField(screen.screenId, 'title', e.target.value)}
                className="mb-4"
              />
            )}

            {screen.placeholders.includes('text') && (
              <Textarea
                label="Text"
                value={currentProject.data.screens[screen.screenId]?.text || ''}
                onChange={(e) => updateScreenField(screen.screenId, 'text', e.target.value)}
                rows={4}
                className="mb-4"
              />
            )}

            {screen.type === 'blessings' && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold">Blessings</h4>
                  <Button onClick={addBlessing}>Add Blessing</Button>
                </div>
                {(currentProject.data.blessings || []).map((blessing, index) => (
                  <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <Input
                      label="Sender"
                      value={blessing.sender}
                      onChange={(e) => updateBlessing(index, 'sender', e.target.value)}
                      className="mb-2"
                    />
                    <Textarea
                      label="Text"
                      value={blessing.text}
                      onChange={(e) => updateBlessing(index, 'text', e.target.value)}
                      rows={2}
                    />
                    <Button
                      variant="danger"
                      onClick={() => removeBlessing(index)}
                      className="mt-2"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}



