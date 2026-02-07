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
        // Fetch all statuses
        const [confirmedRes, preparingRes, readyRes, deliveredRes] =
          await Promise.all([
            api.get(`/orders?status=confirmed&sort=id&order=ASC&limit=20`),
            api.get(`/orders?status=preparing&sort=id&order=ASC&limit=20`),
            api.get(`/orders?status=ready&sort=id&order=ASC&limit=20`),
            api.get(`/orders?status=delivered&sort=id&order=ASC&limit=20`),
          ]);

        const confirmed = confirmedRes.data?.data || confirmedRes.data;
        const preparing = preparingRes.data?.data || preparingRes.data;
        const ready = readyRes.data?.data || readyRes.data;
        const delivered = deliveredRes.data?.data || deliveredRes.data;

        setConfirmedOrders(confirmed);
        setPreparingOrders(preparing);
        setReadyOrders(ready);
        setDeliveredOrders(delivered);
        setOrders([...confirmed, ...preparing, ...ready, ...delivered]);
      } else {
        // Fetch only the status passed
        const res = await api.get(`/orders?status=${status}&sort=id&order=ASC&limit=20`);
        const data = res.data?.data || res.data;

        if (status === "confirmed") setConfirmedOrders(data);
        if (status === "preparing") setPreparingOrders(data);
        if (status === "ready") setReadyOrders(data);
        if (status === "delivered") setDeliveredOrders(data);

        // Update combined orders array
        setOrders((prev) => {
          const filtered = prev.filter((o) => o.status !== status);
          return [...filtered, ...data];
        });
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
      if (showRefreshIndicator) setTimeout(() => setIsRefreshing(false), 500);
    }
  },
  []
);

const updateOrderStatus = async (orderId, newStatus, oldStatus) => {
  setIsLoading(true);
  try {
    await api.patch(`/orders/${orderId}/status`, { status: newStatus });

    // Fetch only old and new status arrays
    const statusesToFetch = [oldStatus, newStatus].filter(Boolean); // avoid undefined
    const requests = statusesToFetch.map((s) =>
      api.get(`/orders?status=${s}&sort=id&order=ASC&limit=20`)
    );
    const results = await Promise.all(requests);

    results.forEach((res, idx) => {
      const data = res.data?.data || res.data;
      const status = statusesToFetch[idx];
      if (status === "confirmed") setConfirmedOrders(data);
      if (status === "preparing") setPreparingOrders(data);
      if (status === "ready") setReadyOrders(data);
      if (status === "delivered") setDeliveredOrders(data);
    });

    // Update combined orders array
    setOrders((prev) => {
      const filtered = prev.filter((o) => o.status !== oldStatus && o.status !== newStatus);
      const combined = results.flatMap((res) => res.data?.data || res.data);
      return [...filtered, ...combined];
    });
  } catch (error) {
    console.error("Failed to update order status:", error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await api.get( `/orders?status=confirmed&sort=id&order=ASC`);
      setConfirmedOrders(res.data?.data || res.data);
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
