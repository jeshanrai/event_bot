import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

const ForgetPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // TODO: call backend API
      // await sendOtp(email);

      // After OTP is sent successfully
      navigate("/verifyOTP", {
        state: { email }, // pass email for later use
      });
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password">
      <form onSubmit={handleSubmit} className="auth-form">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@restaurant.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {error && <div className="error-message">⚠️ {error}</div>}

        <Button
          type="submit"
          variant="primary"
          size="large"
          style={{ width: "100%" }}
          disabled={isLoading}
        >
          {isLoading ? "Sending OTP..." : "Send OTP"}
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

export default ForgetPassword;
