// app/layout.js
import { Providers } from './pricing/providers';
import './globals.css'; // Your global CSS

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}