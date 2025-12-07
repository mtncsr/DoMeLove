import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { TemplateMeta } from '../../types/template';
import { buildExportHTML } from '../../utils/exportBuilder';
import { validationService } from '../../services/validationService';
import { Button } from '../ui/Button';
import { ErrorDisplay } from '../ui/ErrorDisplay';

interface ExportStepProps {
  templateMeta: TemplateMeta | null;
}

export function ExportStep({ templateMeta }: ExportStepProps) {
  const { t } = useTranslation();
  const { currentProject } = useProject();
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Array<{ field: string; message: string; section?: string }>>([]);

  if (!currentProject || !templateMeta) return null;

  const handleExport = async () => {
    // Validate first
    const validation = validationService.validateProject(currentProject, templateMeta);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);
    setIsGenerating(true);

    try {
      const html = await buildExportHTML(currentProject, templateMeta);
      
      // Create download
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      a.href = url;
      a.download = `gift_${date}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to generate gift. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('editor.steps.export')}</h2>
      
      {validationErrors.length > 0 && (
        <ErrorDisplay errors={validationErrors} />
      )}

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <p className="text-gray-700 mb-4">
          {t('editor.export.createGift')}
        </p>
        <Button
          onClick={handleExport}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? t('editor.export.generating') : t('editor.export.download')}
        </Button>
      </div>
    </div>
  );
}



