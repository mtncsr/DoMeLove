import React, { useState } from 'react';
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
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Preview & Export</h2>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Export
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'preview' ? (
        <PreviewStep templateMeta={templateMeta} />
      ) : (
        <ExportStep templateMeta={templateMeta} />
      )}
    </div>
  );
}

