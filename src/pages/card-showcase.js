import React from 'react';
import Layout from '../components/Layout';
import PlayingCard from '../components/ui/PlayingCard';

export default function CardShowcase() {
  // Create a full deck of cards
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  
  const deck = [];
  for (let suit of suits) {
    for (let rank of ranks) {
      deck.push({ suit, rank, value: rank === 'A' ? 14 : rank === 'K' ? 13 : rank === 'Q' ? 12 : rank === 'J' ? 11 : parseInt(rank) });
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              🎮 Playing Card Showcase
            </span>
          </h1>
          <p className="text-xl text-dark-300 max-w-2xl mx-auto">
            Realistic playing cards for BoredCasino gaming platform
          </p>
        </div>

        <div className="glow-card mb-8 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Card Sizes</h2>
          
          <div className="flex items-center justify-center space-x-8 mb-12">
            <div className="text-center">
              <PlayingCard card={{ suit: '♠', rank: 'A' }} size="small" />
              <p className="text-gray-400 mt-2">Small</p>
            </div>
            
            <div className="text-center">
              <PlayingCard card={{ suit: '♥', rank: 'K' }} size="normal" />
              <p className="text-gray-400 mt-2">Normal</p>
            </div>
            
            <div className="text-center">
              <PlayingCard card={{ suit: '♦', rank: 'Q' }} size="large" />
              <p className="text-gray-400 mt-2">Large</p>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-6">Card Back</h2>
          
          <div className="flex items-center justify-center space-x-8 mb-12">
            <div className="text-center">
              <PlayingCard card={{ suit: '♣', rank: 'J' }} isHidden={true} size="large" />
              <p className="text-gray-400 mt-2">Card Back</p>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-6">Full Deck</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-13 gap-2">
            {deck.map((card, index) => (
              <div key={index} className="flex justify-center">
                <PlayingCard card={card} size="small" />
              </div>
            ))}
          </div>
          
          <h2 className="text-2xl font-bold text-white mt-12 mb-6">Poker Hands</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Royal Flush</h3>
              <div className="flex justify-center space-x-2">
                {['10', 'J', 'Q', 'K', 'A'].map((rank, i) => (
                  <PlayingCard key={i} card={{ suit: '♥', rank }} />
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Four of a Kind</h3>
              <div className="flex justify-center space-x-2">
                {['♠', '♥', '♦', '♣'].map((suit, i) => (
                  <PlayingCard key={i} card={{ suit, rank: 'A' }} />
                ))}
                <PlayingCard card={{ suit: '♠', rank: 'K' }} />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Full House</h3>
              <div className="flex justify-center space-x-2">
                <PlayingCard card={{ suit: '♠', rank: 'K' }} />
                <PlayingCard card={{ suit: '♥', rank: 'K' }} />
                <PlayingCard card={{ suit: '♦', rank: 'K' }} />
                <PlayingCard card={{ suit: '♠', rank: 'Q' }} />
                <PlayingCard card={{ suit: '♥', rank: 'Q' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}