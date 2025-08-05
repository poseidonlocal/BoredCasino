import React from 'react';

export const PieChart = ({ data, size = 200 }) => {
  // Simple Pie Chart component implementation
  return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center text-white bg-gray-700 rounded-full">
      Pie Chart
    </div>
  );
};

const SimpleChart = ({ data, type = 'bar', height = 200 }) => {
  // Simple Chart component implementation
  return (
    <div style={{ height }} className="flex items-center justify-center text-white bg-gray-800 rounded-lg">
      {type === 'bar' ? 'Bar Chart' : 'Line Chart'}
    </div>
  );
};

export default SimpleChart;