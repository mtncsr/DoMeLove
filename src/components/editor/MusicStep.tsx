import React from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { TemplateMeta } from '../../types/template';
import type { AudioFile } from '../../types/project';
import { AudioUpload } from '../ui/AudioUpload';
import { Button } from '../ui/Button';
import { formatFileSize } from '../../utils/audioProcessor';

interface MusicStepProps {
  templateMeta: TemplateMeta | null;
}

export function MusicStep({ templateMeta }: MusicStepProps) {
  const { t } = useTranslation();
  const { currentProject, updateProject } = useProject();

  if (!currentProject) return null;

  const handleGlobalAudioUpload = (audio: AudioFile) => {
    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        audio: {
          ...currentProject.data.audio,
          global: audio,
        },
      },
    });
  };

  const handleScreenAudioUpload = (screenId: string, audio: AudioFile) => {
    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        audio: {
          ...currentProject.data.audio,
          screens: {
            ...currentProject.data.audio.screens,
            [screenId]: audio,
          },
        },
        screens: {
          ...currentProject.data.screens,
          [screenId]: {
            ...currentProject.data.screens[screenId],
            audioId: audio.id,
          },
        },
      },
    });
  };

  const handleDeleteGlobalAudio = () => {
    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        audio: {
          ...currentProject.data.audio,
          global: undefined,
        },
      },
    });
  };

  const handleDeleteScreenAudio = (screenId: string) => {
    const screens = { ...currentProject.data.audio.screens };
    delete screens[screenId];
    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        audio: {
          ...currentProject.data.audio,
          screens,
        },
        screens: {
          ...currentProject.data.screens,
          [screenId]: {
            ...currentProject.data.screens[screenId],
            audioId: undefined,
          },
        },
      },
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('editor.steps.music')}</h2>
      
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">{t('editor.music.globalMusic')}</h3>
          {currentProject.data.audio.global ? (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">{currentProject.data.audio.global.filename}</p>
              <p className="text-xs text-gray-500 mb-4">{formatFileSize(currentProject.data.audio.global.size)}</p>
              <Button variant="danger" onClick={handleDeleteGlobalAudio}>
                Remove
              </Button>
            </div>
          ) : (
            <AudioUpload
              onUpload={handleGlobalAudioUpload}
              label={t('editor.music.uploadMusic')}
            />
          )}
        </div>

        {templateMeta?.screens.filter(s => s.supportsMusic).map((screen, index) => {
          const screenData = currentProject.data.screens[screen.screenId] || {};
          const hasAudio = !!currentProject.data.audio.screens[screen.screenId];
          const isLastScreen = index === templateMeta.screens.filter(s => s.supportsMusic).length - 1;
          
          return (
            <div key={screen.screenId}>
              <h3 className="text-lg font-semibold mb-4">Screen: {screen.screenId}</h3>
              {hasAudio ? (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    {currentProject.data.audio.screens[screen.screenId].filename}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    {formatFileSize(currentProject.data.audio.screens[screen.screenId].size)}
                  </p>
                  <div className="flex gap-2">
                    {!isLastScreen && (
                      <Button
                        variant={screenData.extendMusicToNext ? 'primary' : 'secondary'}
                        onClick={() => {
                          updateProject({
                            ...currentProject,
                            data: {
                              ...currentProject.data,
                              screens: {
                                ...currentProject.data.screens,
                                [screen.screenId]: {
                                  ...screenData,
                                  extendMusicToNext: !screenData.extendMusicToNext,
                                },
                              },
                            },
                          });
                        }}
                      >
                        {screenData.extendMusicToNext ? '✓ Extends to Next' : 'Extend to Next Screen'}
                      </Button>
                    )}
                    <Button variant="danger" onClick={() => handleDeleteScreenAudio(screen.screenId)}>
                      Remove
                    </Button>
                  </div>
                  {screenData.extendMusicToNext && !isLastScreen && (
                    <p className="text-xs text-blue-600 mt-2">
                      This music will continue playing on the next screen
                    </p>
                  )}
                </div>
              ) : (
                <AudioUpload
                  onUpload={(audio) => handleScreenAudioUpload(screen.screenId, audio)}
                  label={t('editor.music.screenMusic')}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}



