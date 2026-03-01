import React from 'react';

const variantStyles = {
  primary: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  danger: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
};

const Badge = ({ children, variant = 'primary', className = '' }) => (
  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${variantStyles[variant] || variantStyles.primary} ${className}`}>
    {children}
  </span>
);

export default Badge;
