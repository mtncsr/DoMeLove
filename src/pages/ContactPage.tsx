import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { useProject } from '../contexts/ProjectContext';
import { useTranslation } from 'react-i18next';
import { getTextDirection } from '../i18n/config';

export function ContactPage() {
  const navigate = useNavigate();
  const { createProject, setCurrentProject } = useProject();
  const { t, i18n } = useTranslation();
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: '',
    message: '',
  });

  const startNewGift = () => {
    const project = createProject('romantic', 'My interactive gift');
    setCurrentProject(project);
    navigate('/editor');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    alert(t('marketing.contact.submitSuccess'));
  };

  return (
    <div className="min-h-screen bg-white" dir={dir}>
      <Navigation />
      <main className={`max-w-4xl mx-auto px-4 py-12 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className={`text-center mb-12 ${isRTL ? 'rtl' : ''}`}>
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide mb-3">{t('marketing.contact.eyebrow')}</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            {t('marketing.contact.titlePart1')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">{t('marketing.contact.titleHighlight')}</span>
          </h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto">
            {t('marketing.contact.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 md:p-10">
          <div className={`grid md:grid-cols-2 gap-4 mb-4 ${isRTL ? 'text-right' : ''}`}>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">{t('marketing.contact.nameLabel')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">{t('marketing.contact.emailLabel')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
                placeholder="john@example.com"
                required
              />
            </div>
          </div>
          <div className={`mb-4 ${isRTL ? 'text-right' : ''}`}>
            <label className="block text-sm font-semibold text-slate-900 mb-2">{t('marketing.contact.reasonLabel')}</label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-fuchsia-400 focus:outline-none text-slate-700"
              required
            >
              <option value="">{t('marketing.contact.reasonPlaceholder')}</option>
              <option value="start-project">{t('marketing.contact.reasonStart')}</option>
              <option value="question">{t('marketing.contact.reasonQuestion')}</option>
              <option value="partnership">{t('marketing.contact.reasonPartnership')}</option>
              <option value="other">{t('marketing.contact.reasonOther')}</option>
            </select>
          </div>
          <div className={`mb-6 ${isRTL ? 'text-right' : ''}`}>
            <label className="block text-sm font-semibold text-slate-900 mb-2">{t('marketing.contact.messageLabel')}</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
              rows={6}
              placeholder={t('marketing.contact.messagePlaceholder')}
              required
            />
          </div>
          <div className={`flex flex-wrap gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              type="submit"
              className="gradient-button rounded-full px-6 py-3 text-sm font-semibold text-white"
            >
              {t('marketing.contact.submit')}
            </button>
            <button
              type="button"
              className="secondary-button rounded-full px-6 py-3 text-sm font-semibold"
              onClick={startNewGift}
            >
              {t('marketing.contact.ctaStart')}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}

