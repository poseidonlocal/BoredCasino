import React from 'react';
import Layout from '../components/Layout';
import AdminMaker from '../components/admin/AdminMaker';

export default function AdminSetupPage() {
  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Admin Setup
            </h1>
            <p className="text-gray-300 text-lg">
              Set up admin access and fix database issues
            </p>
          </div>
          
          <AdminMaker />
        </div>
      </div>
    </Layout>
  );
}