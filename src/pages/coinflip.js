import React from 'react';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import Coinflip from '../components/Coinflip';

export default function CoinflipPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-dark-950 py-8">
          <Coinflip />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}