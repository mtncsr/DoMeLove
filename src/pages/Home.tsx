import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { LanguageSelector } from '../components/ui/LanguageSelector';

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

const howSteps = [
  {
    title: 'Choose a template',
    text: 'Pick a beautiful starting point for your moment — birthday, anniversary, wedding, baby, and more.',
  },
  {
    title: 'Make it yours',
    text: 'Add photos, music, text, buttons, and interactive moments. Everything lives in one HTML file.',
  },
  {
    title: 'Share instantly',
    text: 'Export a single file you can send as a link, QR, or attachment. No apps, no installs, forever yours.',
  },
];

const pricing = [
  {
    name: 'Free',
    price: '$0',
    note: 'Perfect for trying the editor and creating personal gifts.',
    cta: 'Get started free',
  },
  {
    name: 'One-Time Pro',
    price: '$29',
    note: 'Pay once, create watermark-free gifts forever. No subscription.',
    cta: 'Unlock Pro forever',
    popular: true,
  },
  {
    name: 'Team',
    price: '$79',
    note: 'For professionals and businesses creating gifts for clients.',
    cta: 'Start team trial',
  },
];

const faqs = [
  {
    q: 'Is the Pro plan really one-time payment?',
    a: 'Yes. Pay once and export unlimited watermark-free gifts forever.',
  },
  {
    q: 'What does “commercial use” mean?',
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
];

export function Home() {
  const navigate = useNavigate();
  const { createProject, setCurrentProject } = useProject();

  const startNewGift = () => {
    const project = createProject('romantic', 'My interactive gift');
      setCurrentProject(project);
      navigate('/editor');
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen section-shell text-left text-slate-900">
      <div className="absolute inset-0 pointer-events-none" />

      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-white/60">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
              ✨
            </div>
            <div className="font-semibold text-lg">Interactive HTML Gifts</div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <button onClick={() => scrollTo('home')} className="hover:text-fuchsia-700">Home</button>
            <button onClick={() => scrollTo('how')} className="hover:text-fuchsia-700">How it works</button>
            <button onClick={() => scrollTo('templates')} className="hover:text-fuchsia-700">Templates</button>
            <button onClick={() => scrollTo('examples')} className="hover:text-fuchsia-700">Live examples</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-fuchsia-700">Pricing</button>
            <button onClick={() => scrollTo('faq')} className="hover:text-fuchsia-700">FAQ</button>
            <button onClick={() => scrollTo('about')} className="hover:text-fuchsia-700">About</button>
            <button onClick={() => scrollTo('contact')} className="hover:text-fuchsia-700">Contact</button>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSelector value="en" onChange={() => {}} subtle />
            <button
              className="hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-white border border-slate-200 hover:border-fuchsia-300 shadow-sm"
              onClick={() => scrollTo('examples')}
            >
              ▶ View examples
            </button>
            <button
              className="gradient-button rounded-full px-4 py-2 text-sm font-semibold"
              onClick={startNewGift}
            >
              Start creating
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-24">
        {/* Hero */}
        <section id="home" className="pt-12 md:pt-16">
          <div className="badge inline-flex items-center gap-2 px-4 py-2 pill text-sm font-semibold shadow-sm">
            ✨ Create magical moments
          </div>
          <h1 className="mt-6 text-4xl md:text-5xl font-extrabold leading-tight text-slate-900">
            Turn your memories into an{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">
              interactive HTML gift
            </span>{' '}
            in minutes
          </h1>
          <p className="mt-4 text-lg text-slate-700 max-w-3xl">
            Create a fully personalized, self-contained HTML file that plays like a mini experience — with photos, music, text, and interactive elements. No app needed, works anywhere, forever yours.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-700">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
              📱 No app to install
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
              🌐 Works on any browser
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
              🔒 Fully offline, privacy friendly
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
              🔗 Share by link, QR or file
            </div>
        </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              className="gradient-button pill px-6 py-3 text-base font-semibold"
              onClick={startNewGift}
            >
              Start creating your gift
            </button>
            <button
              className="secondary-button pill px-6 py-3 text-base font-semibold"
              onClick={() => scrollTo('examples')}
                  >
              Watch an example
            </button>
                </div>
          <div className="mt-12 card-gradient rounded-3xl p-6 shadow-xl border border-white/60">
            <div className="h-64 md:h-80 w-full rounded-2xl bg-gradient-to-br from-purple-500/30 via-white to-fuchsia-400/30 grid place-items-center text-2xl text-slate-800 font-semibold">
              Your interactive gift preview
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mt-20">
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide">Step by step</p>
          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            How to create your interactive gift
          </h2>
          <p className="mt-3 text-lg text-slate-700 max-w-3xl">
            From selecting a template to sharing your creation, here is everything you need to know about making memorable interactive HTML gifts.
          </p>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {howSteps.map((step, index) => (
              <div key={step.title} className="glass rounded-2xl p-6 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 pill bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white font-bold grid place-items-center">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                </div>
                <p className="text-slate-700">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Templates */}
        <section id="templates" className="mt-20">
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide">Templates</p>
          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            Beautiful templates for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">
              every occasion
            </span>
          </h2>
          <p className="mt-3 text-lg text-slate-700 max-w-3xl">
            Start with a professionally designed template and customize it to make it uniquely yours.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full bg-white shadow-sm text-sm text-slate-700">
            🌐 All templates support both <strong className="font-semibold px-1">LTR</strong> and{' '}
            <strong className="font-semibold px-1">RTL</strong> languages
          </div>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {templateCards.map((card) => (
              <div key={card.title} className="glass rounded-2xl p-5 flex gap-4">
                <div className="min-w-16 h-16 pill bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 grid place-items-center text-sm font-semibold text-fuchsia-700">
                  {card.tag}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-slate-700 leading-relaxed">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <button
              className="secondary-button pill px-5 py-3 text-sm font-semibold"
              onClick={() => scrollTo('examples')}
            >
              View all examples
            </button>
          </div>
        </section>

        {/* Live examples */}
        <section id="examples" className="mt-20">
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide">Live examples</p>
          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            Real stories, <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">real emotions</span>
          </h2>
          <p className="mt-3 text-lg text-slate-700 max-w-3xl">
            Explore interactive gifts created by real people for real moments. Click any example to experience it yourself.
          </p>
          <div className="mt-8 glass rounded-3xl p-6 md:p-8 flex flex-col gap-4">
            <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
              <span className="px-3 py-1 pill bg-fuchsia-100 text-fuchsia-700">5 screens</span>
              <span className="px-3 py-1 pill bg-purple-100 text-purple-700">with music</span>
              <span className="px-3 py-1 pill bg-amber-100 text-amber-700">emojis</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Birthday Surprise for Mom</h3>
            <p className="text-slate-700 text-base">
              A heartfelt five-screen journey celebrating 60 years of an amazing life.
            </p>
            <div className="space-y-3 text-slate-700">
              <div className="flex gap-3">
                <span className="pill h-8 w-8 bg-fuchsia-100 text-fuchsia-700 grid place-items-center font-bold">1</span>
                <p>A full-screen photo of mom with confetti falling and “Happy 60th Birthday!” appearing letter by letter.</p>
              </div>
              <div className="flex gap-3">
                <span className="pill h-8 w-8 bg-fuchsia-100 text-fuchsia-700 grid place-items-center font-bold">2</span>
                <p>A collage of childhood memories with gentle pan-and-zoom animations.</p>
              </div>
              <div className="flex gap-3">
                <span className="pill h-8 w-8 bg-fuchsia-100 text-fuchsia-700 grid place-items-center font-bold">3</span>
                <p>A voice note from the family layered over a slideshow.</p>
              </div>
              <div className="flex gap-3">
                <span className="pill h-8 w-8 bg-fuchsia-100 text-fuchsia-700 grid place-items-center font-bold">4</span>
                <p>A timeline of special moments with emojis for each milestone.</p>
              </div>
              <div className="flex gap-3">
                <span className="pill h-8 w-8 bg-fuchsia-100 text-fuchsia-700 grid place-items-center font-bold">5</span>
                <p>A final thank-you message with a heart animation and a “Replay” button.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="gradient-button pill px-5 py-3 text-sm font-semibold" onClick={startNewGift}>
                Start creating
              </button>
              <button className="secondary-button pill px-5 py-3 text-sm font-semibold" onClick={() => scrollTo('templates')}>
                View this example
              </button>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mt-20">
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide">Pricing</p>
          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">honest pricing</span>
          </h2>
          <p className="mt-3 text-lg text-slate-700 max-w-3xl">
            No subscription required. Pay once, own forever. Start free and upgrade when you are ready.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-700">
            <span className="px-4 py-2 pill bg-white border border-slate-200 shadow-sm">✅ 14-day money back</span>
            <span className="px-4 py-2 pill bg-white border border-slate-200 shadow-sm">🔒 Secure payment</span>
            <span className="px-4 py-2 pill bg-white border border-slate-200 shadow-sm">♾️ Lifetime access</span>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`glass rounded-2xl p-6 flex flex-col gap-4 border ${
                  plan.popular ? 'border-fuchsia-200 shadow-xl' : 'border-transparent'
                }`}
              >
                {plan.popular && (
                  <span className="self-start px-3 py-1 pill bg-fuchsia-100 text-fuchsia-700 text-xs font-semibold">
                    Most popular
                  </span>
                )}
                <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                <div className="text-4xl font-extrabold text-slate-900">{plan.price}</div>
                <p className="text-slate-700">{plan.note}</p>
                <button
                  className={`${plan.popular ? 'gradient-button text-white' : 'secondary-button'} pill px-5 py-3 text-sm font-semibold`}
                  onClick={startNewGift}
                  >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mt-20">
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide">FAQ</p>
          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            Frequently asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">questions</span>
          </h2>
          <p className="mt-3 text-lg text-slate-700 max-w-3xl">
            Everything you need to know about Interactive HTML Gifts.
          </p>
          <div className="mt-8 space-y-4">
            {faqs.map((item) => (
              <details key={item.q} className="glass rounded-xl p-4">
                <summary className="text-lg font-semibold text-slate-900 cursor-pointer">{item.q}</summary>
                <p className="mt-2 text-slate-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* About */}
        <section id="about" className="mt-20">
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide">About</p>
          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">art meets code</span>
          </h2>
          <p className="mt-3 text-lg text-slate-700 max-w-4xl leading-relaxed">
            Interactive HTML Gifts was born from a simple belief: the most meaningful moments in life deserve more than a text message or a generic e-card. They deserve experiences that feel personal, that tell a story, that make people feel something.
          </p>
          <p className="mt-4 text-lg text-slate-700 max-w-4xl leading-relaxed">
            This is a tool built by an artist who learned to code — not a tech company that forgot about the human side. Every design decision, every feature, every pixel is guided by one question: will this help someone express their love better?
          </p>
          <div className="mt-8 card-gradient rounded-3xl p-10 shadow-xl border border-white/60 grid place-items-center text-3xl font-semibold text-slate-800">
            Built for moments that matter ❤️
        </div>
        </section>

        {/* Contact */}
        <section id="contact" className="mt-20 mb-10 glass rounded-3xl p-8 border border-white/70">
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide">Contact</p>
          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            Let&apos;s talk
          </h2>
          <p className="mt-2 text-lg text-slate-700 max-w-3xl">
            Have a question, idea, or just want to say hello? We would love to hear from you.
          </p>
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
              placeholder="Your name"
            />
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
              placeholder="Email address"
            />
          </div>
          <div className="mt-4">
            <select className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-fuchsia-400 focus:outline-none text-slate-700">
              <option>Select a reason...</option>
              <option>Start a project</option>
              <option>Ask a question</option>
              <option>Partnership</option>
              <option>Something else</option>
            </select>
          </div>
          <div className="mt-4">
            <textarea
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
              rows={4}
              placeholder="Tell us how we can help you..."
            />
        </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="gradient-button pill px-6 py-3 text-sm font-semibold" onClick={startNewGift}>
              Start creating
            </button>
            <button className="secondary-button pill px-6 py-3 text-sm font-semibold">
              Send message
            </button>
      </div>
        </section>
      </main>
    </div>
  );
}
