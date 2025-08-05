import React from 'react';

const DealerButton = ({ type = 'dealer', size = 'normal' }) => {
  // Button types
  const buttonTypes = {
    dealer: { text: 'D', color: 'white', bg: '#1a5f3f' },
    smallBlind: { text: 'SB', color: 'white', bg: '#8b0000' },
    bigBlind: { text: 'BB', color: 'white', bg: '#000080' }
  };
  
  const buttonType = buttonTypes[type] || buttonTypes.dealer;
  
  // Button sizes
  const buttonSizes = {
    small: { width: '20px', height: '20px', fontSize: '8px' },
    normal: { width: '24px', height: '24px', fontSize: '10px' },
    large: { width: '30px', height: '30px', fontSize: '12px' }
  };
  
  const buttonSize = buttonSizes[size] || buttonSizes.normal;
  
  return (
    <div 
      className="dealer-button"
      style={{
        width: buttonSize.width,
        height: buttonSize.height,
        backgroundColor: buttonType.bg,
        color: buttonType.color,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: buttonSize.fontSize,
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        border: '2px solid white'
      }}
    >
      {buttonType.text}
    </div>
  );
};

export default DealerButton;