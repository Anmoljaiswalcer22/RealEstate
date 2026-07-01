import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="max-w-lg mx-auto p-3 text-center my-20">
      <h1 className="text-5xl font-bold text-slate-700">404</h1>
      <p className="text-slate-600 my-4">This page doesn&apos;t exist.</p>
      <Link to="/" className="text-blue-700 hover:underline">
        Back to home
      </Link>
    </main>
  );
}
