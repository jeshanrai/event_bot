import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import './styles/globals.css';
import  {Toaster} from "react-hot-toast";
import  './components/StaffDashboard/utils/notify.css';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <div className="app">
                    <Toaster
                        position="top-left"
                        toastOptions={{
                            duration: 3000,
                        }}
                    />
                    <AppRoutes />
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
