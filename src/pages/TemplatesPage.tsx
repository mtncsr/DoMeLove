import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { useProject } from '../contexts/ProjectContext';
import { Button } from '../components/ui/Button';
import { TEMPLATE_CARDS } from '../data/templates';

const categories = ['All templates', 'Birthday', 'Wedding', 'Anniversary', 'Baby', 'Thank you', 'Other'];

export function TemplatesPage() {
  const navigate = useNavigate();
  const { createProject, setCurrentProject } = useProject();
  const [selectedCategory, setSelectedCategory] = useState('All templates');

  const filteredTemplates =
    selectedCategory === 'All templates'
      ? TEMPLATE_CARDS
      : TEMPLATE_CARDS.filter((t) => t.category === selectedCategory);

  const handleTemplateSelect = (templateId: string, cardId: string, title: string) => {
    // Create a new project and record which card was selected for UI highlighting
    const project = createProject(templateId, `${title} Gift`);
    // Persist selected card id on the project for later highlighting in the editor
    setCurrentProject({
      ...project,
      data: {
        ...project.data,
        selectedTemplateCardId: cardId,
      },
    });
    navigate('/editor');
  };

  const badgeStyles = (badge: string) => {
    if (badge.includes('music')) return 'bg-purple-100 text-purple-700';
    if (badge.includes('emoji') || badge.includes('emojis')) return 'bg-amber-100 text-amber-700';
    return 'bg-fuchsia-100 text-fuchsia-700';
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide mb-3">Templates</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Beautiful templates for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">every</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">occasion</span>
          </h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto">
            Start with a professionally designed template and customize it to make it uniquely yours.
          </p>
        </div>

        {/* LTR/RTL Banner */}
        <div className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-full bg-white shadow-sm text-sm text-slate-700 max-w-fit mx-auto mb-8">
          <span>🌐</span>
          <span>
            All templates support both <strong className="font-semibold px-1">LTR</strong> and{' '}
            <strong className="font-semibold px-1">RTL</strong> languages
          </span>
          <span>↔</span>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-3 flex-wrap justify-center mb-10">
          <span className="text-slate-600">🔽</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="glass rounded-2xl p-5 sm:p-6 border border-white/60 hover:shadow-xl transition-all flex flex-col gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 grid place-items-center text-2xl">
                  {template.icon || '🎁'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 text-xs font-semibold">
                      {template.screens} screens
                    </span>
                    {template.badges?.map((badge) => (
                      <span
                        key={badge}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeStyles(badge)}`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{template.title}</h3>
                  <p className="text-sm text-slate-700 mt-1">{template.description}</p>
                </div>
              </div>

              {template.bullets && (
                <ul className="space-y-2 text-sm text-slate-700">
                  {template.bullets.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-fuchsia-600 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto">
                <Button
                  variant="primary"
                  className="w-full rounded-xl"
                  onClick={() => handleTemplateSelect(template.templateId, template.id, template.title)}
                >
                  Use this template →
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to get started?</h2>
          <p className="text-slate-700 mb-6">Create your first interactive gift in just a few minutes</p>
          <button
            className="gradient-button rounded-full px-6 py-3 text-base font-semibold text-white"
            onClick={() => {
              const project = createProject('romantic', 'My interactive gift');
              setCurrentProject(project);
              navigate('/editor');
            }}
          >
            Start creating now
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

