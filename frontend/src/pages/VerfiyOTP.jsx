import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";


const VerifyOTP = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");

  const handleVerify = (e) => {
  e.preventDefault();

  // After successful OTP verification
  navigate("/reset-password");
};


  return (
    <AuthLayout title="Enter Verification Code">
      <form onSubmit={handleVerify} className="auth-form">
        <Input
          label="Verification PIN"
          type="text"
          placeholder="Enter OTP code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />

        <Button type="submit" variant="primary" size="large" style={{ width: "100%" }}>
          Verify OTP
        </Button>

        
        <Button
          variant="outline"
          size="large"
          style={{ width: "100%", marginTop: "10px" }}
          onClick={() => navigate("/login")}
        >
          Back to Login
        </Button>
      </form>
    </AuthLayout>
  );
};

export default VerifyOTP;
