import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LanguageSelector } from '../ui/LanguageSelector';
import { useTranslation } from 'react-i18next';
import { getTextDirection } from '../../i18n/config';

export function Navigation() {
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const profileOrder = 'order-2';
  const navOrder = 'order-3';
  const startOrder = 'order-4';
  const langOrder = 'order-5';

  return (
    <header dir={dir} className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4 flex-wrap">
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

          {/* Profile */}
          <Link
            to="/profile"
            className={`hidden md:inline-flex items-center gap-2 rounded-full px-3 sm:px-4 py-2 text-sm font-semibold bg-white border border-slate-200 hover:border-fuchsia-300 shadow-sm transition-colors ${profileOrder}`}
          >
            <span>👤</span> <span className="hidden sm:inline">{t('marketing.nav.profile')}</span>
          </Link>

          {/* Desktop Navigation - Show all tabs */}
          <nav className={`hidden md:flex flex-1 items-center justify-center gap-3 lg:gap-4 xl:gap-5 ${isRTL ? 'flex-row-reverse' : ''} ${navOrder}`}>
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

          {/* Language selector */}
          <div className={`hidden sm:flex items-center gap-2 ${langOrder}`}>
            <span className="text-slate-600 text-base">🌐</span>
            <LanguageSelector value={i18n.language} onChange={(lang) => i18n.changeLanguage(lang)} subtle />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
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
        <div className="md:hidden border-t border-slate-200 py-4">
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
              <span className="text-slate-600 text-sm">🌐</span>
              <LanguageSelector value={i18n.language} onChange={(lang) => i18n.changeLanguage(lang)} subtle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

