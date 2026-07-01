// Reusable labelled input / textarea
export default function FormInput({ label, id, as = 'input', className = '', ...props }) {
  const Component = as;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-600">
          {label}
        </label>
      )}
      <Component id={id} className={`border p-3 rounded-lg bg-white ${className}`} {...props} />
    </div>
  );
}
