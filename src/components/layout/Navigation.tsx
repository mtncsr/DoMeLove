import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Languages } from 'lucide-react';
import { LanguageSelector } from '../ui/LanguageSelector';
import { useTranslation } from 'react-i18next';
import { getTextDirection } from '../../i18n/config';

export function Navigation() {
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { path: '/', label: t('marketing.nav.home') },
    { path: '/how-it-works', label: t('marketing.nav.howItWorks') },
    { path: '/templates', label: t('marketing.nav.templates') },
    { path: '/live-examples', label: t('marketing.nav.liveExamples') },
    { path: '/pricing', label: t('marketing.nav.pricing') },
    { path: '/faq', label: t('marketing.nav.faq') },
    { path: '/about', label: t('marketing.nav.about') },
  ];
  const orderedNavLinks = isRTL ? [...navLinks].reverse() : navLinks;
  const logoOrder = 'order-1';
  const navOrder = 'order-2';
  const startOrder = 'order-3';
  const actionsOrder = 'order-4';

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setLanguageMenuOpen(false);
      }
    };

    if (languageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [languageMenuOpen]);

  return (
    <header dir={dir} className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link to="/" className={`flex items-center gap-2 sm:gap-3 shrink-0 ${isRTL ? 'flex-row-reverse text-right' : ''} ${logoOrder}`}>
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg text-lg sm:text-xl">
              ✨
            </div>
            <div className="font-semibold text-lg sm:text-xl bg-gradient-to-r from-fuchsia-600 to-purple-700 bg-clip-text text-transparent hidden sm:block">
              LoveMeDo
            </div>
            <div className="font-semibold text-sm bg-gradient-to-r from-fuchsia-600 to-purple-700 bg-clip-text text-transparent sm:hidden">
              LoveMeDo
            </div>
          </Link>

          {/* Desktop Navigation - Show all tabs */}
          <nav className={`hidden lg:flex flex-1 items-center justify-center gap-3 xl:gap-4 2xl:gap-5 ${isRTL ? 'flex-row-reverse' : ''} ${navOrder}`}>
            {orderedNavLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm sm:text-base font-semibold transition-colors whitespace-nowrap ${
                  location.pathname === link.path
                    ? 'text-fuchsia-700 font-semibold'
                    : 'text-slate-700 hover:text-fuchsia-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Start creating */}
          <Link
            to="/editor"
            className={`gradient-button rounded-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white transition-all hover:shadow-xl whitespace-nowrap flex items-center gap-1.5 ${startOrder}`}
          >
            <span aria-hidden="true">✨</span>
            <span>{t('marketing.nav.startCreating')}</span>
          </Link>

          {/* Profile and Language selector */}
          <div className={`hidden lg:flex items-center gap-2 ${actionsOrder}`}>
            <Link
              to="/profile"
              className="inline-flex items-center justify-center rounded-full p-2.5 bg-white border border-slate-200 hover:border-fuchsia-300 shadow-sm transition-colors"
              title={t('marketing.nav.profile')}
            >
              <span className="text-slate-700 text-lg">👤</span>
            </Link>
            <div className="relative" ref={languageMenuRef}>
              <button
                onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                className="inline-flex items-center justify-center rounded-full p-2.5 bg-white border border-slate-200 hover:border-fuchsia-300 shadow-sm transition-colors"
                title={t('marketing.nav.language') || 'Language'}
                aria-label="Select language"
              >
                <Languages className="w-5 h-5 text-slate-600" />
              </button>
              {languageMenuOpen && (
                <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-2 bg-white rounded-lg shadow-lg border border-slate-200 p-2 z-50 min-w-[120px]`}>
                  <LanguageSelector value={i18n.language} onChange={(lang) => {
                    i18n.changeLanguage(lang);
                    setLanguageMenuOpen(false);
                  }} subtle />
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-slate-700"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 py-4">
          <nav className="flex flex-col gap-2">
            {orderedNavLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-fuchsia-700 font-semibold bg-fuchsia-50'
                    : 'text-slate-700 hover:text-fuchsia-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 py-2 flex items-center gap-2 sm:hidden">
              <Languages className="w-4 h-4 text-slate-600" />
              <LanguageSelector value={i18n.language} onChange={(lang) => {
                i18n.changeLanguage(lang);
                setMobileMenuOpen(false);
              }} subtle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

