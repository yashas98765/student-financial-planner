import React from 'react';

const Input = React.forwardRef(({ 
  label, 
  error, 
  helpText, 
  className = '',
  ...props 
}, ref) => (
  <div className="mb-4">
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
    )}
    <input
      ref={ref}
      className={`w-full px-3 py-2.5 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
        error 
          ? 'border-red-500 bg-red-50' 
          : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
      } ${className}`}
      {...props}
    />
    {error && (
      <p className="text-xs text-red-500 mt-1 flex items-center">
        <span className="mr-1">⚠</span>
        {error}
      </p>
    )}
    {helpText && !error && (
      <p className="text-xs text-gray-500 mt-1">{helpText}</p>
    )}
  </div>
));

Input.displayName = 'Input';

export default Input;
