const VARIANTS = {
  primary: 'bg-slate-700 text-white hover:opacity-95',
  success: 'bg-green-700 text-white hover:opacity-95',
  danger: 'bg-red-700 text-white hover:opacity-95',
  google: 'bg-red-600 text-white hover:opacity-95',
  outline: 'border border-slate-700 text-slate-700 hover:bg-slate-700 hover:text-white',
};

export default function Button({ variant = 'primary', loading = false, children, className = '', ...props }) {
  return (
    <button
      className={`p-3 rounded-lg uppercase transition disabled:opacity-70 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
