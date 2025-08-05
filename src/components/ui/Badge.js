import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-all duration-200';
  
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const variantClasses = {
    default: 'bg-gray-700 text-gray-300 border border-gray-600',
    primary: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    secondary: 'bg-gray-600/20 text-gray-300 border border-gray-500/30',
    success: 'bg-green-500/20 text-green-300 border border-green-500/30',
    danger: 'bg-red-500/20 text-red-300 border border-red-500/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    info: 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
  };

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;