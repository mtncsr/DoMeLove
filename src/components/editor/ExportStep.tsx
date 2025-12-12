import { useState } from 'react';
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
  const [validationWarnings, setValidationWarnings] = useState<Array<{ field: string; message: string; section?: string }>>([]);
  const [showWarnings, setShowWarnings] = useState(true);

  if (!currentProject || !templateMeta) return null;

  const handleExport = async () => {
    // Validate first
    const validation = validationService.validateProject(currentProject, templateMeta);
    
    // Show errors (blocking) and warnings (non-blocking)
    setValidationErrors(validation.errors || []);
    setValidationWarnings(validation.warnings || []);
    
    // Only block if there are actual errors (not warnings)
    if (!validation.isValid) {
      return;
    }

    // Warnings don't block export - proceed with generation
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
      alert(t('editor.export.exportFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('editor.steps.export')}</h2>
      
      {validationErrors.length > 0 && (
        <div className="mb-4">
          <ErrorDisplay errors={validationErrors} />
          <p className="text-red-700 text-sm mt-2">
            {t('editor.export.fixErrorsBeforeExport')}
          </p>
        </div>
      )}

      {validationWarnings.length > 0 && showWarnings && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-yellow-800 font-semibold">{t('editor.export.recommendations')}</h3>
            <button
              onClick={() => setShowWarnings(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              ×
            </button>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {validationWarnings.map((warning, index) => (
              <li key={index} className="text-yellow-700 text-sm">
                {warning.message}
                {warning.section && (
                  <span className="text-yellow-600 ml-2">({warning.section})</span>
                )}
              </li>
            ))}
          </ul>
          <p className="text-yellow-800 text-sm mt-3 font-medium">
            {t('editor.export.recommendationsNote')}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-[var(--surface-2)] p-6 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.12)]">
        <p className="text-gray-700 mb-4">
          {t('editor.export.createGift')}
        </p>
        <Button
          onClick={handleExport}
          disabled={isGenerating || validationErrors.length > 0}
          className="w-full"
        >
          {isGenerating ? t('editor.export.generating') : t('editor.export.download')}
        </Button>
        {validationErrors.length === 0 && validationWarnings.length > 0 && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            {t('editor.export.exportAvailable')}
          </p>
        )}
      </div>
    </div>
  );
}
