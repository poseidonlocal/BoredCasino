import React from 'react';
import Layout from '../components/Layout';
import Slots from '../components/Slots';
import CashDisplay from '../components/CashDisplay';
import ProtectedRoute from '../components/ProtectedRoute';

export default function SlotsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <CashDisplay />
          </div>
          <Slots />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

