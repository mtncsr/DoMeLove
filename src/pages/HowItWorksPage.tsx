import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { useProject } from '../contexts/ProjectContext';
import { useTranslation } from 'react-i18next';
import { getTextDirection } from '../i18n/config';

export function HowItWorksPage() {
  const navigate = useNavigate();
  const { createProject, setCurrentProject } = useProject();
  const { t, i18n } = useTranslation();
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';

  const steps = [
    {
      number: 1,
      icon: '🎨',
      title: t('marketing.howItWorks.steps.chooseTemplateTitle'),
      description: t('marketing.howItWorks.steps.chooseTemplateDescription'),
    },
    {
      number: 2,
      icon: '✏️',
      title: t('marketing.howItWorks.steps.makeItYoursTitle'),
      description: t('marketing.howItWorks.steps.makeItYoursDescription'),
    },
    {
      number: 3,
      icon: '🚀',
      title: t('marketing.howItWorks.steps.shareTitle'),
      description: t('marketing.howItWorks.steps.shareDescription'),
    },
  ];

  const startNewGift = () => {
    const project = createProject('romantic', 'My interactive gift');
    setCurrentProject(project);
    navigate('/editor');
  };

  return (
    <div className="min-h-screen bg-white" dir={dir}>
      <Navigation />
      <main className={`max-w-6xl mx-auto px-4 py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className={`text-center mb-12 ${isRTL ? 'rtl' : ''}`}>
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide mb-3">{t('marketing.howItWorks.eyebrow')}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            {t('marketing.howItWorks.titlePart1')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">{t('marketing.howItWorks.titleHighlight1')}</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{t('marketing.howItWorks.titleHighlight2')}</span>
          </h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto">
            {t('marketing.howItWorks.subtitle')}
          </p>
        </div>

        <div className="space-y-12">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex gap-6 items-start ${isRTL ? 'flex-row-reverse text-right' : ''}`}
            >
              <div className={`flex-shrink-0 ${isRTL ? 'order-2' : 'order-1'}`}>
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white font-bold text-2xl grid place-items-center shadow-lg">
                  {step.number}
                </div>
              </div>
              <div className={`flex-1 ${isRTL ? 'order-1 text-right' : 'order-2'}`}>
                <div className={`flex items-center gap-3 mb-3 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <span className="text-3xl">{step.icon}</span>
                  <h2 className="text-3xl font-bold text-slate-900">{step.title}</h2>
                </div>
                <p className="text-lg text-slate-700 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button
            className="gradient-button rounded-full px-6 py-3 text-base font-semibold text-white"
            onClick={startNewGift}
          >
            {t('marketing.howItWorks.cta')}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

