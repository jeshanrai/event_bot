import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";


const ResetPassword = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Call backend API to reset password
      // await resetPassword(formData.password);

      alert("Password changed successfully!");
      navigate("/login");
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
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

        {error && <div className="error-message">⚠️ {error}</div>}

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
