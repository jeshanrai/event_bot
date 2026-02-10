import { LogOut, Search, RefreshCw, Eye, EyeOff } from "lucide-react";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useOrders } from "../components/StaffDashboard/hooks/useOrders";
import ConfirmationModal from "../components/common/ConfirmationModal";
import {
  notifyError,
  notifySuccess,
} from "../components/StaffDashboard/utils/notify";
import "./StaffDashboard.css";

const StaffDashboard = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [searchToken, setSearchToken] = useState("");
  const [popupOrder, setPopupOrder] = useState(null);
  const [highlightToken, setHighlightToken] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());
  const [showDelivered, setShowDelivered] = useState(true);

  const { orders, isLoading, confirmedOrders, fetchOrders, updateOrderStatus } =
    useOrders();

  // Polling - fetch orders every 5 seconds
  // useEffect(() => {
  //   const pollInterval = setInterval(() => {
  //     console.log("🔄 Auto-fetching orders...");
  //     fetchOrders();
  //     setLastFetchTime(Date.now());
  //   }, 5000);

  //   return () => clearInterval(pollInterval);
  // }, [fetchOrders]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-close popup after 5s
  // useEffect(() => {
  //   if (!popupOrder) return;
  //   const timer = setTimeout(() => setPopupOrder(null), 5000);
  //   return () => clearTimeout(timer);
  // }, [popupOrder]);

  // Memoized filtered and sorted orders
  const confirmed = useMemo(() => {
    console.log(
      "🔄 Re-computing confirmed orders, total orders:",
      orders.length,
    );
    return orders
      .filter((o) => o.status === "confirmed")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [orders]);

  const preparing = useMemo(() => {
    return orders
      .filter((o) => o.status === "preparing")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [orders]);

  const ready = useMemo(() => {
    return orders
      .filter((o) => o.status === "ready")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [orders]);

  const delivered = useMemo(() => {
    return orders
      .filter((o) => o.status === "delivered")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders]);

  const counts = useMemo(
    () => ({
      confirmed: confirmed.length,
      preparing: preparing.length,
      ready: ready.length,
      delivered: delivered.length,
      total: orders.length,
    }),
    [
      confirmed.length,
      preparing.length,
      ready.length,
      delivered.length,
      orders.length,
    ],
  );

  const calcTotal = (order) => {
    if (typeof order?.totalAmount === "number") return order.totalAmount;
    const items = order?.items || [];
    return items.reduce(
      (sum, it) => sum + (it.quantity || it.qty || 0) * (it.unit_price || 0),
      0,
    );
  };

  const isPriority = (index) => index === 0 || index === 1;

  const getPriorityClass = (index) => {
    if (index === 0) return "priority-1";
    if (index === 1) return "priority-2";
    return "";
  };

  const changeStatus = async (id, newStatus, oldStatus) => {
    setLoadingId(id);
    try {
      await updateOrderStatus(id, newStatus, oldStatus);
      notifySuccess(`Order moved to ${newStatus}`);
      setPopupOrder(null);
      setTimeout(() => fetchOrders(), 500);
    } catch (error) {
      notifyError("Failed to update order status");
    } finally {
      setLoadingId(null);
    }
  };

  const handleSearch = () => {
    const token = Number(searchToken);
    if (!token) {
      notifyError("Please enter a valid token number");
      return;
    }

    const found = orders.find((o) => Number(o.token) === token);
    if (!found) {
      notifyError("Order not found");
      return;
    }

    setHighlightToken(token);
    setPopupOrder(found);
    setSearchToken("");
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const openPopup = (order) => {
    setHighlightToken(order.token);
    setPopupOrder(order);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      notifySuccess("Logged out successfully");
      navigate("/login");
    } catch {
      notifyError("Logout failed");
    }
  };

  const handleManualRefresh = useCallback(() => {
    console.log("🔄 Manual refresh triggered");
    fetchOrders();
    setLastFetchTime(Date.now());
    notifySuccess("Orders refreshed");
  }, [fetchOrders]);

  const getTimeSinceLastFetch = () => {
    const seconds = Math.floor((Date.now() - lastFetchTime) / 1000);
    return seconds;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner-large"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="staff-dashboard">
      {/* Compact Header */}
      <header className="dashboard-header-compact">
        <div className="header-row">
          {/* Left: Title + Stats */}
          <div className="header-left-section">
            <h1 className="dashboard-title-compact">Kitchen Dashboard</h1>

            {/* Inline Stats */}
            <div className="inline-stats">
              <div className="stat-mini stat-confirmed">
                <span className="stat-mini-count">{counts.confirmed}</span>
                <span className="stat-mini-label">New</span>
              </div>
              <div className="stat-mini stat-preparing">
                <span className="stat-mini-count">{counts.preparing}</span>
                <span className="stat-mini-label">Preparing</span>
              </div>
              <div className="stat-mini stat-ready">
                <span className="stat-mini-count">{counts.ready}</span>
                <span className="stat-mini-label">Ready</span>
              </div>
              <div className="stat-mini stat-delivered">
                <span className="stat-mini-count">{counts.delivered}</span>
                <span className="stat-mini-label">Done</span>
              </div>
            </div>
          </div>

          {/* Right: Search + Actions */}
          <div className="header-right-section">
            {/* Compact Search */}
            <div className="search-compact">
              <Search size={16} className="search-icon-compact" />
              <input
                type="number"
                className="search-input-compact"
                placeholder="Token #"
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                maxLength={6}
              />
              <button
                className="search-btn-compact"
                onClick={handleSearch}
                disabled={!searchToken}
              >
                Find
              </button>
            </div>

            {/* Action Buttons */}
            <button
              className="btn-icon-compact"
              onClick={handleManualRefresh}
              title={`Last updated ${getTimeSinceLastFetch()}s ago`}
            >
              <RefreshCw size={18} />
            </button>

            <button
              className="btn-icon-compact"
              onClick={() => setShowDelivered(!showDelivered)}
              title={showDelivered ? "Hide delivered" : "Show delivered"}
            >
              {showDelivered ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>

            <button
              className="btn-logout-compact"
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <LogOut size={16} />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="kitchen-main">
        {/* New Orders Section - Horizontal Row Layout */}
        <section className="new-orders-row">
          <div className="section-header-row">
            <h2 className="section-title-row">
              <span className="pulse-dot"></span>
              New Orders
            </h2>
            <span className="section-count-row">{counts.confirmed}</span>
          </div>

          <div className="orders-horizontal-scroll">
            {confirmedOrders.length === 0 ? (
              <div className="empty-state-row">
                <p>No new orders</p>
              </div>
            ) : (
              confirmedOrders.map((order, index) => (
                <div
                  key={order.id}
                  className={`order-card-row ${getPriorityClass(index)} ${
                    highlightToken === order.token ? "highlighted" : ""
                  }`}
                  onClick={() => {
                    changeStatus(order.id, "preparing", order.status);
                    // openPopup(order);
                  }}
                >
                  {isPriority(index) && (
                    <div className="priority-badge-row">
                      {index === 0 ? "🔥 #1" : "⚡ #2"}
                    </div>
                  )}

                  <div className="card-header-row">
                    <div className="token-row">#{order.token}</div>
                    <div className="payment-row">
                      {order.payment_method === "cash" ? "💵" : "💳"}
                    </div>
                  </div>

                  {/* <div className="card-items-row">
                    {(order.items || []).slice(0, 3).map((item, idx) => (
                      <div className="item-row-row" key={idx}>
                        <span className="item-name-row">{item.food_name}</span>
                        <span className="item-qty-row">
                          ×{item.qty ?? item.quantity}
                        </span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="more-items-row">
                        +{order.items.length - 3} more
                      </div>
                    )}
                  </div> */}
                  <div className="card-footer-row">
                    <div className="total-row-item">
                      <div className="card">
                        {order.items.length}{" "}
                        {order.items.length > 1 ? "Items" : "Item"}
                      </div>
                    </div>
                  </div>

                  <div className="card-footer-row">
                    <div className="total-row">
                      AUD {calcTotal(order).toFixed(2)}
                    </div>
                  </div>

                  {/* <button
                    className="action-btn-row"
                    onClick={(e) => {
                      e.stopPropagation();
                      changeStatus(order.id, "preparing", order.status);
                    }}
                    disabled={isLoading && loadingId === order.id}
                  >
                    {isLoading && loadingId === order.id ? (
                      <span className="spinner-sm"></span>
                    ) : (
                      "Start Preparing"
                    )}
                  </button> */}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Other Orders - Column Layout */}
        <section className="other-orders-grid">
          {/* Preparing Column */}
          <div className="order-column-grid">
            <div className="column-header-grid column-preparing">
              <h3>Preparing</h3>
              <span className="count-badge">{counts.preparing}</span>
            </div>
            <div className="column-content-grid">
              {preparing.length === 0 ? (
                <div className="empty-grid">No orders</div>
              ) : (
                <div className="cards-2col-grid">
                  {preparing.map((order, index) => (
                    <div
                      key={order.id}
                      className={`order-card-grid ${getPriorityClass(index)} ${
                        highlightToken === order.token ? "highlighted" : ""
                      }`}
                      onClick={() => openPopup(order)}
                    >
                      {isPriority(index) && (
                        <div className="priority-badge-grid">
                          {index === 0 ? "🔥" : "⚡"}
                        </div>
                      )}

                      <div className="card-header-grid">
                        <span className="token-grid">#{order.token}</span>
                        <span className="payment-grid">
                          {order.payment_method === "cash" ? "💵" : "💳"}
                        </span>
                      </div>

                      <div className="card-items-grid">
                        {(order.items || []).slice(0, 2).map((item, idx) => (
                          <div key={idx} className="item-grid">
                            {item.food_name} ×{item.qty ?? item.quantity}
                          </div>
                        ))}
                        {order.items?.length > 2 && (
                          <div className="more-grid">
                            +{order.items.length - 2}
                          </div>
                        )}
                      </div>

                      <div className="card-total-grid">
                        AUD {calcTotal(order).toFixed(2)}
                      </div>

                      <button
                        className="action-btn-grid action-ready"
                        onClick={(e) => {
                          e.stopPropagation();
                          changeStatus(order.id, "ready", order.status);
                        }}
                        disabled={isLoading && loadingId === order.id}
                      >
                        {isLoading && loadingId === order.id ? (
                          <span className="spinner-sm"></span>
                        ) : (
                          "Mark Ready"
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ready Column */}
          <div className="order-column-grid">
            <div className="column-header-grid column-ready">
              <h3>Ready for Pickup</h3>
              <span className="count-badge">{counts.ready}</span>
            </div>
            <div className="column-content-grid">
              {ready.length === 0 ? (
                <div className="empty-grid">No orders</div>
              ) : (
                <div className="cards-2col-grid">
                  {ready.map((order, index) => (
                    <div
                      key={order.id}
                      className={`order-card-grid ${getPriorityClass(index)} ${
                        highlightToken === order.token ? "highlighted" : ""
                      }`}
                      onClick={() => openPopup(order)}
                    >
                      {isPriority(index) && (
                        <div className="priority-badge-grid priority-pulse">
                          {index === 0 ? "🔥" : "⚡"}
                        </div>
                      )}

                      <div className="card-header-grid">
                        <span className="token-grid">#{order.token}</span>
                        <span className="payment-grid">
                          {order.payment_method === "cash" ? "💵" : "💳"}
                        </span>
                      </div>

                      <div className="card-items-grid">
                        {(order.items || []).slice(0, 2).map((item, idx) => (
                          <div key={idx} className="item-grid">
                            {item.food_name} ×{item.qty ?? item.quantity}
                          </div>
                        ))}
                        {order.items?.length > 2 && (
                          <div className="more-grid">
                            +{order.items.length - 2}
                          </div>
                        )}
                      </div>

                      <div className="card-total-grid">
                        AUD {calcTotal(order).toFixed(2)}
                      </div>

                      <button
                        className="action-btn-grid action-deliver"
                        onClick={(e) => {
                          e.stopPropagation();
                          changeStatus(order.id, "delivered", order.status);
                        }}
                        disabled={isLoading && loadingId === order.id}
                      >
                        {isLoading && loadingId === order.id ? (
                          <span className="spinner-sm"></span>
                        ) : (
                          "Deliver"
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Delivered Column - With Show/Hide */}
          {showDelivered && (
            <div className="order-column-grid">
              <div className="column-header-grid column-delivered">
                <h3>Delivered</h3>
                <span className="count-badge">{counts.delivered}</span>
              </div>
              <div className="column-content-grid">
                {delivered.length === 0 ? (
                  <div className="empty-grid">No orders</div>
                ) : (
                  <div className="cards-2col-grid">
                    {delivered.slice(0, 20).map((order) => (
                      <div
                        key={order.id}
                        className={`order-card-grid card-completed ${
                          highlightToken === order.token ? "highlighted" : ""
                        }`}
                        onClick={() => openPopup(order)}
                      >
                        <div className="card-header-grid">
                          <span className="token-grid">#{order.token}</span>
                          <span className="payment-grid">
                            {order.payment_method === "cash" ? "💵" : "💳"}
                          </span>
                        </div>

                        <div className="card-items-grid">
                          {(order.items || []).slice(0, 2).map((item, idx) => (
                            <div key={idx} className="item-grid">
                              {item.food_name} ×{item.qty ?? item.quantity}
                            </div>
                          ))}
                        </div>

                        <div className="card-total-grid">
                          AUD {calcTotal(order).toFixed(2)}
                        </div>

                        <button
                          className="action-btn-grid action-complete"
                          onClick={(e) => {
                            e.stopPropagation();
                            changeStatus(order.id, "completed", order.status);
                          }}
                          disabled={isLoading && loadingId === order.id}
                        >
                          {isLoading && loadingId === order.id ? (
                            <span className="spinner-sm"></span>
                          ) : (
                            "Complete"
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Order Details Modal */}
      {popupOrder && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("modal-overlay")) {
              setPopupOrder(null);
            }
          }}
        >
          <div className="modal-content-compact">
            <div className="modal-header-compact">
              <div>
                <h3 className="modal-title-compact">
                  Order #{popupOrder.token}
                </h3>
                <p className="modal-subtitle-compact">
                  {popupOrder.payment_method === "cash"
                    ? "💵 Cash Payment"
                    : "💳 Card Payment"}
                </p>
              </div>
              <span
                className={`status-badge-compact status-${popupOrder.status}`}
              >
                {popupOrder.status}
              </span>
            </div>

            <div className="modal-body-compact">
              <div className="modal-total-row-modal">
                <span>Total Amount</span>
                <span className="modal-total-compact">
                  AUD {calcTotal(popupOrder).toFixed(2)}
                </span>
              </div>

              <div className="modal-items-list">
                {(popupOrder.items || []).map((item, idx) => (
                  <div className="modal-item-row-modal" key={idx}>
                    <span className="modal-item-name">{item.food_name}</span>
                    <span className="modal-item-qty">
                      ×{item.qty ?? item.quantity}
                    </span>
                    <span className="modal-item-price">
                      AUD{" "}
                      {(
                        (item.qty ?? item.quantity) * (item.unit_price || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer-compact">
              {popupOrder.status === "confirmed" && (
                <button
                  className="modal-btn-compact modal-btn-primary"
                  onClick={() =>
                    changeStatus(popupOrder.id, "preparing", popupOrder.status)
                  }
                >
                  Start Preparing
                </button>
              )}

              {popupOrder.status === "preparing" && (
                <button
                  className="modal-btn-compact modal-btn-primary"
                  onClick={() =>
                    changeStatus(popupOrder.id, "ready", popupOrder.status)
                  }
                >
                  Mark as Ready
                </button>
              )}

              {popupOrder.status === "ready" && (
                <button
                  className="modal-btn-compact modal-btn-primary"
                  onClick={() =>
                    changeStatus(popupOrder.id, "delivered", popupOrder.status)
                  }
                >
                  Deliver Order
                </button>
              )}

              <button
                className="modal-btn-compact modal-btn-secondary"
                onClick={() => setPopupOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        isDestructive={true}
      />
    </div>
  );
};

export default StaffDashboard;
