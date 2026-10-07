import './globals.css';
import ThemeProvider from './lib/ThemeProvider';
import { THEME_SCRIPT } from './lib/themeScript';

export const metadata = {
  title: 'ISS Live-Tracker',
  description:
    'Live-Position der Internationalen Raumstation auf einer Karte — Höhe und Geschwindigkeit inklusive.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: Das Skript unten setzt data-theme am
    // <html>-Element, bevor React hydratisiert. Ohne den Hinweis meldet React
    // die zusätzlichen Attribute als Abweichung.
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Muss blockierend vor dem Body laufen, sonst blitzt beim Laden kurz
            das falsche Farbschema auf. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
