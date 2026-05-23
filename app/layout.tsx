import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { LangProvider } from '@/components/providers/LangProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'Meta Pulse — Ads Intelligence Dashboard',
  description: 'Track Meta Ads performance, creative fatigue, ROAS, CPM, CTR, and more.',
};

// Prevent flash of wrong theme on initial load
const themeScript = `
  (function() {
    try {
      var t = localStorage.getItem('theme');
      if (t === 'light') document.documentElement.classList.add('light');
      else document.documentElement.classList.add('dark');
    } catch(e) {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <LangProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
