import { Sora, Space_Grotesk } from "next/font/google";
import { SettingsProvider } from "@/lib/settings-context";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata = {
  title: "KingOwen | 3D Modeller",
  description:
    "Owen — 19-year-old 3D modeller from the United Kingdom. Specialising in high-quality 3D models, sculpts, and rendered environments.",
  icons: {
    icon: "https://cdn.discordapp.com/avatars/798619259206500365/0ad237bf4f0123c5be52925363b4c6cc.png?size=64",
    apple:
      "https://cdn.discordapp.com/avatars/798619259206500365/0ad237bf4f0123c5be52925363b4c6cc.png?size=64",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body style={{ fontFamily: "var(--font-sora), 'Sora', sans-serif" }}>
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
