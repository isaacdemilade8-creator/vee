import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata = {
  title: 'Vee',
  description: 'Create, discover, and talk with your circle.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
