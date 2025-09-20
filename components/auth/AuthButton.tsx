"use client";

import { Button, Space } from "antd";
import { useAuth } from "@/lib/auth-context";
import UserProfile from "./UserProfile";
import AuthModals, { useAuthModals } from "./AuthModals";

export default function AuthButton() {
  const { user, loading } = useAuth();
  const authModals = useAuthModals();

  if (loading) {
    return <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />;
  }

  if (user) {
    return <UserProfile />;
  }

  return (
    <>
      <Space>
        <Button 
          onClick={authModals.onOpenLogin}
          type="text"
          className="text-gray-700 hover:text-orange-600"
        >
          Sign in
        </Button>
        <Button 
          onClick={authModals.onOpenSignup}
          type="primary"
          style={{
            backgroundColor: "#f97316",
            borderColor: "#f97316",
          }}
          className="hover:bg-orange-500"
        >
          Get started
        </Button>
      </Space>
      
      <AuthModals {...authModals} />
    </>
  );
}