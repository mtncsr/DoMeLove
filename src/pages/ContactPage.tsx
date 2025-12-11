import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import { useProject } from '../contexts/ProjectContext';

export function ContactPage() {
  const navigate = useNavigate();
  const { createProject, setCurrentProject } = useProject();
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
    alert('Thank you for your message! We\'ll get back to you soon.');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide mb-3">Contact</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Let&apos;s{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-700">talk</span>
          </h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto">
            Have a question, idea, or just want to say hello? We'd love to hear from you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 md:p-10">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Your name</label>
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
              <label className="block text-sm font-semibold text-slate-900 mb-2">Email address</label>
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
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-900 mb-2">What do you want to create?</label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-fuchsia-400 focus:outline-none text-slate-700"
              required
            >
              <option value="">Select a reason...</option>
              <option value="start-project">Start a project</option>
              <option value="question">Ask a question</option>
              <option value="partnership">Partnership</option>
              <option value="other">Something else</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">Your message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
              rows={6}
              placeholder="Tell us how we can help you..."
              required
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="gradient-button rounded-full px-6 py-3 text-sm font-semibold text-white"
            >
              Send message
            </button>
            <button
              type="button"
              className="secondary-button rounded-full px-6 py-3 text-sm font-semibold"
              onClick={startNewGift}
            >
              Start creating
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}

