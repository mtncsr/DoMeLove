import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { useProject } from '../contexts/ProjectContext';

const examples = [
  {
    title: 'Birthday Surprise for Mom',
    description: 'A heartfelt five-screen journey celebrating 60 years of an amazing life.',
    screens: 5,
    features: ['with music', 'emojis'],
    steps: [
      'A full-screen photo of mom with confetti falling and "Happy 60th Birthday!" appearing letter by letter.',
      'A collage of childhood memories with gentle pan-and-zoom animations.',
      'A voice note from the family layered over a slideshow.',
      'A timeline of special moments with emojis for each milestone.',
      'A final thank-you message with a heart animation and a "Replay" button.',
    ],
  },
  {
    title: 'Our Love Story — 10 Years Together',
    description: 'A romantic seven-screen anniversary gift walking through a decade of love.',
    screens: 7,
    features: ['with music'],
  },
  {
    title: 'Save the Date — Sarah & David',
    description: 'An elegant four-screen wedding invitation that guests actually opened and remembered.',
    screens: 4,
    features: ['with music'],
  },
  {
    title: 'Welcome Baby Mia',
    description: 'A three-screen announcement introducing the newest family member to the world.',
    screens: 3,
    features: ['emojis'],
  },
  {
    title: 'Thank You, Coach Mike',
    description: 'A two-screen gratitude message from the basketball team to their retiring coach.',
    screens: 2,
  },
  {
    title: "I'm Sorry — Please Forgive Me",
    description: 'A three-screen sincere apology that helped mend a broken friendship.',
    screens: 3,
  },
];

export function LiveExamplesPage() {
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
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide mb-3">Live examples</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Real stories,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">real emotions</span>
          </h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto">
            Explore interactive gifts created by real people for real moments. Click any example to experience it yourself.
          </p>
        </div>

        <div className="space-y-8">
          {examples.map((example, idx) => (
            <div key={idx} className="glass rounded-3xl p-6 md:p-8">
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 text-sm font-semibold">
                  {example.screens} screens
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
                    {feature}
                  </span>
                ))}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{example.title}</h3>
              <p className="text-slate-700 mb-4">{example.description}</p>
              {example.steps && (
                <div className="space-y-3 mb-4">
                  <p className="font-semibold text-slate-900">What happens:</p>
                  {example.steps.map((step, sIdx) => (
                    <div key={sIdx} className="flex gap-3">
                      <span className="h-8 w-8 rounded-full bg-fuchsia-100 text-fuchsia-700 grid place-items-center font-bold flex-shrink-0">
                        {sIdx + 1}
                      </span>
                      <p className="text-slate-700">{step}</p>
                    </div>
                  ))}
                </div>
              )}
              <button
                className="gradient-button rounded-full px-5 py-2 text-sm font-semibold text-white"
                onClick={startNewGift}
              >
                View this example →
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to create your own story?</h2>
          <p className="text-slate-700 mb-6">Your moments deserve to be remembered beautifully</p>
          <button
            className="gradient-button rounded-full px-6 py-3 text-base font-semibold text-white"
            onClick={startNewGift}
          >
            Start creating now
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

