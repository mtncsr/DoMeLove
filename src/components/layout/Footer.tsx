import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg text-sm">
                ✨
              </div>
              <div className="font-semibold text-base bg-gradient-to-r from-fuchsia-600 to-purple-700 bg-clip-text text-transparent">
                LoveMeDo
              </div>
            </Link>
            <p className="text-sm text-slate-600 leading-relaxed">
              Create beautiful, interactive digital experiences that your loved ones will treasure forever. No apps, no server, just pure emotion in a single HTML file.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/how-it-works" className="text-sm text-slate-600 hover:text-fuchsia-700 transition-colors">
                  How it work
                </Link>
              </li>
              <li>
                <Link to="/templates" className="text-sm text-slate-600 hover:text-fuchsia-700 transition-colors">
                  Templates
                </Link>
              </li>
              <li>
                <Link to="/live-examples" className="text-sm text-slate-600 hover:text-fuchsia-700 transition-colors">
                  Live example
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-slate-600 hover:text-fuchsia-700 transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-sm text-slate-600 hover:text-fuchsia-700 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-slate-600 hover:text-fuchsia-700 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-slate-600 hover:text-fuchsia-700 transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-fuchsia-700 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-slate-600 hover:text-fuchsia-700 transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 text-center text-sm text-slate-600">
          <p>© {new Date().getFullYear()} LoveMeDo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

