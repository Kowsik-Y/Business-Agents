import type { Metadata } from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import ClientShell from './components/ClientShell';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Concierge AI - Intelligent Co-pilot & Support Portal',
  description: 'AI-powered Business Agent with real-time LangGraph orchestration.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("dark", "font-sans", geist.variable)}>
      <body suppressHydrationWarning className="bg-background text-on-background antialiased selection:bg-primary-container selection:text-on-primary-container">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}

