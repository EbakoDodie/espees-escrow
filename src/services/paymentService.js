import { CONFIG } from '../constants/config';

export const initFlutterwavePayment = ({
  amount,
  currency,
  email,
  name,
  orderId,
  onSuccess,
  onError,
}) => {
  return {
    public_key: CONFIG.FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: `ESCROW-${orderId}-${Date.now()}`,
    amount,
    currency: currency || 'NGN',
    customer: { email, name },
    customizations: {
      title: 'Espees Escrow',
      description: `Escrow payment for order ${orderId}`,
    },
    callback: onSuccess,
    onclose: onError,
  };
};
