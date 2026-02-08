import { Outlet, Link } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div>
      <h2>Dashboard</h2>

      <nav>
        <Link to="/dashboard">Home</Link> |{" "}
        <Link to="/dashboard/orders">Orders</Link> |{" "}
        <Link to="/dashboard/settings">Settings</Link>
      </nav>

      <hr />

      <Outlet />
    </div>
  );
};

export default DashboardLayout;