import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import './styles/globals.css';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <div className="app">
                    <AppRoutes />
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
