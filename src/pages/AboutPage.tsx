import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { useProject } from '../contexts/ProjectContext';

export function AboutPage() {
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
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-12">
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide mb-3">About</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
            Where{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">art meets code</span>
          </h1>
          <p className="text-lg text-slate-700 leading-relaxed mb-6">
            Interactive HTML Gifts was born from a simple belief: the most meaningful moments in life deserve more than a text message or a generic e-card. They deserve experiences that feel personal, that tell a story, that make people feel something.
          </p>
          <p className="text-lg text-slate-700 leading-relaxed">
            This is a tool built by an artist who learned to code — not a tech company that forgot about the human side. Every design decision, every feature, every pixel is guided by one question: <em>will this help someone express their love better?</em>
          </p>
        </div>

        <div className="mt-12 card-gradient rounded-3xl p-12 shadow-xl border border-white/60 text-center">
          <div className="text-6xl mb-4">❤️</div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for moments that matter</h2>
          <p className="text-lg text-slate-700">
            Every interaction, every animation, every detail is crafted to help you create something truly special.
          </p>
        </div>

        <div className="mt-12 text-center">
          <button
            className="gradient-button rounded-full px-6 py-3 text-base font-semibold text-white"
            onClick={startNewGift}
          >
            Start creating
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

