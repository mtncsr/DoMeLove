import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { useProject } from '../contexts/ProjectContext';
import { useTranslation } from 'react-i18next';
import { getTextDirection } from '../i18n/config';

const examples = [
  { id: 'birthdayMom', screens: 5, features: ['with music', 'emojis'] },
  { id: 'loveStory', screens: 7, features: ['with music'] },
  { id: 'weddingSaveDate', screens: 4, features: ['with music'] },
  { id: 'welcomeBaby', screens: 3, features: ['emojis'] },
  { id: 'thankYouCoach', screens: 2, features: [] },
  { id: 'imSorry', screens: 3, features: [] },
];

export function LiveExamplesPage() {
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
      <main className={`max-w-6xl mx-auto px-4 py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className={`text-center mb-12 ${isRTL ? 'rtl' : ''}`}>
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide mb-3">{t('marketing.liveExamples.eyebrow')}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            {t('marketing.liveExamples.titlePart1')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">{t('marketing.liveExamples.titleHighlight')}</span>
          </h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto">
            {t('marketing.liveExamples.subtitle')}
          </p>
        </div>

        <div className="space-y-8">
          {examples.map((example, idx) => {
            const title = t(`marketing.liveExamples.examples.${example.id}.title`, { defaultValue: example.id });
            const description = t(`marketing.liveExamples.examples.${example.id}.description`, { defaultValue: '' });
            const steps = t(`marketing.liveExamples.examples.${example.id}.steps`, {
              returnObjects: true,
              defaultValue: [],
            }) as string[];
            return (
            <div key={idx} className={`glass rounded-3xl p-6 md:p-8 ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
              <div className={`flex flex-wrap gap-3 mb-4 ${isRTL ? 'justify-end flex-row-reverse' : ''}`}>
                <span className="px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 text-sm font-semibold">
                  {example.screens} {t('marketing.liveExamples.screensSuffix')}
                </span>
                {example.features?.map((feature, fIdx) => (
                  <span
                    key={fIdx}
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      feature === 'with music'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {feature === 'with music' ? t('marketing.liveExamples.featureWithMusic') : t('marketing.liveExamples.featureEmojis')}
                  </span>
                ))}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-700 mb-4">{description}</p>
              {steps.length > 0 && (
                <div className="space-y-3 mb-4">
                  <p className="font-semibold text-slate-900">{t('marketing.liveExamples.whatHappens')}</p>
                  {steps.map((step, sIdx) => (
                    <div key={sIdx} className={`flex gap-3 items-start ${isRTL ? 'flex-row-reverse text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                      <p className="text-slate-700 flex-1">{step}</p>
                      <span className="h-8 w-8 rounded-full bg-fuchsia-100 text-fuchsia-700 grid place-items-center font-bold flex-shrink-0">
                        {sIdx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button
                className="gradient-button rounded-full px-5 py-2 text-sm font-semibold text-white"
                onClick={startNewGift}
              >
                {t('marketing.liveExamples.ctaView')}
              </button>
            </div>
          );
          })}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('marketing.liveExamples.ctaTitle')}</h2>
          <p className="text-slate-700 mb-6">{t('marketing.liveExamples.ctaSubtitle')}</p>
          <button
            className="gradient-button rounded-full px-6 py-3 text-base font-semibold text-white"
            onClick={startNewGift}
          >
            {t('marketing.liveExamples.ctaStart')}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

