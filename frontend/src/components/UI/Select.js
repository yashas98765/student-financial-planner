import React from 'react';

const Select = React.forwardRef(({ label, options = [], error, ...props }, ref) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <select
      ref={ref}
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring ${error ? 'border-red-500' : 'border-gray-300'}`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
));

export default Select;
