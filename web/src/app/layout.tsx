import type { Metadata, Viewport } from "next";
import { Fraunces, Great_Vibes, Manrope } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
});

// Logodaki el yazısına yakın; yalnızca marka adında kullanılır.
const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: `${SITE.name} | ${SITE.slogan}`,
  description:
    "30 yaş ve üzeri, ciddi ilişki arayan kadın ve erkekler için açıklanabilir uyum, güvenlik ve gizlilik odaklı tanışma uygulaması. Erken erişime katıl.",
  openGraph: {
    title: SITE.name,
    description: SITE.slogan,
    url: SITE.url,
    siteName: SITE.name,
    locale: "tr_TR",
    type: "website",
    images: [{ url: "/brand/gonul-pusulasi-gorsel.jpg", width: 1024, height: 715, alt: SITE.name }],
  },
  // Lansmana kadar arama motorlarına kapalı
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#fcf7f5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${manrope.variable} ${fraunces.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
