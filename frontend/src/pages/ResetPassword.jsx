import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import useAuth from '../hooks/useAuth';
import { useParams } from "react-router-dom";
import { notifyError, notifyLoading, notifySuccess } from "../components/StaffDashboard/utils/notify";


const ResetPassword = () => {
  const { token } = useParams(); 
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      notifyError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    const loadingToastId = notifyLoading("Updating password...");

    try {
      // TODO: Call backend API to reset password
      const response = await resetPassword(token, formData.password);

     if(response.success === true) {
      notifySuccess("Password changed successfully!");
      navigate("/login");
     } else {
      notifyError(response.message || "Failed to reset password. Please try again. harry");
     }
    } catch (err) {
      console.log(err);
      notifyError( err.response.data.message || "Failed to reset password. Please try again. diwas");
    } finally {
      setIsLoading(false);
      toast.dismiss(loadingToastId);
    }
  };

  return (
    <AuthLayout title="Create New Password">
      <form onSubmit={handleSubmit} className="auth-form">
        <Input
          label="New Password"
          type="password"
          name="password"
          placeholder="Enter new password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          placeholder="Re-enter new password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        <Button
          type="submit"
          variant="primary"
          size="large"
          style={{ width: "100%" }}
          disabled={isLoading}
        >
          {isLoading ? "Updating..." : "Continue"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
