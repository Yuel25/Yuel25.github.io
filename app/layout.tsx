import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yuel — Developer, Maker & Writer",
  description: "Yuel's personal website — projects, writing, and a quiet corner for ideas.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
