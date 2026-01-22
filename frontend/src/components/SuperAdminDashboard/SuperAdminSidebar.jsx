import React from 'react';
import { LayoutDashboard, Users, BrainCircuit, CreditCard, LogOut, Settings, ShoppingCart, TrendingUp } from 'lucide-react';
import Logo from '../Logo';
import './SuperAdminDashboard.css';

const SuperAdminSidebar = ({ activeFrame, onNavigate, onLogout }) => {
    const navItems = [
        { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
        { id: 'ai-usage', label: 'AI Usage', icon: BrainCircuit },
        { id: 'revenue', label: 'Revenue', icon: TrendingUp },
        { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <aside className="sa-sidebar">
            <div className="sa-logo-container">
                <Logo size={32} />
                <span className="sa-logo-text">SuperAdmin</span>
            </div>

            <nav className="sa-nav-container">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`sa-nav-item ${activeFrame === item.id ? 'active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </button>
                ))}

                <button className="sa-nav-item sa-nav-logout" onClick={onLogout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </nav>
        </aside>
    );
};

export default SuperAdminSidebar;
