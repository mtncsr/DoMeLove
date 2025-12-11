import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { useProject } from '../contexts/ProjectContext';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying the editor and creating personal gifts.',
    cta: 'Get started free',
    features: ['Watermarked exports', 'All templates', 'Basic features'],
  },
  {
    name: 'One-Time Pro',
    price: '$29',
    period: 'one-time',
    description: 'Pay once, create watermark-free gifts forever. No subscription.',
    cta: 'Unlock Pro forever',
    popular: true,
    features: ['No watermarks', 'All templates', 'All features', 'Lifetime access'],
  },
  {
    name: 'Team',
    price: '$79',
    period: 'one-time',
    description: 'For professionals and businesses creating gifts for clients.',
    cta: 'Start team trial',
    features: ['Commercial use', 'Priority support', 'Team features', 'All Pro features'],
  },
];

export function PricingPage() {
  const navigate = useNavigate();
  const { createProject, setCurrentProject } = useProject();

  const startNewGift = () => {
    const project = createProject('romantic', 'My interactive gift');
    setCurrentProject(project);
    navigate('/editor');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide mb-3">Pricing</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Simple,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">honest pricing</span>
          </h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto mb-6">
            No subscription required. Pay once, own forever. Start free and upgrade when you're ready.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-700">
            <span className="px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">✅ 14-day money back</span>
            <span className="px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">🔒 Secure payment</span>
            <span className="px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">♾️ Lifetime access</span>
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
                  ★ Most Popular
                </span>
              )}
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                {plan.period && (
                  <span className="text-slate-600 ml-2">/{plan.period}</span>
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
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Start creating for free today</h2>
          <p className="text-slate-700 mb-6">No credit card required. Upgrade whenever you're ready.</p>
          <button
            className="gradient-button rounded-full px-6 py-3 text-base font-semibold text-white"
            onClick={startNewGift}
          >
            Get started free
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

