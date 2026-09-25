import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "NerdSubs - Transcripción en vivo para conferencias",
  description: "Transcripción y traducción simultánea en tiempo real para conferencias como Nerdearla",
  icons: {
    icon: "/logos/n-icon.png",
  },
  openGraph: {
    title: "NerdSubs",
    description: "Transcripción y traducción en tiempo real para conferencias",
    images: ["/logos/nerd-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Twemoji — renders emojis as cross-platform SVG images */}
        <Script
          src="https://cdn.jsdelivr.net/npm/twemoji@14.0.2/dist/twemoji.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-nerd-bg text-nerd-text antialiased">
        {children}
        {/* Auto-parse emojis on DOM changes */}
        <Script id="twemoji-init" strategy="afterInteractive">
          {`
            if (typeof twemoji !== 'undefined') {
              function parseEmojis(root) {
                twemoji.parse(root || document.body, {
                  folder: 'svg',
                  ext: '.svg',
                  base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
                });
              }
              // Parse on load
              parseEmojis();
              // Re-parse when new nodes are added (for dynamic dropdowns)
              var debounceTimer;
              var observer = new MutationObserver(function(mutations) {
                var hasNewNodes = mutations.some(function(m) { return m.addedNodes.length > 0; });
                if (hasNewNodes) {
                  clearTimeout(debounceTimer);
                  debounceTimer = setTimeout(function() { parseEmojis(); }, 100);
                }
              });
              observer.observe(document.body, { childList: true, subtree: true });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
