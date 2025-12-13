import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { useProject } from '../contexts/ProjectContext';
import { useTranslation } from 'react-i18next';
import { getTextDirection } from '../i18n/config';

export function AboutPage() {
  const navigate = useNavigate();
  const { createProject, setCurrentProject } = useProject();
  const { t, i18n } = useTranslation();
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';

  const startNewGift = () => {
    const project = createProject('romantic', 'My interactive gift');
    setCurrentProject(project);
    navigate('/editor');
  };

  return (
    <div className="min-h-screen bg-white" dir={dir}>
      <Navigation />
      <main className={`max-w-4xl mx-auto px-4 py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="mb-12">
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide mb-3">{t('marketing.about.eyebrow')}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
            {t('marketing.about.titlePart1')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">{t('marketing.about.titleHighlight')}</span>
          </h1>
          <p className="text-lg text-slate-700 leading-relaxed mb-6">
            {t('marketing.about.body1')}
          </p>
          <p className="text-lg text-slate-700 leading-relaxed">
            {t('marketing.about.body2')}
          </p>
        </div>

        <div className="mt-12 card-gradient rounded-3xl p-12 shadow-xl border border-white/60 text-center">
          <div className="text-6xl mb-4">❤️</div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">{t('marketing.about.cardTitle')}</h2>
          <p className="text-lg text-slate-700">
            {t('marketing.about.cardBody')}
          </p>
        </div>

        <div className="mt-12 text-center">
          <button
            className="gradient-button rounded-full px-6 py-3 text-base font-semibold text-white"
            onClick={startNewGift}
          >
            {t('marketing.about.ctaStart')}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

