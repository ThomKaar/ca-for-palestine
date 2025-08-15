'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Home", path: "/", activeClasses: 'text-black border-black', hoverClasses: 'hover:text-black hover:border-black', activeMobileClasses: 'bg-gray-50' },
  { name: "About", path: "/about", activeClasses: 'text-green-600 border-green-600', hoverClasses: 'hover:text-green-600 hover:border-green-600', activeMobileClasses: 'bg-green-50' },
  { name: "Contact", path: "/contact", activeClasses: 'text-red-600 border-red-600', hoverClasses: 'hover:text-red-600 hover:border-red-600', activeMobileClasses: 'bg-red-50' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="text-xl font-semibold tracking-tight text-gray-800">
            CA For Palestine
          </div>

          <div className="hidden md:flex space-x-6">
            {navItems.map((item, i) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`px-2 py-1 text-sm font-medium transition-colors ${
                    isActive
                      ? `${item.activeClasses} font-semibold border-b-2`
                      : `text-gray-600 ${item.hoverClasses} hover:border-b-2 border-transparent`
                  }`}
                >
                  {item.name} 
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              // close icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // borgor icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="space-y-1 px-4 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`block px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? `${item.activeClasses} ${item.activeMobileClasses} font-semibold`
                      : `text-gray-600 ${item.hoverClasses} hover:bg-gray-50`
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
