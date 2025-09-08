import ReactGA from 'react-ga4';

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const IS_PROD = import.meta.env.MODE === 'production';

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  if (!GA_ID) {
    if (import.meta.env.DEV) {
      console.warn('[analytics] Missing VITE_GA_MEASUREMENT_ID, GA disabled.');
    }
    return;
  }
  ReactGA.initialize(GA_ID, { testMode: !IS_PROD });
  initialized = true;
}

export function trackPageview(path: string, title?: string) {
  if (!initialized) return;
  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: title ?? document.title,
  });
}

export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  ReactGA.event({ category, action, label, value });
};
