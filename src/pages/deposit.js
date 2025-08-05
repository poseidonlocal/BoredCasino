import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function DepositPage() {
  const router = useRouter();
  const { user, updateUserCash } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: amount, 2: confirmation
  const [transactionId, setTransactionId] = useState('');

  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/auth?redirect=deposit');
    }
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner text="Please login to continue..." />
        </div>
      </Layout>
    );
  }

  const handleAmountSelect = (selectedAmount) => {
    setAmount(selectedAmount.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const depositAmount = parseFloat(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        alert('Please enter a valid amount');
        setLoading(false);
        return;
      }

      const newBalance = (user.cashBalance || 0) + depositAmount;

      // In a real app, you would process payment here.
      // For this demo, we'll just update the balance.
      
      const success = await updateUserCash(newBalance);

      if (success) {
        // Log the deposit transaction
        await fetch('/api/logging/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: 'deposit',
            amount: depositAmount,
            description: `Deposit of ${depositAmount} MSP via ${paymentMethod.replace('_', ' ')}`
          })
        });

        setTransactionId(`DEP-${Date.now().toString().slice(-8)}`);
        setStep(2);
      } else {
        throw new Error('Failed to update balance');
      }
    } catch (error) {
      console.error('Deposit error:', error);
      alert(error.message || 'There was an error processing your deposit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodName = (method) => {
    const methods = {
      credit_card: 'Credit Card',
      paypal: 'PayPal',
      crypto: 'Cryptocurrency',
    };
    return methods[method] || method;
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      credit_card: '💳',
      paypal: '🅿️',
      crypto: '₿',
    };
    return icons[method] || '💰';
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Deposit Funds</h1>
        <p className="text-gray-400">Add MSP to your BoredCasino account</p>
        <div className="mt-4 bg-gray-700 rounded-lg p-4">
          <p className="text-white">
            Current Balance: <span className="font-bold text-green-400">{user.cashBalance.toLocaleString()} MSP</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Amount
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[100, 500, 1000, 5000].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleAmountSelect(value)}
                className={`py-3 px-4 rounded-lg text-center transition-all ${amount === value.toString()
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              >
                {value.toLocaleString()} MSP
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Or Enter Custom Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                min="1"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-400">MSP</span>
              </div>
            </div>
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {['credit_card', 'paypal', 'crypto'].map((method) => (
                <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-4 px-4 rounded-lg text-center transition-all ${paymentMethod === method 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                >
                    <div className="flex items-center justify-center space-x-3">
                    <span className="text-2xl">{getPaymentMethodIcon(method)}</span>
                    <span>{getPaymentMethodName(method)}</span>
                    </div>
                </button>
                ))}
            </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          disabled={!amount || parseFloat(amount) <= 0}
        >
          Deposit {amount ? parseFloat(amount).toLocaleString() : ''} MSP
        </Button>
      </form>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
        <span className="text-4xl">✓</span>
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">Deposit Successful!</h1>
      <p className="text-gray-400 mb-6">
        {parseFloat(amount).toLocaleString()} MSP has been added to your account.
      </p>

      <div className="bg-gray-700 rounded-lg p-6 max-w-md mx-auto">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Amount:</span>
            <span className="text-white font-bold">{parseFloat(amount).toLocaleString()} MSP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Method:</span>
            <span className="text-white">{getPaymentMethodName(paymentMethod)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Transaction ID:</span>
            <span className="text-white">{transactionId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">New Balance:</span>
            <span className="text-green-400 font-bold">{user.cashBalance.toLocaleString()} MSP</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <Button
          onClick={() => {
            setAmount('');
            setStep(1);
          }}
          variant="secondary"
          className="flex-1"
        >
          Make Another Deposit
        </Button>
        <Button
          onClick={() => router.push('/')}
          variant="primary"
          className="flex-1"
        >
          Return to BoredCasino
        </Button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            {step === 1 ? renderStep1() : renderStep2()}
          </Card>
        </div>
      </div>
    </Layout>
  );
}