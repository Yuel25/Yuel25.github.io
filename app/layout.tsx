import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import "highlight.js/styles/tokyo-night-dark.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://yuel25.github.io"),
  title: "Yuel — Daily Gallery & Digital Garden",
  description: "Yuel 的个人网站：每天三幅画面，以及代码、文字与灵感组成的数字庭院。",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Yuel’s Daily Gallery",
    description: "Three quiet sparks, today.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Yuel’s Daily Gallery" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yuel’s Daily Gallery",
    description: "Three quiet sparks, today.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
