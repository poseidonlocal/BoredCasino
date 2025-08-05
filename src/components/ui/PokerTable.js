import React from 'react';

const PokerTable = ({ children, tableSize = 8 }) => {
  // Table styles based on size
  const tableSizes = {
    2: { width: '600px', height: '350px' },
    4: { width: '700px', height: '400px' },
    8: { width: '800px', height: '500px' },
    12: { width: '900px', height: '550px' }
  };
  
  const size = tableSizes[tableSize] || tableSizes[8];
  
  return (
    <div className="poker-table-container relative mx-auto" style={{ width: size.width }}>
      {/* Table felt */}
      <div 
        className="poker-table relative rounded-full mx-auto overflow-hidden"
        style={{ 
          width: size.width, 
          height: size.height,
          background: 'linear-gradient(135deg, #0c4a2c 0%, #1a7f4b 50%, #0c4a2c 100%)',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.5)'
        }}
      >
        {/* Table rim */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ 
            border: '12px solid #8b4513',
            boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.1)'
          }}
        ></div>
        
        {/* Table center pattern */}
        <div 
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(26,127,75,0.7) 0%, rgba(12,74,44,0) 70%)',
            boxShadow: 'inset 0 0 30px rgba(255,255,255,0.1)'
          }}
        >
          <div 
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              height: '80%',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.1)'
            }}
          ></div>
        </div>
        
        {/* Table content */}
        <div className="relative w-full h-full">
          {children}
        </div>
      </div>
      
      <style jsx>{`
        .poker-table-container {
          perspective: 1000px;
        }
        
        .poker-table {
          transform: rotateX(5deg);
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
};

export default PokerTable;