import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
  fallback: ["Tahoma", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "دعوت",
    template: "%s — دعوت",
  },
  description: "یک دعوت خصوصی و دوستانه.",
  applicationName: "دعوت",
  // The whole app is private — never index.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#14161c" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={vazirmatn.variable}
    >
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
