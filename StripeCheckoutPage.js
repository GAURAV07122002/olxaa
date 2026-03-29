import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from './PaymentForm';

const stripePromise = loadStripe('YOUR_PUBLIC_STRIPE_KEY');

const StripeCheckoutPage = () => {
    const handleCheckout = async () => {
        const stripe = await stripePromise;
        const response = await fetch('/create-checkout-session', {
            method: 'POST',
        });
        const { id: sessionId } = await response.json();
        const { error } = await stripe.redirectToCheckout({
            sessionId,
        });
        if (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div>
            <h1>Checkout</h1>
            <PaymentForm onCheckout={handleCheckout} />
        </div>
    );
};

export default StripeCheckoutPage;
