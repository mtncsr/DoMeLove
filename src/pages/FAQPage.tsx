import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { useProject } from '../contexts/ProjectContext';
import { useTranslation } from 'react-i18next';
import { getTextDirection } from '../i18n/config';

export function FAQPage() {
  const navigate = useNavigate();
  const { createProject, setCurrentProject } = useProject();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { t, i18n } = useTranslation();
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';

  const startNewGift = () => {
    const project = createProject('romantic', 'My interactive gift');
    setCurrentProject(project);
    navigate('/editor');
  };

  const faqCategories = (t('marketing.faq.items', { returnObjects: true, defaultValue: [] }) as Array<{
    category: string;
    questions: Array<{ q: string; a: string }>;
  }>).map((cat) => ({
    ...cat,
    questions:
      cat.questions?.filter(
        (q) =>
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
      ) ?? [],
  })).filter((cat) => cat.questions.length > 0);

  let questionIndex = 0;

  return (
    <div className="min-h-screen bg-white" dir={dir}>
      <Navigation />
      <main className={`max-w-4xl mx-auto px-4 py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className={`text-center mb-12 ${isRTL ? 'rtl' : ''}`}>
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide mb-3">{t('marketing.faq.eyebrow')}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            {t('marketing.faq.titlePart1')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">{t('marketing.faq.titleHighlight')}</span>
          </h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto mb-8">
            {t('marketing.faq.subtitle')}
          </p>
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder={t('marketing.faq.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-8">
          {faqCategories.map((category) => (
            <div key={category.category}>
              <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse justify-end' : ''}`} dir={dir}>
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 grid place-items-center text-white font-bold flex-shrink-0">
                  ?
                </div>
                <h2 className={`text-2xl font-bold text-slate-900 ${isRTL ? 'text-right' : ''}`}>{category.category}</h2>
              </div>
              <div className="space-y-3">
                {category.questions.map((item) => {
                  const currentIndex = questionIndex++;
                  const isOpen = openIndex === currentIndex;
                  return (
                    <details
                      key={item.q}
                      open={isOpen}
                      onToggle={(e) => {
                        setOpenIndex((e.target as HTMLDetailsElement).open ? currentIndex : null);
                      }}
                      className={`glass rounded-xl p-4 cursor-pointer ${isRTL ? 'text-right' : ''}`}
                    >
                      <summary className="text-lg font-semibold text-slate-900 list-none flex items-center justify-between">
                        <span>{item.q}</span>
                        <span className={`${isRTL ? 'mr-4' : 'ml-4'} text-fuchsia-600`}>{isOpen ? '−' : '+'}</span>
                      </summary>
                      <p className="mt-3 text-slate-700 leading-relaxed">{item.a}</p>
                    </details>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('marketing.faq.startFreeTitle')}</h2>
          <p className="text-slate-700 mb-6">{t('marketing.faq.startFreeSubtitle')}</p>
          <button
            className="gradient-button rounded-full px-6 py-3 text-base font-semibold text-white"
            onClick={startNewGift}
          >
            {t('marketing.faq.ctaStartFree')}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

