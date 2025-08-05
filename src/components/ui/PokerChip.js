import React from 'react';

const PokerChip = ({ value, size = 'normal', stacked = false, count = 1 }) => {
  // Determine chip color based on value
  const getChipColor = () => {
    if (value >= 5000) return { main: '#000000', accent: '#333333', text: '#ffd700' }; // Black/Gold
    if (value >= 1000) return { main: '#800080', accent: '#9932cc', text: 'white' };   // Purple
    if (value >= 500) return { main: '#000080', accent: '#0000cd', text: 'white' };    // Blue
    if (value >= 100) return { main: '#006400', accent: '#008000', text: 'white' };    // Green
    if (value >= 50) return { main: '#8b0000', accent: '#b22222', text: 'white' };     // Red
    if (value >= 25) return { main: '#ff8c00', accent: '#ffa500', text: 'black' };     // Orange
    if (value >= 10) return { main: '#2f4f4f', accent: '#708090', text: 'white' };     // Gray
    return { main: '#ffffff', accent: '#f0f0f0', text: 'black' };                      // White
  };
  
  const chipColor = getChipColor();
  
  // Determine chip size
  const chipSizes = {
    small: { width: '24px', height: '24px', fontSize: '8px' },
    normal: { width: '32px', height: '32px', fontSize: '10px' },
    large: { width: '40px', height: '40px', fontSize: '12px' }
  };
  
  const chipSize = chipSizes[size] || chipSizes.normal;
  
  // Format value for display
  const formatValue = (val) => {
    if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K`;
    return val.toString();
  };
  
  // Render stacked chips
  if (stacked && count > 1) {
    return (
      <div className="relative inline-block" style={{ height: `${parseInt(chipSize.height) + (count - 1) * 4}px` }}>
        {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
          <div 
            key={i}
            className="absolute poker-chip"
            style={{
              width: chipSize.width,
              height: chipSize.height,
              bottom: `${i * 4}px`,
              left: 0,
              backgroundColor: chipColor.main,
              border: `2px solid ${chipColor.accent}`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: chipColor.text,
              fontSize: chipSize.fontSize,
              fontWeight: 'bold',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              zIndex: i
            }}
          >
            {i === Math.min(count, 5) - 1 && formatValue(value)}
          </div>
        ))}
        {count > 5 && (
          <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {count}
          </div>
        )}
      </div>
    );
  }
  
  // Render single chip
  return (
    <div 
      className="poker-chip"
      style={{
        width: chipSize.width,
        height: chipSize.height,
        backgroundColor: chipColor.main,
        border: `2px solid ${chipColor.accent}`,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: chipColor.text,
        fontSize: chipSize.fontSize,
        fontWeight: 'bold',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      }}
    >
      {formatValue(value)}
    </div>
  );
};

export default PokerChip;