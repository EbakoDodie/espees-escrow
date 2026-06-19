import React, { createContext, useState } from 'react';
export const OrderContext = createContext();
export function OrderProvider({ children }) {
  const [activeOrders, setActiveOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  return (
    <OrderContext.Provider value={{ activeOrders, setActiveOrders, pendingOrders, setPendingOrders }}>
      {children}
    </OrderContext.Provider>
  );
}
