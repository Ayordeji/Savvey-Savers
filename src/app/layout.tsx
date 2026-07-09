import type { Metadata } from 'next';
import './globals.css';
import { DialogProvider } from '@/context/DialogContext';

export const metadata: Metadata = {
  title: 'Savvey Savers Platform - Rotating Savings & Contribution Management',
  description: 'Digital thrift and rotating savings management system. Track member savings commitments, collection month approvals, payments, and harvest releases securely.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <DialogProvider>
          {children}
        </DialogProvider>
      </body>
    </html>
  );
}
