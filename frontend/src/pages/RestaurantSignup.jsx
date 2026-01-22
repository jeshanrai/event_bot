import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import AuthLayout from '../components/AuthLayout';
import InfoStep from '../components/Signup/InfoStep';
import MenuStep from '../components/Signup/MenuStep';
import ConnectStep from '../components/Signup/ConnectStep';
import DoneStep from '../components/Signup/DoneStep';
import { Check } from 'lucide-react';

const RestaurantSignup = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        restaurantName: '',
        address: '',
        phone: '',
        type: 'dine-in',
        menuSource: 'manual',
        whatsappConnected: false,
        webWidgetEnabled: false
    });

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const updateData = (data) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const renderProgressIndicator = () => {
        if (step === 4) return null; // Don't show progress on success screen

        const steps = [
            { number: 1, label: 'Info' },
            { number: 2, label: 'Menu' },
            { number: 3, label: 'Connect' }
        ];

        return (
            <div className="wizard-progress">
                {steps.map((s) => (
                    <div key={s.number} className="wizard-step">
                        <div className={`wizard-step-circle ${step === s.number ? 'active' : ''} ${step > s.number ? 'completed' : ''}`}>
                            {step > s.number ? <Check size={20} /> : s.number}
                        </div>
                        <span className="wizard-step-label">{s.label}</span>
                    </div>
                ))}
            </div>
        );
    };

    const { register } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleComplete = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Register as restaurant owner
            // Mapping restaurantName to username for simplicity, or we could separate them
            // Register as restaurant owner
            // Pass all form data. Map restaurantName to username if backend expects 'username'
            const registrationPayload = {
                username: formData.restaurantName, // Using restaurant name as username
                restaurant_name: formData.restaurantName,
                email: formData.email,
                password: formData.password,
                address: formData.address,
                phone: formData.phone,
                role: 'restaurant_owner'
            };
            await register(registrationPayload);
            nextStep();
        } catch (err) {
            console.error("Registration failed", err);
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return <InfoStep data={formData} updateData={updateData} next={nextStep} />;
            case 2:
                return <MenuStep data={formData} updateData={updateData} next={nextStep} back={prevStep} />;
            case 3:
                return (
                    <ConnectStep
                        data={formData}
                        updateData={updateData}
                        next={handleComplete}
                        back={prevStep}
                        isLoading={isLoading}
                        error={error}
                    />
                );
            case 4:
                return <DoneStep />;
            default:
                return <InfoStep data={formData} updateData={updateData} next={nextStep} />;
        }
    };

    return (
        <AuthLayout
            title={step === 4 ? "All Set!" : "Create Your Account"}
            subtitle={step === 4 ? "Your restaurant is ready to go." : `Step ${step} of 3`}
        >
            {renderProgressIndicator()}
            {renderStep()}
        </AuthLayout>
    );
};

export default RestaurantSignup;
