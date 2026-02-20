import './globals.css';
import Sidebar from '../components/Sidebar';

export const metadata = {
  title: 'Email Cadence App',
  description: 'Manage cadences and enrollments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main Content */}
          <main className="flex-1 lg:ml-[260px] min-h-screen">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-100 h-16 flex items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-3 lg:hidden">
                {/* Mobile logo placeholder - shown when sidebar is collapsed */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900">Email Cadence</span>
              </div>
              
              <div className="hidden lg:flex items-center text-sm text-gray-500">
                <span>Welcome back!</span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* User Avatar */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                    U
                  </div>
                </div>
              </div>
            </header>
            
            {/* Page Content */}
            <div className="p-4 lg:p-6">
              {children}
            </div>
            
            {/* Footer */}
            <footer className="mt-auto border-t border-gray-100 py-4 px-4 lg:px-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-500">
                <p>
                  © {new Date().getFullYear()} Email Cadence. All rights reserved.
                </p>
                <span className="hidden sm:inline text-gray-300">•</span>
                <p className="text-gray-400">
                  Built with Next.js & Temporal
                </p>
              </div>
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}

