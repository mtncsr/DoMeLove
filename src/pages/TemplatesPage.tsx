import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { useProject } from '../contexts/ProjectContext';
import { Button } from '../components/ui/Button';
import { TEMPLATE_CARDS } from '../data/templates';
import { useTranslation } from 'react-i18next';
import { getTextDirection } from '../i18n/config';

export function TemplatesPage() {
  const navigate = useNavigate();
  const { createProject, setCurrentProject } = useProject();
  const { t, i18n } = useTranslation();
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';

  const categories = [
    { id: 'all', label: t('marketing.templates.categories.all') },
    { id: 'Birthday', label: t('marketing.templates.categories.birthday') },
    { id: 'Wedding', label: t('marketing.templates.categories.wedding') },
    { id: 'Anniversary', label: t('marketing.templates.categories.anniversary') },
    { id: 'Baby', label: t('marketing.templates.categories.baby') },
    { id: 'Thank you', label: t('marketing.templates.categories.thankYou') },
    { id: 'Other', label: t('marketing.templates.categories.other') },
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');
  const orderedCategories = isRTL ? [...categories].reverse() : categories;

  const filteredTemplates =
    selectedCategory === 'all'
      ? TEMPLATE_CARDS
      : TEMPLATE_CARDS.filter((t) => t.category === selectedCategory);

  const formatBadge = (badge: string) => {
    if (badge.toLowerCase().includes('music')) return t('marketing.templates.badges.withMusic', { defaultValue: badge });
    if (badge.toLowerCase().includes('emoji')) return t('marketing.templates.badges.emojis', { defaultValue: badge });
    return t(`marketing.templates.badges.${badge}`, { defaultValue: badge });
  };

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
    <div className="min-h-screen bg-white" dir={dir}>
      <Navigation />
      <main className={`max-w-7xl mx-auto px-4 py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
        {/* Header */}
        <div className={`text-center mb-12 ${isRTL ? 'rtl' : ''}`}>
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide mb-3">{t('marketing.templates.eyebrow')}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            {t('marketing.templates.titlePart1')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">{t('marketing.templates.titleHighlight1')}</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{t('marketing.templates.titleHighlight2')}</span>
          </h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto">
            {t('marketing.templates.subtitle')}
          </p>
        </div>

        {/* LTR/RTL Banner */}
        <div className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-full bg-white shadow-sm text-sm text-slate-700 max-w-fit mx-auto mb-8">
          <span>🌐</span>
          <span>
            {t('marketing.templates.rtlBanner')}
          </span>
          <span>↔</span>
        </div>

        {/* Category Filters */}
        <div className={`flex items-center gap-3 flex-wrap justify-center mb-10 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
          <span className="text-slate-600">🔽</span>
          {orderedCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
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
              <div className={`flex items-start gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 grid place-items-center text-2xl">
                    {template.icon || '🎁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`flex flex-wrap items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <h3 className={`text-lg font-bold text-slate-900 ${isRTL ? 'order-2' : 'order-1'}`}>
                        {t(`marketing.templates.cards.${template.id}.title`, { defaultValue: template.title })}
                      </h3>
                      <div className={`flex flex-wrap gap-2 ${isRTL ? 'order-1' : 'order-2'}`}>
                        <span className="px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 text-xs font-semibold">
                          {template.screens} {t('marketing.templates.screensSuffix')}
                        </span>
                        {template.badges?.map((badge) => (
                          <span
                            key={badge}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeStyles(badge)}`}
                          >
                            {formatBadge(badge)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 mt-1">
                      {t(`marketing.templates.cards.${template.id}.description`, { defaultValue: template.description })}
                    </p>
                  </div>
                </div>

              {template.bullets && (
                <ul
                  className={`space-y-2 text-sm text-slate-700 list-disc list-inside ${
                    isRTL ? 'text-right' : 'text-left'
                  }`}
                >
                  {template.bullets.map((item, idx) => (
                    <li key={idx}>
                      {t(`marketing.templates.cards.${template.id}.bullets.${idx}`, { defaultValue: item })}
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
                  {t('marketing.templates.useTemplate')}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('marketing.templates.readyTitle')}</h2>
          <p className="text-slate-700 mb-6">{t('marketing.templates.readySubtitle')}</p>
          <button
            className="gradient-button rounded-full px-6 py-3 text-base font-semibold text-white"
            onClick={() => {
              const project = createProject('romantic', 'My interactive gift');
              setCurrentProject(project);
              navigate('/editor');
            }}
          >
            {t('marketing.templates.ctaStart')}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

