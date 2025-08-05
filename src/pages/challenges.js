import React from 'react';
import Layout from '../components/Layout';
import DailyChallenges from '../components/ui/DailyChallenges';
import ProtectedRoute from '../components/ProtectedRoute';

export default function ChallengesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <DailyChallenges />
      </Layout>
    </ProtectedRoute>
  );
}