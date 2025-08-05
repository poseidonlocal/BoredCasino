import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('chips');
  const [purchasing, setPurchasing] = useState(null);
  const [message, setMessage] = useState('');
  
  const { isAuthenticated, user, updateUserCash } = useAuth();
  const cash = user?.cashBalance || 0;

  const products = {
    chips: [
      { id: 1, name: 'Starter Pack', amount: '1,000 Chips', price: '$4.99', chips: 1000, description: 'Perfect for beginners' },
      { id: 2, name: 'Player Pack', amount: '5,000 Chips', price: '$19.99', chips: 5000, description: 'Great value for regular players' },
      { id: 3, name: 'High Roller Pack', amount: '25,000 Chips', price: '$79.99', chips: 25000, description: 'For serious players' },
      { id: 4, name: 'Mega Pack', amount: '100,000 Chips', price: '$249.99', chips: 100000, description: 'Ultimate chip package' }
    ],
    vip: [
      { id: 5, name: 'Bronze VIP', amount: '7 Days', price: '$9.99', description: '2x daily bonus, exclusive games' },
      { id: 6, name: 'Silver VIP', amount: '30 Days', price: '$29.99', description: '3x daily bonus, higher limits' },
      { id: 7, name: 'Gold VIP', amount: '90 Days', price: '$79.99', description: '5x daily bonus, premium support' }
    ],
    items: [
      { id: 8, name: 'Lucky Card Back', amount: 'Cosmetic', price: '$2.99', description: 'Stylish card design' },
      { id: 9, name: 'Golden Table Theme', amount: 'Cosmetic', price: '$4.99', description: 'Luxury table appearance' },
      { id: 10, name: 'Double XP Boost', amount: '24 Hours', price: '$1.99', description: 'Earn XP twice as fast' }
    ]
  };

  const categories = [
    { id: 'chips', name: 'Chip Packages', icon: '🪙' },
    { id: 'vip', name: 'VIP Memberships', icon: '👑' },
    { id: 'items', name: 'Special Items', icon: '🎁' }
  ];

  const handlePurchase = async (product) => {
    if (!isAuthenticated) {
      setMessage('Please login to make purchases');
      return;
    }

    setPurchasing(product.id);
    setMessage('');

    try {
      // For demo purposes, simulate successful purchase
      if (product.chips) {
        const newBalance = cash + product.chips;
        await updateUserCash(newBalance);
        setMessage(`✅ Successfully purchased ${product.name}! Added ${product.chips.toLocaleString()} chips to your account.`);
      } else {
        setMessage(`✅ Successfully purchased ${product.name}!`);
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error) {
      setMessage('❌ Purchase failed. Please try again.');
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-900/50 to-gray-900"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 p-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl shadow-2xl shadow-yellow-500/25 mb-6 border border-yellow-300/30">
                <span className="text-4xl animate-bounce">🛍️</span>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-yellow-200 to-yellow-400 bg-clip-text text-transparent mb-4">
                Premium BoredCasino Shop
              </h1>
              <p className="text-gray-300 text-xl max-w-2xl mx-auto leading-relaxed">
                Enhance your gaming experience with exclusive chip packages, VIP memberships, and premium items
              </p>
              
              {/* User Info */}
              <div className="mt-8 flex justify-center items-center flex-wrap gap-4">
                <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm px-6 py-3 rounded-xl border border-gray-600/50 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">💰</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Current Balance</span>
                      <div className="text-green-400 font-bold text-lg">{cash.toLocaleString()} MSP</div>
                    </div>
                  </div>
                </div>
                
                {!isAuthenticated && (
                  <div className="bg-gradient-to-r from-red-800/80 to-red-700/80 backdrop-blur-sm px-6 py-3 rounded-xl border border-red-500/50 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🔒</span>
                      <div>
                        <span className="text-red-200 font-medium">Login Required</span>
                        <div className="text-red-300 text-sm">Sign in to make purchases</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {isAuthenticated && user && (
                  <div className="bg-gradient-to-r from-purple-800/80 to-pink-800/80 backdrop-blur-sm px-6 py-3 rounded-xl border border-purple-500/50 shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{user.username?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-purple-200 font-medium">Welcome, {user.username}</span>
                        <div className="text-purple-300 text-sm">Premium Player</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Purchase Message */}
              {message && (
                <div className={`mt-6 p-4 rounded-xl backdrop-blur-sm border shadow-lg ${
                  message.includes('✅') 
                    ? 'bg-gradient-to-r from-green-800/80 to-emerald-800/80 text-green-200 border-green-500/50 shadow-green-500/20' 
                    : 'bg-gradient-to-r from-red-800/80 to-red-700/80 text-red-200 border-red-500/50 shadow-red-500/20'
                }`}>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-xl">
                      {message.includes('✅') ? '🎉' : '⚠️'}
                    </span>
                    <span className="font-medium">{message}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Category Tabs */}
            <div className="flex justify-center mb-12">
              <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm rounded-2xl p-2 flex space-x-2 border border-gray-600/50 shadow-2xl">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-8 py-4 rounded-xl font-medium transition-all duration-300 flex items-center space-x-3 relative overflow-hidden ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/25 border border-purple-400/30 transform scale-105'
                        : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50 hover:scale-102'
                    }`}
                  >
                    {selectedCategory === category.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                    )}
                    <span className={`text-2xl relative z-10 ${selectedCategory === category.id ? 'animate-pulse' : ''}`}>
                      {category.icon}
                    </span>
                    <span className="relative z-10 font-semibold">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products[selectedCategory].map((product, index) => (
                <div
                  key={product.id}
                  className="group bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:transform hover:scale-105 relative overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                  
                  <div className="text-center relative z-10">
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300 group-hover:scale-110">
                        <span className="text-2xl">
                          {selectedCategory === 'chips' ? '🪙' : selectedCategory === 'vip' ? '👑' : '🎁'}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">
                        {product.name}
                      </h3>
                    </div>
                    
                    <div className="mb-6">
                      <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                        {product.amount}
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                        {product.description}
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        {product.price}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">One-time purchase</div>
                    </div>
                    
                    <button 
                      onClick={() => handlePurchase(product)}
                      disabled={!isAuthenticated || purchasing === product.id}
                      className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-300 transform relative overflow-hidden ${
                        !isAuthenticated 
                          ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-500/30'
                          : purchasing === product.id
                          ? 'bg-gray-600/50 text-gray-300 cursor-wait border border-gray-500/30'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-purple-500/25 border border-purple-400/30 hover:scale-105 group-hover:shadow-xl'
                      }`}
                    >
                      {!isAuthenticated || purchasing === product.id ? null : (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      )}
                      <span className="relative z-10 flex items-center justify-center space-x-2">
                        {purchasing === product.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing...</span>
                          </>
                        ) : !isAuthenticated ? (
                          <>
                            <span>🔒</span>
                            <span>Login Required</span>
                          </>
                        ) : (
                          <>
                            <span>🛒</span>
                            <span>Purchase Now</span>
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Features Banner */}
            <div className="mt-16 bg-gradient-to-r from-purple-800/80 via-pink-800/80 to-purple-800/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-purple-500/30 shadow-2xl shadow-purple-500/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10"></div>
              <div className="relative z-10">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-8">
                  Why Choose Our Premium Shop?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="group">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-yellow-500/25 transition-all duration-300 group-hover:scale-110">
                      <span className="text-3xl">⚡</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-200 transition-colors">
                      Instant Delivery
                    </h3>
                    <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                      All purchases are delivered immediately to your account with real-time balance updates
                    </p>
                  </div>
                  
                  <div className="group">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-green-500/25 transition-all duration-300 group-hover:scale-110">
                      <span className="text-3xl">🔒</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-200 transition-colors">
                      Secure Transactions
                    </h3>
                    <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                      Bank-level security with encrypted payments and complete transaction logging
                    </p>
                  </div>
                  
                  <div className="group">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110">
                      <span className="text-3xl">🎯</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-200 transition-colors">
                      Premium Value
                    </h3>
                    <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                      Competitive pricing with exclusive bonuses and special offers for loyal players
                    </p>
                  </div>
                </div>
                
                {/* Additional CTA */}
                <div className="mt-12 p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30">
                  <h3 className="text-xl font-bold text-white mb-2">🎉 Special Launch Offer</h3>
                  <p className="text-gray-300 mb-4">Get 10% bonus chips on your first purchase over $20!</p>
                  <div className="text-sm text-purple-300">
                    * Bonus applied automatically at checkout
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}