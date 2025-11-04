// app/providers.jsx (for App Router)
'use client';
import { ThemeProvider } from 'next-themes';
import { DialogProvider } from './contexts/DialogContext';

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class">
      <DialogProvider>
        {children}
      </DialogProvider>
    </ThemeProvider>
  );
}