import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-gray-200 dark:text-gray-700">404</h1>
      <p className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
        Page not found
      </p>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        The page you were looking for doesn't exist.
      </p>
      <Link to="/" className="mt-6 btn-primary">
        ← Back to home
      </Link>
    </div>
  );
}
