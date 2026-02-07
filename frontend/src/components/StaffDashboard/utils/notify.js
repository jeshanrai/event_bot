// utils/notify.js
import toast from "react-hot-toast";
import "./notify.css"; // Import the CSS file for custom styles

// common small badge style
const baseStyle = {
  padding: "6px 12px",
  fontSize: "13px",
  borderRadius: "20px",
  fontWeight: "500",
  minWidth: "fit-content",
};

/**
 * SUCCESS
 */
export const notifySuccess = (message) => {
  toast.success(message, {
    duration: 4000,
    position: "top-right",
    style: {
      ...baseStyle,
      background: "#16a34a", // green
      color: "#fff",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#16a34a",
    },
    // ✅ Animation options
    className: 'toast-success',
  });
};

/**
 * ERROR
 */
export const notifyError = (message) => {
  toast.error(message, {
    duration: 2500,
    position: "top-right",
    style: {
      ...baseStyle,
      background: "#dc2626", // red
      color: "#fff",
    },
    iconTheme: {
      primary: "#fff",
      secondary: "#dc2626",
    },
    className: 'toast-error',
  });
};

/**
 * LOADING
 */
export const notifyLoading = (message) => {
  return toast.loading(message, {
    duration: 3000,
    position: "top-right",
    style: {
      ...baseStyle,
      background: "#2563eb", // blue
      color: "#fff",
    },
    className: 'toast-loading',
  });
};

/**
 * UPDATE / DISMISS
 */
export const notifyUpdate = (id, message, type) => {
  toast.dismiss(id);
  if (type === "success") notifySuccess(message);
  if (type === "error") notifyError(message);
};