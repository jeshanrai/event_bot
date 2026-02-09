import { LogOut, Search, Eye, EyeOff, RefreshCw } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useOrders } from "../components/StaffDashboard/hooks/useOrders";
import ConfirmationModal from "../components/common/ConfirmationModal";
import { notifyError, notifySuccess } from "../components/StaffDashboard/utils/notify";
import "./StaffDashboard.css";

const StaffDashboard = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [searchToken, setSearchToken] = useState("");
  const [popupOrder, setPopupOrder] = useState(null);
  const [highlightToken, setHighlightToken] = useState(null);
  const [showDeliveredCol, setShowDeliveredCol] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  const {
    orders,
    confirmedOrders,
    preparingOrders,
    readyOrders,
    deliveredOrders,
    isLoading,
    fetchOrders,
    updateOrderStatus,
  } = useOrders();

  useEffect(() => {
    fetchOrders();
  }, []);

  // // Auto-close popup after 5s
  // useEffect(() => {
  //   if (!popupOrder) return;
  //   const timer = setTimeout(() => setPopupOrder(null), 10000);
  //   return () => clearTimeout(timer);
  // }, [popupOrder]);

  // Sort orders by creation time
  const confirmed = useMemo(
    () =>
      orders
        .filter((o) => o.status === "confirmed")
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [orders]
  );

  const preparing = useMemo(
    () =>
      orders
        .filter((o) => o.status === "preparing")
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [orders]
  );

  const ready = useMemo(
    () =>
      orders
        .filter((o) => o.status === "ready")
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [orders]
  );

  const delivered = useMemo(
    () =>
      orders
        .filter((o) => o.status === "delivered")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [orders]
  );

  const counts = useMemo(
    () => ({
      confirmed: confirmed.length,
      preparing: preparing.length,
      ready: ready.length,
      delivered: delivered.length,
    }),
    [confirmed, preparing, ready, delivered]
  );

  const calcTotal = (order) => {
    if (typeof order?.totalAmount === "number") return order.totalAmount;
    const items = order?.items || [];
    return items.reduce(
      (sum, it) => sum + (it.quantity || it.qty || 0) * (it.unit_price || 0),
      0
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
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title">Kitchen Dashboard</h1>
            <p className="dashboard-subtitle">
              Welcome back, {user?.name || "Staff"}
            </p>
          </div>

          <div className="header-actions">
            <button
              className="btn-icon btn-refresh"
              onClick={fetchOrders}
              aria-label="Refresh orders"
              title="Refresh orders"
            >
              <RefreshCw size={20} />
            </button>

            <button
              className="btn-icon btn-toggle"
              onClick={() => setShowDeliveredCol(!showDeliveredCol)}
              aria-label="Toggle delivered column"
              title={showDeliveredCol ? "Hide delivered" : "Show delivered"}
            >
              {showDeliveredCol ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>

            <button
              className="btn-logout"
              onClick={() => setIsLogoutModalOpen(true)}
              aria-label="Logout"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="stats-bar">
          <div className="stat-card stat-new">
            <div className="stat-number">{counts.confirmed}</div>
            <div className="stat-label">New Orders</div>
          </div>

          <div className="stat-card stat-preparing">
            <div className="stat-number">{counts.preparing}</div>
            <div className="stat-label">Preparing</div>
          </div>

          <div className="stat-card stat-ready">
            <div className="stat-number">{counts.ready}</div>
            <div className="stat-label">Ready</div>
          </div>

          <div className="stat-card stat-delivered">
            <div className="stat-number">{counts.delivered}</div>
            <div className="stat-label">Delivered</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="number"
              className="search-input"
              placeholder="Search by token number..."
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="search-button" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <main className="orders-container">
        {/* Confirmed Column */}
        <section className="order-column">
          <div className="column-header column-header-new">
            <h2 className="column-title">New Orders</h2>
            <span className="column-badge">{counts.confirmed}</span>
          </div>

          <div className="column-content">
            {confirmed.map((order, index) => (
              <div
                key={order.id}
                className={`order-card ${getPriorityClass(index)} ${
                  highlightToken === order.token ? "highlighted" : ""
                }`}
                onClick={() => openPopup(order)}
              >
                {isPriority(index) && (
                  <div className="priority-badge">
                    {index === 0 ? "🔥 Priority #1" : "⚡ Priority #2"}
                  </div>
                )}

                <div className="order-header">
                  <div className="token-number">#{order.token}</div>
                  <div className="payment-badge">
                    {order.payment_method === "cash" ? "💵 Cash" : "💳 Card"}
                  </div>
                </div>

                <div className="order-items">
                  {(order.items || []).map((item, idx) => (
                    <div className="order-item" key={idx}>
                      <span className="item-name">{item.food_name}</span>
                      <span className="item-qty">×{item.qty ?? item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="order-total">Rs. {calcTotal(order).toFixed(2)}</div>
                </div>

                <button
                  className="action-button action-start"
                  onClick={(e) => {
                    e.stopPropagation();
                    changeStatus(order.id, "preparing", order.status);
                  }}
                  disabled={isLoading && loadingId === order.id}
                >
                  {isLoading && loadingId === order.id ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : (
                    "Start Preparing"
                  )}
                </button>
              </div>
            ))}

            {counts.confirmed === 0 && (
              <div className="empty-state">
                <p>No new orders</p>
              </div>
            )}
          </div>
        </section>

        {/* Preparing Column */}
        <section className="order-column">
          <div className="column-header column-header-preparing">
            <h2 className="column-title">Preparing</h2>
            <span className="column-badge">{counts.preparing}</span>
          </div>

          <div className="column-content">
            {preparing.map((order, index) => (
              <div
                key={order.id}
                className={`order-card ${getPriorityClass(index)} ${
                  highlightToken === order.token ? "highlighted" : ""
                }`}
                onClick={() => openPopup(order)}
              >
                {isPriority(index) && (
                  <div className="priority-badge">
                    {index === 0 ? "🔥 Priority #1" : "⚡ Priority #2"}
                  </div>
                )}

                <div className="order-header">
                  <div className="token-number">#{order.token}</div>
                  <div className="payment-badge">
                    {order.payment_method === "cash" ? "💵 Cash" : "💳 Card"}
                  </div>
                </div>

                <div className="order-items">
                  {(order.items || []).map((item, idx) => (
                    <div className="order-item" key={idx}>
                      <span className="item-name">{item.food_name}</span>
                      <span className="item-qty">×{item.qty ?? item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="order-total">Rs. {calcTotal(order).toFixed(2)}</div>
                </div>

                <button
                  className="action-button action-ready"
                  onClick={(e) => {
                    e.stopPropagation();
                    changeStatus(order.id, "ready", order.status);
                  }}
                  disabled={isLoading && loadingId === order.id}
                >
                  {isLoading && loadingId === order.id ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : (
                    "Mark as Ready"
                  )}
                </button>
              </div>
            ))}

            {counts.preparing === 0 && (
              <div className="empty-state">
                <p>No orders in preparation</p>
              </div>
            )}
          </div>
        </section>

        {/* Ready Column */}
        <section className="order-column">
          <div className="column-header column-header-ready">
            <h2 className="column-title">Ready</h2>
            <span className="column-badge">{counts.ready}</span>
          </div>

          <div className="column-content">
            {ready.map((order, index) => (
              <div
                key={order.id}
                className={`order-card ${getPriorityClass(index)} ${
                  highlightToken === order.token ? "highlighted" : ""
                }`}
                onClick={() => openPopup(order)}
              >
                {isPriority(index) && (
                  <div className="priority-badge priority-badge-pulse">
                    {index === 0 ? "🔥 Call Now!" : "⚡ Next"}
                  </div>
                )}

                <div className="order-header">
                  <div className="token-number">#{order.token}</div>
                  <div className="payment-badge">
                    {order.payment_method === "cash" ? "💵 Cash" : "💳 Card"}
                  </div>
                </div>

                <div className="order-items">
                  {(order.items || []).map((item, idx) => (
                    <div className="order-item" key={idx}>
                      <span className="item-name">{item.food_name}</span>
                      <span className="item-qty">×{item.qty ?? item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="order-total">Rs. {calcTotal(order).toFixed(2)}</div>
                </div>

                <button
                  className="action-button action-deliver"
                  onClick={(e) => {
                    e.stopPropagation();
                    changeStatus(order.id, "delivered", order.status);
                  }}
                  disabled={isLoading && loadingId === order.id}
                >
                  {isLoading && loadingId === order.id ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : (
                    "Deliver Order"
                  )}
                </button>
              </div>
            ))}

            {counts.ready === 0 && (
              <div className="empty-state">
                <p>No orders ready</p>
              </div>
            )}
          </div>
        </section>

        {/* Delivered Column */}
        {showDeliveredCol && (
          <section className="order-column">
            <div className="column-header column-header-delivered">
              <h2 className="column-title">Delivered</h2>
              <span className="column-badge">{counts.delivered}</span>
            </div>

            <div className="column-content">
              {delivered.map((order) => (
                <div
                  key={order.id}
                  className={`order-card order-card-completed ${
                    highlightToken === order.token ? "highlighted" : ""
                  }`}
                  onClick={() => openPopup(order)}
                >
                  <div className="order-header">
                    <div className="token-number">#{order.token}</div>
                    <div className="payment-badge">
                      {order.payment_method === "cash" ? "💵 Cash" : "💳 Card"}
                    </div>
                  </div>

                  <div className="order-items">
                    {(order.items || []).map((item, idx) => (
                      <div className="order-item" key={idx}>
                        <span className="item-name">{item.food_name}</span>
                        <span className="item-qty">×{item.qty ?? item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div className="order-total">Rs. {calcTotal(order).toFixed(2)}</div>
                  </div>

                  <button
                    className="action-button action-complete"
                    onClick={(e) => {
                      e.stopPropagation();
                      changeStatus(order.id, "completed", order.status);
                    }}
                    disabled={isLoading && loadingId === order.id}
                  >
                    {isLoading && loadingId === order.id ? (
                      <>
                        <span className="spinner"></span>
                        Processing...
                      </>
                    ) : (
                      "Complete"
                    )}
                  </button>
                </div>
              ))}

              {counts.delivered === 0 && (
                <div className="empty-state">
                  <p>No delivered orders</p>
                </div>
              )}
            </div>
          </section>
        )}
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
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Order #{popupOrder.token}</h3>
                <p className="modal-subtitle">
                  Payment:{" "}
                  <strong>
                    {popupOrder.payment_method === "cash" ? "Cash" : "Card"}
                  </strong>
                </p>
              </div>
              <span className={`status-badge status-${popupOrder.status}`}>
                {popupOrder.status}
              </span>
            </div>

            <div className="modal-body">
              <div className="modal-row">
                <span>Total Amount</span>
                <span className="modal-total">
                  Rs. {calcTotal(popupOrder).toFixed(2)}
                </span>
              </div>

              <h4 className="modal-items-title">Order Items</h4>
              {(popupOrder.items || []).map((item, idx) => (
                <div className="modal-item" key={idx}>
                  <span className="modal-item-name">{item.food_name}</span>
                  <span className="modal-item-details">
                    ×{item.qty ?? item.quantity} · Rs.{" "}
                    {((item.qty ?? item.quantity) * (item.unit_price || 0)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              {popupOrder.status === "confirmed" && (
                <button
                  className="modal-button modal-button-primary"
                  onClick={() =>
                    changeStatus(popupOrder.id, "preparing", popupOrder.status)
                  }
                >
                  Start Preparing
                </button>
              )}

              {popupOrder.status === "preparing" && (
                <button
                  className="modal-button modal-button-primary"
                  onClick={() =>
                    changeStatus(popupOrder.id, "ready", popupOrder.status)
                  }
                >
                  Mark as Ready
                </button>
              )}

              {popupOrder.status === "ready" && (
                <button
                  className="modal-button modal-button-primary"
                  onClick={() =>
                    changeStatus(popupOrder.id, "delivered", popupOrder.status)
                  }
                >
                  Deliver Order
                </button>
              )}

              {popupOrder.status === "delivered" && (
                <button
                  className="modal-button modal-button-secondary"
                  onClick={() => setPopupOrder(null)}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
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
