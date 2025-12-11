import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { GiftBox } from '../components/graphics/GiftBox';

const templateCards = [
  {
    title: 'Birthday surprise',
    description: 'A magical journey through birthday memories with confetti animations and a special video message.',
    tag: '5 screens',
  },
  {
    title: 'Anniversary love story',
    description: 'A romantic timeline of shared moments, from the first date to years of togetherness.',
    tag: '7 screens',
  },
  {
    title: 'Save the date wedding invite',
    description: 'An elegant invitation with venue details, countdown, and RSVP link.',
    tag: '4 screens',
  },
  {
    title: 'New baby welcome',
    description: 'Announce your little one with adorable photos, stats, and heartwarming messages.',
    tag: '3 screens',
  },
  {
    title: 'Thank you from the heart',
    description: 'Express gratitude with a personal message, photos, and a heartfelt video.',
    tag: '2 screens',
  },
  {
    title: 'I am sorry',
    description: 'A sincere apology with a personal promise for the future.',
    tag: '3 screens',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { createProject, setCurrentProject } = useProject();

  const startNewGift = () => {
    const project = createProject('romantic', 'My interactive gift');
    setCurrentProject(project);
    navigate('/editor');
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="pt-10 md:pt-14 lg:pt-16 pb-10 text-center relative">
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-50 via-pink-50 to-white opacity-50" />

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-slate-900 mb-5 max-w-5xl mx-auto">
            Turn your memories into an{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600">
              interactive HTML gift
            </span>{' '}
            in minutes
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-700 max-w-3xl mx-auto mb-6 leading-relaxed">
            Create a fully personalized, self-contained HTML file that plays like a mini experience — with photos, music, text, and interactive elements. No app needed, works anywhere, forever yours.
          </p>
          {/* Features in 2 columns like Base44 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto mb-6 text-sm text-slate-700">
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-full shadow-sm border border-slate-100 hover:border-fuchsia-200 transition-colors">
              <span className="text-xl">🚫</span>
              <span>No app to install</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-full shadow-sm border border-slate-100 hover:border-fuchsia-200 transition-colors">
              <span className="text-xl">📶</span>
              <span>Works on any browser</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-full shadow-sm border border-slate-100 hover:border-fuchsia-200 transition-colors">
              <span className="text-xl">🔒</span>
              <span>Fully offline, privacy friendly</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-full shadow-sm border border-slate-100 hover:border-fuchsia-200 transition-colors">
              <span className="text-xl">🔗</span>
              <span>Share by link, QR or file</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <button
              className="gradient-button rounded-full px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white hover:scale-105 transition-transform shadow-lg flex items-center gap-2 justify-center"
              onClick={startNewGift}
            >
              <span aria-hidden="true">✨</span>
              <span>Start creating your gift</span>
            </button>
            <button
              className="secondary-button rounded-full px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold hover:border-fuchsia-300 transition-colors"
              onClick={() => navigate('/live-examples')}
            >
              ▶ Watch an example
            </button>
          </div>
          
          {/* Gift box graphic */}
          <div className="absolute bottom-0 left-0 opacity-20 -z-10 hidden lg:block">
            <GiftBox className="w-48 h-48" />
          </div>
        </section>

        {/* Templates Preview */}
        <section className="mt-16 sm:mt-20 md:mt-24 py-12">
          <p className="text-xs sm:text-sm font-semibold text-fuchsia-700 uppercase tracking-wide text-center mb-3">Templates</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 text-center mb-4 px-4">
            Beautiful templates for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600">
              every occasion
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 text-center mb-8 max-w-2xl mx-auto px-4">
            Start with a professionally designed template and customize it to make it uniquely yours.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-10">
            {templateCards.slice(0, 6).map((card) => (
              <div
                key={card.title}
                className="glass rounded-2xl p-5 sm:p-6 hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02]"
                onClick={() => navigate('/templates')}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="min-w-14 sm:min-w-16 h-14 sm:h-16 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 grid place-items-center text-xs sm:text-sm font-semibold text-fuchsia-700 flex-shrink-0">
                    {card.tag}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{card.title}</h3>
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{card.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 sm:mt-10">
            <button
              className="secondary-button rounded-full px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold hover:border-fuchsia-300 transition-colors"
              onClick={() => navigate('/templates')}
            >
              View all templates →
            </button>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-16 sm:mt-20 md:mt-24 mb-12 sm:mb-16 relative">
          <div className="glass rounded-3xl p-8 sm:p-10 lg:p-12 text-center relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/50 to-white/50 -z-10" />
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 px-4">
              Ready to create your first interactive gift?
            </h2>
            <p className="text-base sm:text-lg text-slate-700 mb-6 max-w-2xl mx-auto px-4">
              Start making memories that last forever. No installation, no registration required to try the editor.
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <button
                className="gradient-button rounded-full px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white hover:scale-105 transition-transform shadow-lg"
                onClick={startNewGift}
              >
                Start creating now
              </button>
              <button
                className="secondary-button rounded-full px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold hover:border-fuchsia-300 transition-colors"
                onClick={() => navigate('/pricing')}
              >
                See pricing
              </button>
            </div>
            <p className="mt-6 text-xs sm:text-sm text-slate-600">
              Free to try • No credit card needed • Takes just 5 minutes
            </p>
          </div>
          
          {/* Gift box at bottom */}
          <div className="mt-8 flex justify-center lg:justify-start lg:absolute lg:bottom-0 lg:left-0 lg:mt-0">
            <div className="opacity-30 lg:opacity-20">
              <GiftBox className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

