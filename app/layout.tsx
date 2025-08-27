"use client";
import './globals.css';
import FontProvider from './font-provider';
import { UserProvider, useUser } from './context/UserContext';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FontProvider>
          <UserProvider>
            <Header />
            <main className="pt-16 min-h-screen">{children}</main>
          </UserProvider>
        </FontProvider>
      </body>
    </html>
  );
}

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const { loading, fetchUser } = useUser(); // Removed unused 'user' variable

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    fetchUser(); // Fetch user data on mount using the session token
    return () => window.removeEventListener('resize', checkMobile);
  }, [fetchUser]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (loading) {
    return (
      <header className="flex justify-center items-center p-4 h-16 bg-white shadow-sm fixed w-full z-40">
        <div className="w-8 h-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="flex justify-between items-center p-4 gap-4 h-16 bg-white shadow-sm fixed w-full z-40">
        <div className="flex items-center">
          {isMobileView && (
            <motion.button
              onClick={toggleMobileMenu}
              className="ml-4 mr-2 text-gray-700 focus:outline-none"
              aria-label="Toggle menu"
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </motion.button>
          )}

          <Link
            href="/"
            className="flex items-center text-lg font-semibold ml-4 md:ml-8"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center shadow-md">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
            </div>
            <span className="ml-2">Project Pulse</span>
          </Link>
        </div>

        <nav className="flex items-center gap-6">
          {isMobileView ? (
            <motion.button
              onClick={toggleMobileMenu}
              className="ml-auto mr-4 text-gray-700 focus:outline-none"
              aria-label="Toggle menu"
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </motion.button>
          ) : (
            <AuthNavigation />
          )}
        </nav>
      </header>

      <AnimatePresence>
        {isMobileView && isMobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 w-3/4 bg-white shadow-lg z-50"
          >
            <div className="p-4 flex flex-col h-full">
              <div className="flex justify-between items-center mb-8">
                <Link
                  href="/"
                  className="flex items-center text-xl font-semibold"
                  onClick={toggleMobileMenu}
                >
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  Project Pulse
                </Link>
                <motion.button
                  onClick={toggleMobileMenu}
                  className="text-gray-700"
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
              <nav className="flex flex-col gap-1 flex-grow">
                <MobileAuthNavigation toggleMenu={toggleMobileMenu} />
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-16"></div>
    </>
  );
}

function AuthNavigation() {
  const { user, loading, logout } = useUser();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="w-8 h-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user) {
    const isActive = (path: string) => pathname === path;

    return (
      <>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/dashboard"
            className={`hover:text-blue-500 transition-colors ${
              isActive('/dashboard')
                ? 'text-blue-600 font-medium border-b-2 border-blue-600'
                : 'opacity-85'
            }`}
          >
            Dashboard
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/ai"
            className={`hover:text-blue-500 transition-colors ${
              isActive('/ai')
                ? 'text-blue-600 font-medium border-b-2 border-blue-600'
                : 'opacity-85'
            }`}
          >
            AI Generator
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/bookmarks"
            className={`hover:text-blue-500 transition-colors ${
              isActive('/bookmarks')
                ? 'text-blue-600 font-medium border-b-2 border-blue-600'
                : 'opacity-85'
            }`}
          >
            Bookmarks
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/chat"
            className={`hover:text-blue-500 transition-colors ${
              isActive('/chat')
                ? 'text-blue-600 font-medium border-b-2 border-blue-600'
                : 'opacity-85'
            }`}
          >
            Chatbot
          </Link>
        </motion.div>
        <div className="flex items-center gap-2 ml-4">
          {user.picture && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Image
                src={user.picture}
                alt="Profile"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
                priority
              />
            </motion.div>
          )}
          <span className="font-medium">{user.name || user.email}</span>
          <motion.button
            className="ml-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            onClick={logout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        </div>
      </>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Link href="https://pulse.great-site.net/Google_signup/index.php" className="hover:text-blue-500 transition-colors opacity-85">
        Sign Up
      </Link>
    </motion.div>
  );
}

function MobileAuthNavigation({ toggleMenu }: { toggleMenu: () => void }) {
  const { user, loading, logout } = useUser();
  const pathname = usePathname();

  if (loading) {
    return <div className="w-8 h-8"></div>;
  }

  if (user) {
    const isActive = (path: string) => pathname === path;

    return (
      <>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Link
            href="/dashboard"
            className={`py-3 px-4 hover:bg-gray-100 rounded-lg block transition-colors ${
              isActive('/dashboard') ? 'bg-blue-50 text-blue-600 font-medium' : ''
            }`}
            onClick={toggleMenu}
          >
            Dashboard
          </Link>
        </motion.div>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Link
            href="/ai"
            className={`py-3 px-4 hover:bg-gray-100 rounded-lg block transition-colors ${
              isActive('/ai') ? 'bg-blue-50 text-blue-600 font-medium' : ''
            }`}
            onClick={toggleMenu}
          >
            AI Generator
          </Link>
        </motion.div>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/bookmarks"
            className={`py-3 px-4 hover:bg-gray-100 rounded-lg block transition-colors ${
              isActive('/bookmarks') ? 'bg-blue-50 text-blue-600 font-medium' : ''
            }`}
            onClick={toggleMenu}
          >
            Bookmarks
          </Link>
        </motion.div>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <Link
            href="/chat"
            className={`py-3 px-4 hover:bg-gray-100 rounded-lg block transition-colors ${
              isActive('/chat') ? 'bg-blue-50 text-blue-600 font-medium' : ''
            }`}
            onClick={toggleMenu}
          >
            Chatbot
          </Link>
        </motion.div>
        <motion.div
          className="mt-auto p-4 border-t border-gray-200"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            {user.picture && (
              <motion.div whileHover={{ scale: 1.1 }}>
                <Image
                  src={user.picture}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full"
                  priority
                />
              </motion.div>
            )}
            <div>
              <div className="font-medium">{user.name || user.email}</div>
            </div>
          </div>
          <motion.button
            className="w-full py-2 px-4 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            onClick={() => {
              logout();
              toggleMenu();
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Logout
          </motion.button>
        </motion.div>
      </>
    );
  }

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <Link
        href="https://pulse.great-site.net/Google_signup/index.php"
        className="py-3 px-4 hover:bg-gray-100 rounded-lg block transition-colors"
        onClick={toggleMenu}
      >
        Sign Up
      </Link>
    </motion.div>
  );
}