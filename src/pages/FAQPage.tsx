import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { useProject } from '../contexts/ProjectContext';

const faqs = [
  {
    category: 'Basics',
    questions: [
      {
        q: 'What is an interactive HTML gift?',
        a: 'An interactive HTML gift is a self-contained HTML file that plays like a mini experience. It includes photos, music, text, animations, and interactive elements. No app or server needed — just open the file in any browser.',
      },
      {
        q: 'How do I send the HTML gift to someone?',
        a: 'You can share it as a link, QR code, or send the HTML file directly via email, messaging apps, or any file-sharing method. The recipient just opens it in their browser — no installation required.',
      },
    ],
  },
  {
    category: 'Pricing',
    questions: [
      {
        q: 'Is the Pro plan really one-time payment?',
        a: 'Yes. Pay once and export unlimited watermark-free gifts forever.',
      },
      {
        q: 'What does "commercial use" mean?',
        a: 'You can create gifts for clients or sell the experiences you design.',
      },
      {
        q: 'How many gifts can I create?',
        a: 'Unlimited. Create as many as you like and export anytime.',
      },
      {
        q: 'Can I upgrade from Free to Pro later?',
        a: 'Absolutely. Start free and upgrade when you are ready with one click.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'We offer a 14-day money-back guarantee for Pro and Team purchases.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'Major credit cards and popular wallets are supported for secure checkout.',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        q: 'What image formats can I upload?',
        a: 'We support JPG, PNG, and WebP formats. Images are automatically optimized for the best balance of quality and file size.',
      },
      {
        q: 'What audio formats are supported?',
        a: 'MP3 and WAV formats are supported. Audio files are embedded directly into the HTML file.',
      },
      {
        q: 'Can I edit the gift after exporting?',
        a: 'Yes, you can always come back to edit your project and export a new version.',
      },
      {
        q: 'How many screens can I add?',
        a: 'You can add as many screens as you need. Most templates come with 2-7 screens, but you can customize this.',
      },
      {
        q: 'Can I use the editor on my phone?',
        a: 'The editor works best on desktop and tablet devices. Mobile editing is coming soon.',
      },
    ],
  },
];

export function FAQPage() {
  const navigate = useNavigate();
  const { createProject, setCurrentProject } = useProject();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const startNewGift = () => {
    const project = createProject('romantic', 'My interactive gift');
    setCurrentProject(project);
    navigate('/editor');
  };

  const filteredFAQs = faqs.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.questions.length > 0);

  let questionIndex = 0;

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide mb-3">FAQ</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Frequently asked{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">questions</span>
          </h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto mb-8">
            Everything you need to know about Interactive HTML Gifts.
          </p>
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-8">
          {filteredFAQs.map((category) => (
            <div key={category.category}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 grid place-items-center text-white font-bold">
                  ?
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{category.category}</h2>
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
                      className="glass rounded-xl p-4 cursor-pointer"
                    >
                      <summary className="text-lg font-semibold text-slate-900 list-none flex items-center justify-between">
                        <span>{item.q}</span>
                        <span className="text-fuchsia-600 ml-4">{isOpen ? '−' : '+'}</span>
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

