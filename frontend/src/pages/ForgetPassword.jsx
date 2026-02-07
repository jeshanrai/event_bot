import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import useAuth from '../hooks/useAuth';
import { notifyError, notifyLoading, notifySuccess } from "../components/StaffDashboard/utils/notify";



const ForgetPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  // const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToastId = notifyLoading("Sending OTP...");

    try {

      const forResponse = await forgotPassword(email);
      if (forResponse.success === true) {
        notifySuccess("OTP sent successfully to your email");
        navigate("/verifyOTP", {
          state: { email }, // pass email for later use
        });
      } else {
        notifyError("Failed to send OTP. Please enter valid email.");
      }


      // TODO: call backend API
      // await sendOtp(email);

      // After OTP is sent successfully

    } catch (err) {
      notifyError("Failed to send OTP. Please enter valid email.");
    } finally {
      setIsLoading(false);
      toast.dismiss(loadingToastId);
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
