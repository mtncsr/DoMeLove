import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { useProject } from '../contexts/ProjectContext';

const steps = [
  {
    number: 1,
    icon: '🎨',
    title: 'Choose a template',
    description: 'Browse our collection of professionally designed templates for every occasion. Each template comes with unique layouts, animations, and color schemes.',
  },
  {
    number: 2,
    icon: '✏️',
    title: 'Make it yours',
    description: 'Add photos, music, text, buttons, and interactive moments. Everything lives in one HTML file.',
  },
  {
    number: 3,
    icon: '🚀',
    title: 'Share instantly',
    description: 'Export a single file you can send as a link, QR, or attachment. No apps, no installs, forever yours.',
  },
];

export function HowItWorksPage() {
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
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide mb-3">Step by step</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            How to create your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">interactive</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">gift</span>
          </h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto">
            From selecting a template to sharing your creation, here's everything you need to know about making memorable interactive HTML gifts.
          </p>
        </div>

        <div className="space-y-12">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white font-bold text-2xl grid place-items-center shadow-lg">
                  {step.number}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
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
            Start creating your gift
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

