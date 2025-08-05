import React from 'react';
import Layout from '../components/Layout';
import TournamentSystem from '../components/ui/TournamentSystem';
import ProtectedRoute from '../components/ProtectedRoute';

export default function TournamentsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <TournamentSystem />
      </Layout>
    </ProtectedRoute>
  );
}