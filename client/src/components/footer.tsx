import { Skull } from 'lucide-react';
import FeedbackButton from './feedback-button';

export default function Footer() {
  return (
    <footer className="dark-gray-bg border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <h3 className="text-2xl font-bold blood-red flex items-center">
                <Skull className="mr-2 h-6 w-6" />
                Scream Stream
              </h3>
            </div>
            <p className="text-gray-400 mb-4">
              Discover the highest-rated horror movies and series currently streaming. Rated by
              critics and audiences across all major platforms.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Discover</h4>
            <ul className="space-y-2">
              <li>
                <a href="/browse" className="text-gray-400 hover:text-white transition-colors">
                  Browse
                </a>
              </li>
              <li>
                <a
                  href="/new-to-streaming"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  New to Streaming
                </a>
              </li>
              <li>
                <a href="/subgenres" className="text-gray-400 hover:text-white transition-colors">
                  Subgenres
                </a>
              </li>
              <li>
                <a href="/watchlist" className="text-gray-400 hover:text-white transition-colors">
                  Watchlist
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <FeedbackButton
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white transition-colors p-0 h-auto font-normal"
                >
                  Report Issue
                </FeedbackButton>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 mb-2">
            © 2025 Scream Stream. All rights reserved. | Discover the best horror titles streaming
            online.
          </p>
          <p className="text-gray-500 text-sm">
            All data sourced from{' '}
            <a
              href="https://watchmode.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 transition-colors underline"
            >
              Watchmode.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
