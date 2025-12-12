import type { AudioFile } from '../../types/project';
import { Button } from '../ui/Button';
import { formatFileSize } from '../../utils/audioProcessor';

interface ScreenMusicSelectorProps {
  availableMusic: AudioFile[];
  selectedMusicId?: string;
  onSelectMusic: (music: AudioFile) => void;
  onRemoveMusic: () => void;
  extendMusicToNext?: boolean;
  onToggleExtendMusic?: () => void;
  canExtendMusic?: boolean; // Whether this screen can extend music (not last screen)
}

export function ScreenMusicSelector({
  availableMusic,
  selectedMusicId,
  onSelectMusic,
  onRemoveMusic,
  extendMusicToNext,
  onToggleExtendMusic,
  canExtendMusic = false,
}: ScreenMusicSelectorProps) {
  const selectedMusic = selectedMusicId ? availableMusic.find(m => m.id === selectedMusicId) : undefined;

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">Screen Music</h4>
      
      {selectedMusic ? (
        <div className="bg-white dark:bg-[var(--surface-2)] p-4 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.12)]">
          <p className="text-sm text-gray-600 mb-2">{selectedMusic.filename}</p>
          <p className="text-xs text-gray-500 mb-4">{formatFileSize(selectedMusic.size)}</p>
          <div className="flex gap-2">
            {canExtendMusic && onToggleExtendMusic && (
              <Button
                variant={extendMusicToNext ? 'primary' : 'secondary'}
                onClick={onToggleExtendMusic}
              >
                {extendMusicToNext ? '✓ Extends to Next' : 'Extend to Next Screen'}
              </Button>
            )}
            <Button variant="danger" onClick={onRemoveMusic}>
              Remove
            </Button>
          </div>
          {extendMusicToNext && canExtendMusic && (
            <p className="text-xs text-blue-600 mt-2">
              This music will continue playing on the next screen
            </p>
          )}
        </div>
          ) : (
            <div>
              {availableMusic.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-2">Select music from uploaded files:</p>
                  {availableMusic.map((music) => (
                    <div
                      key={music.id}
                      className="bg-white dark:bg-[var(--surface-2)] p-3 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.12)] cursor-pointer hover:border-blue-500 transition-colors"
                      onClick={() => onSelectMusic(music)}
                    >
                      <p className="text-sm font-medium text-gray-900">{music.filename}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(music.size)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No music files uploaded. Upload music in the Content tab first.
                </p>
              )}
            </div>
          )}
    </div>
  );
}

