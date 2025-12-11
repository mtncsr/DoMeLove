import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { useProject } from '../contexts/ProjectContext';

const allTemplates = [
  { id: 'birthday', title: 'Birthday Surprise', description: 'A magical journey through birthday memories with confetti animations and a special video message.', screens: 5, category: 'Birthday' },
  { id: 'anniversary', title: 'Anniversary Love Story', description: 'A romantic timeline of shared moments, from the first date to years of togetherness.', screens: 7, category: 'Anniversary' },
  { id: 'wedding', title: 'Save the Date Wedding Invite', description: 'An elegant invitation with venue details, countdown, and RSVP link.', screens: 4, category: 'Wedding' },
  { id: 'baby', title: 'New Baby Welcome', description: 'Announce your little one with adorable photos, stats, and heartwarming messages.', screens: 3, category: 'Baby' },
  { id: 'thank-you', title: 'Thank You from the Heart', description: 'Express gratitude with a personal message, photos, and a heartfelt video.', screens: 2, category: 'Thank you' },
  { id: 'sorry', title: 'I am Sorry', description: 'A sincere apology with a personal message and promise for the future.', screens: 3, category: 'Other' },
];

const categories = ['All templates', 'Birthday', 'Wedding', 'Anniversary', 'Baby', 'Thank you', 'Other'];

export function TemplatesPage() {
  const navigate = useNavigate();
  const { createProject, setCurrentProject } = useProject();
  const [selectedCategory, setSelectedCategory] = useState('All templates');

  const filteredTemplates = selectedCategory === 'All templates'
    ? allTemplates
    : allTemplates.filter(t => t.category === selectedCategory);

  const handleTemplateSelect = (templateId: string) => {
    const project = createProject(templateId, `${allTemplates.find(t => t.id === templateId)?.title} Gift`);
    setCurrentProject(project);
    navigate('/editor');
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
          <span>All templates support both <strong className="font-semibold px-1">LTR</strong> and <strong className="font-semibold px-1">RTL</strong> languages</span>
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
              className="glass rounded-2xl p-6 hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => handleTemplateSelect(template.id)}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="min-w-20 h-20 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 grid place-items-center text-sm font-semibold text-fuchsia-700 flex-shrink-0">
                  {template.screens} screens
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-fuchsia-700 transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-slate-700 leading-relaxed text-sm">{template.description}</p>
                </div>
              </div>
              <button className="w-full mt-4 gradient-button rounded-xl px-4 py-2 text-sm font-semibold text-white">
                Use this template →
              </button>
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

