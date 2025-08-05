import React from 'react';
import Layout from '../components/Layout';
import Roulette from '../components/Roulette';
import CashDisplay from '../components/CashDisplay';
import ProtectedRoute from '../components/ProtectedRoute';

export default function RoulettePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <CashDisplay />
          </div>
          <Roulette />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

