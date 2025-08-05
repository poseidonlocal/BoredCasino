import React from 'react';
import Layout from '../components/Layout';
import Leaderboard from '../components/ui/Leaderboard';
import ProtectedRoute from '../components/ProtectedRoute';

export default function LeaderboardPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <Leaderboard />
      </Layout>
    </ProtectedRoute>
  );
}