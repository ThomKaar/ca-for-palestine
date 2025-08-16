
import { Mail, Github } from 'lucide-react';

export default function ContactPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-6 h-full">
      <header className="flex flex-col mb-5">
        <h2 className="font-bold text-2xl">Contact</h2>
      </header>

      <p>Hi, welcome to the Contact Page.</p>
      
      <a
        href="mailto:thomkaar@gmail.com"
        className="flex w-[250] items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md
                   hover:bg-blue-700 active:scale-95 transition-transform duration-150"
      >
        <Mail className="w-5 h-5" />
        thomkaar@gmail.com
      </a>

      <a
        href="https://github.com/ThomKaar/ca-for-palestine"
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-[250] items-center gap-2 bg-gray-800 text-white font-semibold px-4 py-2 rounded-lg shadow-md
                   hover:bg-gray-900 active:scale-95 transition-transform duration-150"
      >
        <Github className="w-5 h-5" />
        Open a PR to Help
      </a>
    </main>
  );
}
