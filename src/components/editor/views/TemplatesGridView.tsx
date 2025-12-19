import { useEditorNavigation } from '../../../contexts/EditorNavigationContext';
import { NEW_TEMPLATES } from '../../../data/newTemplates';

export function TemplatesGridView() {
  const { navigate } = useEditorNavigation();

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-slate-100">Choose a Template</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {NEW_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => navigate({ type: 'template-details', templateId: template.id })}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 border border-slate-200 dark:border-slate-700 text-left"
          >
            <div className="flex items-center gap-3 mb-3">
              {template.icon && <span className="text-3xl">{template.icon}</span>}
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{template.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{template.screenCount} screens</p>
              </div>
            </div>
            <ul className="space-y-1.5 mt-4">
              {template.bullets.map((bullet, idx) => (
                <li key={idx} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                  <span className="text-fuchsia-500 mt-0.5">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );
}
