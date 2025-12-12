import type { Project, VideoData } from '../../types/project';
import type { TemplateMeta } from '../../types/template';
import { Tooltip } from '../ui/Tooltip';

interface ScreenVideoSelectorProps {
  videos: VideoData[];
  selectedVideoId?: string;
  onSelectVideo: (videoId: string) => void;
  onClearVideo: () => void;
  project: Project;
  templateMeta?: TemplateMeta | null;
  currentScreenId?: string;
}

export function ScreenVideoSelector({
  videos,
  selectedVideoId,
  onSelectVideo,
  onClearVideo,
  project,
  templateMeta,
  currentScreenId,
}: ScreenVideoSelectorProps) {
  const selected = videos.find((v) => v.id === selectedVideoId);

  const getScreensForVideo = (videoId: string): string[] => {
    const ids: string[] = [];
    const validVideoIds = new Set(videos.map((v) => v.id));
    if (!validVideoIds.has(videoId)) return ids;

    const validScreens = templateMeta ? new Set(templateMeta.screens.map((s) => s.screenId)) : null;

    Object.entries(project.data.screens).forEach(([sid, data]) => {
      if (currentScreenId && sid === currentScreenId) return;
      if (validScreens && !validScreens.has(sid)) return;
      if (data.mediaMode === 'video' && data.videoId === videoId) {
        ids.push(sid);
      }
    });
    return ids;
  };

  const getScreenDisplayName = (screenId: string): string => {
    const displayNames = project.data.screenDisplayNames || {};
    if (displayNames[screenId]) return displayNames[screenId];
    return screenId;
  };

  return (
    <div className="space-y-4">
      {selected ? (
        <div className="bg-slate-50 dark:bg-[var(--surface-3)] border border-slate-200 dark:border-[rgba(255,255,255,0.12)] rounded-lg p-4 flex gap-3 items-center">
          <div className="w-28 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
            {selected.posterDataUrl ? (
              <img src={selected.posterDataUrl} alt={selected.filename} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-xs text-slate-500">No poster</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{selected.filename}</p>
            <p className="text-xs text-slate-600">
              {(selected.size / (1024 * 1024)).toFixed(1)} MB · {selected.duration.toFixed(1)}s · {selected.mime}
            </p>
          </div>
          <button
            onClick={onClearVideo}
            className="text-rose-600 text-sm font-semibold hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-600">Select a video for this screen.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {videos.map((video) => {
          const assigned = getScreensForVideo(video.id);
          const isUsed = assigned.length > 0;
          return (
            <div
              key={video.id}
              className="relative bg-white dark:bg-[var(--surface-2)] border border-slate-200 dark:border-[rgba(255,255,255,0.12)] rounded-lg p-3 cursor-pointer hover:border-fuchsia-400 transition-colors"
              onClick={() => onSelectVideo(video.id)}
            >
              {isUsed && (
                <Tooltip
                  content={`Also used in: ${assigned.map(getScreenDisplayName).join(', ')}`}
                  position="top"
                >
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] px-2 py-1 rounded">
                    Used
                  </div>
                </Tooltip>
              )}
              <div className="w-full h-32 rounded-md overflow-hidden bg-gray-100 mb-2">
                {video.posterDataUrl ? (
                  <img src={video.posterDataUrl} alt={video.filename} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-xs text-slate-500">No poster</div>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900 truncate">{video.filename}</p>
              <p className="text-xs text-slate-600">
                {(video.size / (1024 * 1024)).toFixed(1)} MB · {video.duration.toFixed(1)}s
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}


