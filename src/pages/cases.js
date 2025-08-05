import React from 'react';
import Layout from '../components/Layout';
import CaseOpening from '../components/CaseOpening';
import ProtectedRoute from '../components/ProtectedRoute';

export default function CasesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <CaseOpening />
      </Layout>
    </ProtectedRoute>
  );
}