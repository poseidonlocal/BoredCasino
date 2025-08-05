import React from 'react';
import Layout from '../components/Layout';
import StatsDashboard from '../components/ui/StatsDashboard';
import ProtectedRoute from '../components/ProtectedRoute';

export default function StatsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="gaming-header mb-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  📊 Gaming Statistics
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-4">
                Track your performance and achievements across all games
              </p>
              <div className="flex justify-center items-center space-x-4 text-sm text-gray-400">
                <div>Real-time analytics</div>
                <div>•</div>
                <div>Detailed insights</div>
                <div>•</div>
                <div>Progress tracking</div>
              </div>
            </div>
          </div>

          {/* Stats Dashboard */}
          <StatsDashboard />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}