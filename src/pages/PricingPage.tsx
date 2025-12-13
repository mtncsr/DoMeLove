import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { useProject } from '../contexts/ProjectContext';
import { useTranslation } from 'react-i18next';
import { getTextDirection } from '../i18n/config';

export function PricingPage() {
  const navigate = useNavigate();
  const { createProject, setCurrentProject } = useProject();
  const { t, i18n } = useTranslation();
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';

  const planIds = ['free', 'pro', 'team'] as const;
  const plans = planIds.map((id) => ({
    id,
    name: t(`marketing.pricing.plans.${id}.name`, { defaultValue: id }),
    price: t(`marketing.pricing.plans.${id}.price`, { defaultValue: '$0' }),
    period: t(`marketing.pricing.plans.${id}.period`, { defaultValue: '' }),
    description: t(`marketing.pricing.plans.${id}.description`, { defaultValue: '' }),
    cta: t(`marketing.pricing.plans.${id}.cta`, { defaultValue: '' }),
    features: t(`marketing.pricing.plans.${id}.features`, { returnObjects: true, defaultValue: [] }) as string[],
    popular: id === 'pro',
  }));

  const startNewGift = () => {
    const project = createProject('romantic', 'My interactive gift');
    setCurrentProject(project);
    navigate('/editor');
  };

  return (
    <div className="min-h-screen bg-white" dir={dir}>
      <Navigation />
      <main className={`max-w-6xl mx-auto px-4 py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide mb-3">{t('marketing.pricing.eyebrow')}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            {t('marketing.pricing.title')}
          </h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto mb-6">
            {t('marketing.pricing.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-700">
            <span className="px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">{t('marketing.pricing.badgeMoneyBack')}</span>
            <span className="px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">{t('marketing.pricing.badgeSecure')}</span>
            <span className="px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">{t('marketing.pricing.badgeLifetime')}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass rounded-2xl p-6 flex flex-col ${
                plan.popular ? 'border-2 border-fuchsia-300 shadow-xl' : ''
              }`}
            >
              {plan.popular && (
                <span className="self-start px-3 py-1 rounded-full bg-gradient-to-r from-fuchsia-100 to-purple-100 text-fuchsia-700 text-xs font-semibold mb-4">
                  {t('marketing.pricing.mostPopular')}
                </span>
              )}
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                {plan.period && (
                  <span className="text-slate-600 ml-2">{t('marketing.pricing.periodSuffix')}{plan.period}</span>
                )}
              </div>
              <p className="text-slate-700 mb-6">{plan.description}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="text-fuchsia-600">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`${
                  plan.popular ? 'gradient-button text-white' : 'secondary-button'
                } rounded-full px-5 py-3 text-sm font-semibold`}
                onClick={startNewGift}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('marketing.pricing.startFreeTitle')}</h2>
          <p className="text-slate-700 mb-6">{t('marketing.pricing.startFreeSubtitle')}</p>
          <button
            className="gradient-button rounded-full px-6 py-3 text-base font-semibold text-white"
            onClick={startNewGift}
          >
            {t('marketing.pricing.ctaStartFree')}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

