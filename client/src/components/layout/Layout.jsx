import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface">
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 py-8">
        {children}
      </main>
    </div>
  );
}
