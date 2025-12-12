import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PreviewStep } from './PreviewStep';
import { ExportStep } from './ExportStep';
import type { TemplateMeta } from '../../types/template';

interface PreviewExportStepProps {
  templateMeta: TemplateMeta | null;
}

export function PreviewExportStep({ templateMeta }: PreviewExportStepProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'export'>('preview');
  const { t } = useTranslation();
  

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">{t('editor.steps.previewExport')}</h2>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-fuchsia-500 text-fuchsia-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('editor.preview.preview')}
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-fuchsia-500 text-fuchsia-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('editor.preview.export')}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="glass rounded-2xl p-4 sm:p-6 border border-white/60 dark:border-[rgba(255,255,255,0.08)] dark:bg-[var(--surface-2)] animate-fade-in">
      {activeTab === 'preview' ? (
        <PreviewStep templateMeta={templateMeta} />
      ) : (
        <ExportStep templateMeta={templateMeta} />
      )}
      </div>
    </div>
  );
}
