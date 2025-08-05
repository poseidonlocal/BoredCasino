import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function WithdrawPage() {
  const router = useRouter();
  const { user, updateUserCash } = useAuth();
  const [amount, setAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('bank_transfer');
  const [accountDetails, setAccountDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: amount, 2: withdrawal details, 3: confirmation
  const [transactionId, setTransactionId] = useState('');
  
  // Redirect to login if not authenticated
  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/auth?redirect=withdraw');
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
      const withdrawalAmount = parseFloat(amount);
      if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        alert('Please enter a valid amount');
        setLoading(false);
        return;
      }
      
      if (withdrawalAmount > user.cashBalance) {
        alert('Insufficient funds');
        setLoading(false);
        return;
      }
      
      // Process withdrawal
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: withdrawalAmount,
          method: withdrawalMethod,
          accountDetails
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update user balance
        await updateUserCash(data.newBalance);
        
        // Generate transaction ID
        setTransactionId(data.transactionId);
        setStep(3); // Move to confirmation
      } else {
        throw new Error(data.error || 'Failed to process withdrawal');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert(error.message || 'There was an error processing your withdrawal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getWithdrawalMethodName = (method) => {
    const methods = {
      bank_transfer: 'Bank Transfer',
      paypal: 'PayPal',
      crypto: 'Cryptocurrency',
      check: 'Check'
    };
    return methods[method] || method;
  };

  const getWithdrawalMethodIcon = (method) => {
    const icons = {
      bank_transfer: '🏦',
      paypal: '🅿️',
      crypto: '₿',
      check: '📄'
    };
    return icons[method] || '💰';
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Withdraw Funds</h1>
        <p className="text-gray-400">Withdraw MSP from your BoredCasino account</p>
        <div className="mt-4 bg-gray-700 rounded-lg p-4">
          <p className="text-white">
            Available Balance: <span className="font-bold text-green-400">{user.cashBalance.toLocaleString()} MSP</span>
          </p>
        </div>
      </div>

      <form onSubmit={() => setStep(2)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Amount
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[100, 500, 1000, 5000].filter(value => value <= user.cashBalance).map((value) => (
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
                max={user.cashBalance}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-400">MSP</span>
              </div>
            </div>
            {amount && parseFloat(amount) > user.cashBalance && (
              <p className="text-red-400 text-sm mt-1">
                Amount exceeds available balance
              </p>
            )}
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setStep(2)}
          variant="primary"
          fullWidth
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > user.cashBalance}
        >
          Continue
        </Button>
      </form>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-yellow-400 text-lg">⚠️</span>
          <div className="text-sm text-yellow-300">
            <p className="font-medium mb-1">Withdrawal Policy</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Minimum withdrawal: 100 MSP</li>
              <li>Processing time: 1-3 business days</li>
              <li>Withdrawal fees may apply</li>
              <li>Identity verification may be required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Withdrawal Method</h1>
        <p className="text-gray-400">Choose how you want to receive {parseFloat(amount).toLocaleString()} MSP</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Withdrawal Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {['bank_transfer', 'paypal', 'crypto', 'check'].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setWithdrawalMethod(method)}
                className={`py-4 px-4 rounded-lg text-center transition-all ${withdrawalMethod === method 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              >
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-2xl">{getWithdrawalMethodIcon(method)}</span>
                  <span>{getWithdrawalMethodName(method)}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Account Details
            </label>
            <textarea
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              placeholder={getAccountDetailsPlaceholder(withdrawalMethod)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows="4"
              required
            />
            <p className="text-gray-400 text-sm mt-1">
              Please provide the necessary account information for your chosen withdrawal method
            </p>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button
            type="button"
            onClick={() => setStep(1)}
            variant="secondary"
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            loading={loading}
            disabled={!accountDetails.trim()}
          >
            Process Withdrawal
          </Button>
        </div>
      </form>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Withdrawal Submitted!</h1>
        <p className="text-gray-400 mb-6">
          Your withdrawal request for {parseFloat(amount).toLocaleString()} MSP has been submitted
        </p>
      </div>

      <div className="bg-gray-700 rounded-lg p-6 max-w-md mx-auto">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Amount:</span>
            <span className="text-white font-bold">{parseFloat(amount).toLocaleString()} MSP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Method:</span>
            <span className="text-white">{getWithdrawalMethodName(withdrawalMethod)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Transaction ID:</span>
            <span className="text-white">{transactionId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Date:</span>
            <span className="text-white">{new Date().toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className="text-yellow-400 font-bold">Pending</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-blue-400 text-lg">ℹ️</span>
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">What happens next?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Your withdrawal will be reviewed within 24 hours</li>
              <li>You'll receive an email confirmation once processed</li>
              <li>Funds will arrive in 1-3 business days</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <Button
          onClick={() => {
            setAmount('');
            setAccountDetails('');
            setStep(1);
          }}
          variant="secondary"
          className="flex-1"
        >
          Make Another Withdrawal
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

  const getAccountDetailsPlaceholder = (method) => {
    const placeholders = {
      bank_transfer: 'Bank Name:\nAccount Number:\nRouting Number:\nAccount Holder Name:',
      paypal: 'PayPal Email Address:',
      crypto: 'Wallet Address:\nCryptocurrency Type:',
      check: 'Mailing Address:\nFull Name:'
    };
    return placeholders[method] || 'Account details...';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </Card>
        </div>
      </div>
    </Layout>
  );
}