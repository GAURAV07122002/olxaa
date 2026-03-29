import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_KEY);

const CheckoutForm = ({ amount, productId, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    createPaymentIntent();
  }, [amount]);

  const createPaymentIntent = async () => {
    try {
      const response = await axios.post(
        `\${process.env.REACT_APP_API_URL}/api/payments/create-intent`,
        { amount, productId },
        {
          headers: {
            Authorization: `Bearer \${localStorage.getItem('token')}`
          }
        }
      );
      setClientSecret(response.data.clientSecret);
    } catch (err) {
      setError('Failed to initialize payment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      const { paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Test User'
          }
        }
      });

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        await axios.post(
          `\${process.env.REACT_APP_API_URL}/api/payments/confirm`,
          {
            paymentIntentId: paymentIntent.id,
            productId,
            amount
          },
          {
            headers: {
              Authorization: `Bearer \${localStorage.getItem('token')}`
            }
          }
        );

        onSuccess(paymentIntent);
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm font-medium text-red-800">{error}</div>
        </div>
      )}

      <div className="border border-gray-300 rounded-lg p-4">
        <CardElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay ₹\${amount}`}
      </button>
    </form>
  );
};

const Checkout = ({ amount, productId, onSuccess }) => {
  return (
    <Elements stripe={stripePromise}>
      <div className="max-w-md mx-auto py-12">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>
          <CheckoutForm 
            amount={amount} 
            productId={productId} 
            onSuccess={onSuccess}
          />
        </div>
      </div>
    </Elements>
  );
};

export default Checkout;