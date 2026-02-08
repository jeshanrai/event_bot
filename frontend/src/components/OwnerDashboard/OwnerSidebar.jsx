import React from 'react';
import Logo from '../Logo';
import {
    LayoutDashboard,
    ShoppingBag,
    Calendar,
    UtensilsCrossed,
    Bot,
    BarChart2,
    Users,
    Plug,
    Settings,
    LogOut
} from 'lucide-react';
import './OwnerDashboard.css';

const OwnerSidebar = ({ activeFrame, onNavigate, onLogout, isOpen }) => {
    const navItems = [
        { id: 'home', label: 'Overview', icon: LayoutDashboard },
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'menu', label: 'Menu Manager', icon: UtensilsCrossed },
        { id: 'ai-settings', label: 'AI Settings', icon: Bot },
        { id: 'analytics', label: 'Analytics', icon: BarChart2 },
        { id: 'staff', label: 'Staff', icon: Users },
        { id: 'connect', label: 'Connect', icon: Plug },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <>
         <aside className="sidebar">
        <NavLink to="/owner">Home</NavLink>
        <NavLink to="/owner/orders">Orders</NavLink>
        <NavLink to="/owner/menu">Menu</NavLink>
        <NavLink to="/owner/ai-settings">AI Settings</NavLink>
        <NavLink to="/owner/analytics">Analytics</NavLink>
        <NavLink to="/owner/staff">Staff</NavLink>
        <NavLink to="/owner/connect">Connect</NavLink>
        <NavLink to="/owner/settings">Settings</NavLink>
      </aside>
        {/* <aside className={`owner-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="owner-logo">
                <Logo size={32} />
                <span>RestaurantAI</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeFrame === item.id ? 'active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </button>
                ))}

                <button className="nav-item nav-item-logout" onClick={onLogout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </nav>
        </aside> */}
        </>
    );
};

export default OwnerSidebar;
