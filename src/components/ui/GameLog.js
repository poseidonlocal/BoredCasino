import React, { useRef, useEffect } from 'react';

const GameLog = ({ messages = [] }) => {
  const logRef = useRef(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Format message with colored text for different actions
  const formatMessage = (message) => {
    if (message.includes('fold')) return <span><span className="text-red-400">Fold:</span> {message}</span>;
    if (message.includes('check')) return <span><span className="text-blue-400">Check:</span> {message}</span>;
    if (message.includes('call')) return <span><span className="text-yellow-400">Call:</span> {message}</span>;
    if (message.includes('raise')) return <span><span className="text-green-400">Raise:</span> {message}</span>;
    if (message.includes('all-in')) return <span><span className="text-purple-400">All-in:</span> {message}</span>;
    if (message.includes('win')) return <span><span className="text-green-400">Win:</span> {message}</span>;
    if (message.includes('dealt')) return <span><span className="text-blue-400">Dealt:</span> {message}</span>;
    return message;
  };
  
  return (
    <div className="game-log">
      <h4 className="text-white font-semibold mb-2 flex items-center">
        <span className="mr-2">📋</span>
        Game Log
      </h4>
      
      <div className="log-messages" ref={logRef}>
        {messages.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            No game actions yet
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="log-message">
              <span className="log-time">{message.split(':')[0]}</span>
              <span className="log-text">{formatMessage(message.substring(message.indexOf(':') + 1))}</span>
            </div>
          ))
        )}
      </div>
      
      <style jsx>{`
        .game-log {
          background: rgba(0,0,0,0.8);
          border-radius: 10px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.1);
          height: 200px;
          display: flex;
          flex-direction: column;
        }
        
        .log-messages {
          flex: 1;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #4b5563 transparent;
        }
        
        .log-messages::-webkit-scrollbar {
          width: 6px;
        }
        
        .log-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .log-messages::-webkit-scrollbar-thumb {
          background-color: #4b5563;
          border-radius: 3px;
        }
        
        .log-message {
          padding: 4px 0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          font-size: 12px;
          display: flex;
        }
        
        .log-time {
          color: #9ca3af;
          margin-right: 8px;
          flex-shrink: 0;
        }
        
        .log-text {
          color: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default GameLog;