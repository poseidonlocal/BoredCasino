import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import AdminDashboard from '../components/admin/AdminDashboard';
import UserManagement from '../components/admin/UserManagement';
import GameAnalytics from '../components/admin/GameAnalytics';
import SystemSettings from '../components/admin/SystemSettings';
import ActivityLogs from '../components/admin/ActivityLogs';
import SecurityLogs from '../components/admin/SecurityLogs';
import TransactionLogs from '../components/admin/TransactionLogs';
import WithdrawalManagement from '../components/admin/WithdrawalManagement';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const AdminPanel = () => {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');

    const isAdmin = user?.isAdmin || user?.is_admin;

    useEffect(() => {
        const logAdminAccessAttempt = async (loggedInUser = null) => {
            try {
                const ipResponse = await fetch('/api/get-ip');
                const ipData = await ipResponse.json();
                
                const logPayload = {
                    userId: loggedInUser ? loggedInUser.id : null,
                    username: loggedInUser ? loggedInUser.username : null,
                    ipAddress: ipData.ip || 'unknown',
                    userAgent: navigator.userAgent,
                    attemptType: 'unauthorized_access',
                    details: { path: '/admin', reason: loggedInUser ? 'User is not an admin' : 'User not authenticated' }
                };

                await fetch('/api/admin/security-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(logPayload),
                });
            } catch (error) {
                console.error('Failed to log security incident:', error);
            }
        };

        if (loading) {
            return; // Wait until authentication status is determined
        }

        // Log and redirect if not authenticated
        if (!isAuthenticated) {
            logAdminAccessAttempt(null);
            router.push('/auth?redirect=/admin');
            return;
        }

        // Log and redirect if authenticated but not an admin
        if (!isAdmin) {
            logAdminAccessAttempt(user);
            router.push('/');
            return;
        }

    }, [loading, isAuthenticated, isAdmin, user, router]);

    // Show a loading or access denied state while checks are running
    if (loading || !isAuthenticated || !isAdmin) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-screen">
                    <LoadingSpinner text="Verifying access..." />
                </div>
            </Layout>
        );
    }
    
    const tabs = [
        { id: 'dashboard', name: 'Dashboard', icon: '📊' },
        { id: 'users', name: 'User Management', icon: '👥' },
        { id: 'analytics', name: 'Game Analytics', icon: '📈' },
        { id: 'withdrawals', name: 'Withdrawals', icon: '💸' },
        { id: 'settings', name: 'System Settings', icon: '⚙️' },
        { id: 'logs', name: 'Activity Logs', icon: '📋' },
        { id: 'transactions', name: 'Transaction Logs', icon: '💰' },
        { id: 'security', name: 'Security Logs', icon: '🔒' }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <AdminDashboard />;
            case 'users':
                return <UserManagement />;
            case 'analytics':
                return <GameAnalytics />;
            case 'settings':
                return <SystemSettings />;
            case 'logs':
                return <ActivityLogs />;
            case 'transactions':
                return <TransactionLogs />;
            case 'security':
                return <SecurityLogs />;
            case 'withdrawals':
                return <WithdrawalManagement />;
            default:
                return <AdminDashboard />;
        }
    };

    return (
        <Layout>
            <div className="min-h-screen bg-casino-dark">
                {/* Admin Header */}
                <div className="bg-gray-900 border-b border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                <h1 className="text-2xl font-bold text-casino-gold">
                                    🎰 BoredCasino Admin Panel
                                </h1>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-300">Welcome, {user?.username}</span>
                                <div className="w-8 h-8 bg-casino-gold rounded-full flex items-center justify-center">
                                    <span className="text-casino-dark font-bold">
                                        {user?.username?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-gray-800 border-b border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex space-x-8 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'border-casino-gold text-casino-gold'
                                            : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                                    }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {renderContent()}
                </div>
            </div>
        </Layout>
    );
};

export default AdminPanel;