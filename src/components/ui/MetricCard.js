import React from 'react';

export default function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  color = 'blue',
  subtitle,
  onClick 
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  const changeColors = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400'
  };

  return (
    <div 
      className={`bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            {icon && (
              <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[color]} mr-3`}>
                <span className="text-white text-lg">{icon}</span>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-400">{title}</h3>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              {change && (
                <div className="flex items-center mt-1">
                  <span className={`text-sm font-medium ${changeColors[changeType]}`}>
                    {changeType === 'positive' && '+'}
                    {change}
                  </span>
                  {changeType === 'positive' && <span className="text-green-400 ml-1">↗</span>}
                  {changeType === 'negative' && <span className="text-red-400 ml-1">↘</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}