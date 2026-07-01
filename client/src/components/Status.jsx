// Shared loading / error / success messages so users always know what's happening
export function Loader({ text = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-3 my-10 text-slate-600" role="status">
      <span className="h-6 w-6 border-4 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
      <span>{text}</span>
    </div>
  );
}

export function ErrorMessage({ children }) {
  if (!children) return null;
  return (
    <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-sm" role="alert">
      {children}
    </p>
  );
}

export function SuccessMessage({ children }) {
  if (!children) return null;
  return <p className="text-green-800 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">{children}</p>;
}
