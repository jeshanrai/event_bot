import { useState, useEffect, useCallback } from "react";
import api from "../../../services/api";

/**
 * Custom hook for managing orders state and operations
 */
export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [preparingOrders, setPreparingOrders] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = useCallback(
    async (status = "all", showRefreshIndicator = false) => {
      if (showRefreshIndicator) setIsRefreshing(true);

      try {
        if (status === "all") {
          const [confirmedRes, preparingRes, readyRes, deliveredRes] =
            await Promise.all([
              api.get(`/orders?status=confirmed`),
              api.get(`/orders?status=preparing`),
              api.get(`/orders?status=ready`),
              api.get(`/orders?status=delivered`),
            ]);
          setConfirmedOrders(confirmedRes.data);
          setPreparingOrders(preparingRes.data);
          setReadyOrders(readyRes.data);
          setDeliveredOrders(deliveredRes.data);
          setOrders([
            ...confirmedRes.data.data,
            ...preparingRes.data.data,
            ...readyRes.data.data,
            ...deliveredRes.data.data,
          ]);
        } else {
          const res = await api.get(`/orders?status=${status}`);
          if (status === "confirmed") setConfirmedOrders(res.data);
          if (status === "preparing") setPreparingOrders(res.data);
          if (status === "ready") setReadyOrders(res.data);
          if (status === "delivered") setDeliveredOrders(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setIsLoading(false);

        if (showRefreshIndicator) {
          setTimeout(() => setIsRefreshing(false), 500);
        }
      }
    },
    [],
  );

  const updateOrderStatus = async (orderId, newStatus) => {
    // debugger;
    setIsLoading(true);

    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });

      setIsLoading(false);
      fetchOrders();
    } catch (error) {
      console.error("Failed to update order status:", error);
      // Revert changes
      setIsLoading(false);
      throw error;
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await api.get(`/orders?status=confirmed`);
      setConfirmedOrders(res.data);
    }, 10000);
    return () => clearInterval(interval);
  }, [confirmedOrders]);
  return {
    orders,
    confirmedOrders,
    preparingOrders,
    readyOrders,
    deliveredOrders,
    selectedOrder,
    isLoading,
    isRefreshing,

    fetchOrders,
    updateOrderStatus,
    setSelectedOrder,
  };
};
