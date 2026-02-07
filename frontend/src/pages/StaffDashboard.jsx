import { LogOut } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useOrders } from "../components/StaffDashboard/hooks/useOrders";
import ConfirmationModal from "../components/common/ConfirmationModal";
import "./StaffDashboard.css";
import "./priority-styles.css";
import { notifyError, notifyLoading, notifySuccess } from "../components/StaffDashboard/utils/notify";

const StaffDashboard = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // New UI states
  const [searchToken, setSearchToken] = useState("");
  const [popupOrder, setPopupOrder] = useState(null);
  const [highlightToken, setHighlightToken] = useState(null);
  const [showDeliveredCol, setShowDeliveredCol] = useState(true);
  const [loadingId, setLoadingId] = useState(null);

  const openLogoutModal = () => setIsLogoutModalOpen(true);
  const closeLogoutModal = () => setIsLogoutModalOpen(false);

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      notifySuccess("Logged out successfully");
      navigate("/login");
    } catch {
      notifyError("Logout failed");
    }
  };
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

  // Auth guard
  

  //   useEffect(() => {
  //   if (loading) return; // Wait until loading is complete

  //   if (!user) {
  //     // User is not logged in - redirect to login
  //     navigate("/login");
  //   } else {
  //     // Check user roles for authorized access
  //     const authorizedRoles = ["staff", "superadmin", "restaurant_owner"];

  //     if (authorizedRoles.includes(user.role)) {
  //       // User is logged in and has authorized role - redirect to dashboard
  //       navigate("/dashboard");
  //     } else {
  //       // User is logged in but doesn't have authorized role - redirect to home
  //       navigate("/");
  //     }
  //   }
  // }, [user, loading, navigate]);

  // Auto-close popup after 5s
  useEffect(() => {
    if (!popupOrder) return;
    const timer = setTimeout(() => setPopupOrder(null), 5000);
    return () => clearTimeout(timer);
  }, [popupOrder]);

  // Split orders by status and SORT by creation time (oldest first)
  const confirmed = useMemo(
    () =>
      orders
        .filter((o) => o.status === "confirmed")
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [orders],
  );

  const preparing = useMemo(
    () =>
      orders
        .filter((o) => o.status === "preparing")
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [orders],
  );

  const ready = useMemo(
    () =>
      orders
        .filter((o) => o.status === "ready")
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [orders],
  );

  const delivered = useMemo(
    () =>
      orders
        .filter((o) => o.status === "delivered")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), // Newest first for delivered
    [orders],
  );

  const counts = useMemo(
    () => ({
      confirmed: (confirmedOrders || []).length,
      preparing: (preparingOrders || []).length,
      ready: (readyOrders || []).length,
      delivered: (deliveredOrders || []).length,
    }),
    [
      confirmedOrders,
      preparingOrders,
      readyOrders,
      deliveredOrders,
    ],
  );

  // Total helper
  const calcTotal = (order) => {
    if (typeof order?.totalAmount === "number") return order.totalAmount;
    const items = order?.items || [];
    return items.reduce(
      (sum, it) => sum + (it.quantity || it.qty || 0) * (it.unit_price || 0),
      0,
    );
  };

  // Check if order is high priority (first or second)
  const isPriority = (index) => index === 0 || index === 1;

  // Get priority level for styling
  const getPriorityClass = (index) => {
    if (index === 0) return "sd-priority-1"; // Highest priority
    if (index === 1) return "sd-priority-2"; // Second priority
    return "";
  };

  // Status change
  // const changeStatus = async (id, newStatus, oldStatus) => {
  //   setLoadingId(id);
  //   // const loadingToastId = notifyLoading("Updating order status...");
  //   try {
  //     await updateOrderStatus(id, newStatus, oldStatus);
  //     notifySuccess(`Order send to ${newStatus} successfully`);
  //     setPopupOrder(null);
  //   } catch (error) {
  //     notifyError("Failed to update order status. Please try again.");
  //   } finally {
  //     setLoadingId(null);
  //     toast.dismiss(loadingToastId);
  //   }
  // };

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

  // Search: open popup
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
  };

  // Open popup from card click
  const openPopup = (order) => {
    setHighlightToken(order.token);
    setPopupOrder(order);
  };

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="modern-staff-dashboard">
      <div className="dashboard-layout sidebar-hidden">
        <main className="order-details-main">
          <div className="sd-header">
            <button
              className="logout"
              onClick={openLogoutModal}
              aria-label="Logout"
            >
              Logout
              <LogOut />
            </button>
          </div>

          {/* Top row: summary pills + search */}
          <div className="sd-top-row">
            <div className="sd-pill-row">
              <div className="sd-pill sd-pill-created">
                <span className="sd-pill-count">{counts.confirmed}</span>
                <span className="sd-pill-label">New Orders</span>
              </div>
              <div className="sd-pill sd-pill-confirmed">
                <span className="sd-pill-count">{counts.preparing}</span>
                <span className="sd-pill-label">Preparing</span>
              </div>
              <div className="sd-pill sd-pill-ready">
                <span className="sd-pill-count">{counts.ready}</span>
                <span className="sd-pill-label">Ready</span>
              </div>
              <div className="sd-pill sd-pill-delivered">
                <span className="sd-pill-count">{counts.delivered}</span>
                <span className="sd-pill-label">Delivered</span>
                <button
                  className="sd-eye-btn"
                  title={
                    showDeliveredCol
                      ? "Hide delivered column"
                      : "Show delivered column"
                  }
                  onClick={() => setShowDeliveredCol((v) => !v)}
                >
                  {showDeliveredCol ? "👁‍🗨" : "👁"}
                </button>
              </div>
            </div>

            <div className="sd-search">
              <input
                className="sd-search-input"
                type="number"
                placeholder="Token ID"
                value={searchToken}
                onChange={(e) => setSearchToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button className="sd-search-btn" onClick={handleSearch}>
                Search
              </button>
            </div>
          </div>

          {/* {isLoading && <div className="sd-loading-bar">Loading orders…</div>} */}

          {/* New Orders Section (Horizontal Scroll) */}
          <div className="sd-board sd-board-compact">
            <section className="sd-col-new sd-col-compact">
              <div className="sd-col-head">
                <span>New Orders</span>
                <span className="sd-col-badge sd-col-badge-created ">{counts.confirmed}</span>
              </div>

              <div className="sd-col-scroll-horizontal">
                <div className="sd-grid-horizontal" title="Click to Accept">
                  {(confirmedOrders || []).map((o, index) => (
                    <div
                      key={o.token}
                      className={`sd-card sd-card-confirmed sd-card-small ${getPriorityClass(index)} ${highlightToken === o.token ? "sd-card-highlight" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        changeStatus(o.id, "preparing", o.status);
                      }}
                    >
                      {/* Priority Badge */}
                      {isPriority(index) && (
                        <div className="sd-priority-badge">
                          {index === 0 ? "🔥 URGENT" : "⚡ NEXT"}
                        </div>
                      )}

                      <div className="sd-card-title">Token #{o.token}</div>

                      <div className="sd-card-foot sd-col-badge-confirmed">
                        <span className="sd-total">
                          ${calcTotal(o).toFixed(2)}
                        </span>
                        <span className="sd-pay">
                          {o.payment_method === "cash" ? "Cash" : "Online"}
                        </span>
                      </div>
                    </div>
                  ))}

                  {counts.confirmed === 0 && (
                    <div className="sd-empty">No new orders</div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Main Board Columns */}
          <div
            className={`sd-board ${showDeliveredCol ? "sd-board-3" : "sd-board-2"}`}
          >
            {/* Confirmed Column */}
            <section className="sd-col">
              <div className="sd-col-head">
                <span>Preparing</span>
                <span className="sd-col-badge sd-col-badge-confirmed">{counts.preparing}</span>
              </div>

              <div className="sd-col-scroll">
                <div className="sd-grid">
                  {(preparingOrders || []).map((o, index) => (
                    <div
                      key={o.token}
                      className={`sd-card sd-card-confirmed ${getPriorityClass(index)} ${highlightToken === o.token ? "sd-card-highlight" : ""}`}
                      onClick={() => openPopup(o)}
                    >
                      {/* Priority Badge */}
                      {isPriority(index) && (
                        <div className="sd-priority-badge">
                          {index === 0 ? "🔥 #1" : "⚡ #2"}
                        </div>
                      )}

                      <div className="sd-card-title">Token #{o.token}</div>

                      <div className="sd-card-items">
                        {(o.items || []).map((it, idx) => (
                          <div className="sd-item" key={idx}>
                            <span>{it.food_name}</span>
                            <span>×{it.qty ?? it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="sd-card-foot">
                        <span className="sd-total">
                          ${calcTotal(o).toFixed(2)}
                        </span>
                        <span className="sd-pay">
                          {o.payment_method === "cash" ? "Cash" : "Online"}
                        </span>
                      </div>

                      <div className="sd-card-actions">
                        <button
                          className="sd-btn sd-btn-confirmed sd-btn-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            changeStatus(o.id, "ready", o.status);
                          }}
                          disabled={isLoading && loadingId === o.id}
                        >
                          {isLoading && loadingId === o.id ? (
                            <>
                              <span className="spinner"></span> Processing...
                            </>
                          ) : (
                            "Ready"
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  {counts.preparing === 0 && (
                    <div className="sd-empty">No orders</div>
                  )}
                </div>
              </div>
            </section>

            {/* Ready Column */}
            <section className="sd-col">
              <div className="sd-col-head">
                <span>Ready</span>
                <span className="sd-col-badge sd-col-badge-ready">{counts.ready}</span>
              </div>

              <div className="sd-col-scroll">
                <div className="sd-grid">
                  {(readyOrders || []).map((o, index) => (
                    <div
                      key={o.token}
                      className={`sd-card sd-card-ready ${getPriorityClass(index)} ${highlightToken === o.token ? "sd-card-highlight" : ""}`}
                      onClick={() => openPopup(o)}
                    >
                      {/* Priority Badge */}
                      {isPriority(index) && (
                        <div className="sd-priority-badge sd-priority-badge-ready">
                          {index === 0 ? "🔥 #1" : "⚡ #2"}
                        </div>
                      )}

                      <div className="sd-card-title">Token #{o.token}</div>

                      <div className="sd-card-items">
                        {(o.items || []).map((it, idx) => (
                          <div className="sd-item" key={idx}>
                            <span>{it.food_name}</span>
                            <span>×{it.qty ?? it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="sd-card-foot">
                        <span className="sd-total">
                          ${calcTotal(o).toFixed(2)}
                        </span>
                        <span className="sd-pay">
                          {o.payment_method === "cash" ? "Cash" : "Online"}
                        </span>
                      </div>

                      <div className="sd-card-actions">
                        <button
                          className="sd-btn sd-btn-ready sd-btn-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            changeStatus(o.id, "delivered", o.status);
                          }}
                          disabled={isLoading && loadingId === o.id}
                        >
                          {isLoading && loadingId === o.id ? (
                            <>
                              <span className="spinner"></span> Processing...
                            </>
                          ) : (
                            "Deliver"
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  {counts.ready === 0 && (
                    <div className="sd-empty">No orders</div>
                  )}
                </div>
              </div>
            </section>

            {/* Delivered Column */}
            {showDeliveredCol && (
              <section className="sd-col">
                <div className="sd-col-head">
                  <span>Delivered</span>
                  <span className="sd-col-badge sd-col-badge-delivered">{counts.delivered}</span>
                </div>

                <div className="sd-col-scroll">
                  <div className="sd-grid">
                    {(deliveredOrders || []).map((o, index) => (
                      <div
                        key={o.token}
                        className={`sd-card sd-card-delivered ${highlightToken === o.token ? "sd-card-highlight" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          changeStatus(o.id, "confirmed", o.status);
                        }}
                      >

                        <div className="sd-card-title">Token #{o.token}</div>

                        <div className="sd-card-items">
                          {(o.items || []).map((it, idx) => (
                            <div className="sd-item" key={idx}>
                              <span>{it.food_name}</span>
                              <span>×{it.qty ?? it.quantity}</span>
                            </div>
                          ))}
                        </div>

                        <div className="sd-card-foot">
                          <span className="sd-total">
                            ${calcTotal(o).toFixed(2)}
                          </span>
                          <span className="sd-pay">
                            {o.payment_method === "cash" ? "Cash" : "Online"}
                          </span>
                        </div>

                      </div>
                    ))}

                    {counts.delivered === 0 && (
                      <div className="sd-empty">No orders</div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Popup Modal */}
          {popupOrder && (
            <div
              className="sd-popup-backdrop"
              onMouseDown={(e) => {
                if (e.target.classList.contains("sd-popup-backdrop")) {
                  setPopupOrder(null);
                }
              }}
            >
              <div className="sd-popup">
                <div className="sd-pop-head">
                  <div>
                    <div className="sd-pop-title">
                      Token #{popupOrder.token}
                    </div>
                    <div className="sd-pop-sub">
                      Payment:{" "}
                      <b>
                        {popupOrder.payment_method === "cash"
                          ? "Cash"
                          : popupOrder.payment_method === "online"
                            ? "Online"
                            : "N/A"}
                      </b>
                    </div>
                  </div>
                  <span className={`sd-pop-status sd-pop-${popupOrder.status}`}>
                    {popupOrder.status.toUpperCase()}
                  </span>
                </div>

                <div className="sd-pop-body">
                  <div className="sd-pop-row">
                    <span>Total</span>
                    <span className="sd-pop-total">
                      ${calcTotal(popupOrder).toFixed(2)}
                    </span>
                  </div>

                  <div className="sd-pop-items-title">Items</div>
                  {(popupOrder.items || []).map((it, idx) => (
                    <div className="sd-pop-item" key={idx}>
                      <span>{it.food_name}</span>
                      <span>
                        ×{it.qty ?? it.quantity} ($
                        {(
                          (it.qty ?? it.quantity) * (it.unit_price || 0)
                        ).toFixed(2)}
                        )
                      </span>
                    </div>
                  ))}
                </div>

                <div className="sd-pop-foot">
                  {popupOrder.status === "preparing" && (
                    <button
                      className="sd-btn sd-btn-confirmed sd-btn-full"
                      onClick={() => changeStatus(popupOrder.id, "ready", popupOrder.status)}
                    >
                      Ready
                    </button>
                  )}

                  {popupOrder.status === "ready" && (
                    <button
                      className="sd-btn sd-btn-ready sd-btn-full"
                      onClick={() => changeStatus(popupOrder.id, "delivered", popupOrder.status)}
                    >
                      Deliver
                    </button>
                  )}

                  {popupOrder.status === "delivered" && (
                    <button
                      className="sd-btn sd-btn-ghost sd-btn-full"
                      onClick={() => setPopupOrder(null)}
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        <ConfirmationModal
          isOpen={isLogoutModalOpen}
          onClose={closeLogoutModal}
          onConfirm={handleLogoutConfirm}
          title="Confirm Logout"
          message="Are you sure you want to log out?"
          confirmText="Logout"
          isDestructive={true}
        />
      </div>
    </div>
  );
};

export default StaffDashboard;
