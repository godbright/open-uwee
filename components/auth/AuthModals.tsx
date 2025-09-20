"use client";

import { useState } from "react";
import LoginDialog from "./LoginDialog";
import CreateAccountDialog from "./CreateAccountDialog";

interface AuthModalsProps {
  isLoginOpen: boolean;
  isSignupOpen: boolean;
  onCloseLogin: () => void;
  onCloseSignup: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
}

export default function AuthModals({
  isLoginOpen,
  isSignupOpen,
  onCloseLogin,
  onCloseSignup,
  onOpenLogin,
  onOpenSignup,
}: AuthModalsProps) {
  const handleSwitchToSignup = () => {
    onCloseLogin();
    onOpenSignup();
  };

  const handleSwitchToLogin = () => {
    onCloseSignup();
    onOpenLogin();
  };

  return (
    <>
      <LoginDialog
        isOpen={isLoginOpen}
        onClose={onCloseLogin}
        onSwitchToSignup={handleSwitchToSignup}
      />
      <CreateAccountDialog
        isOpen={isSignupOpen}
        onClose={onCloseSignup}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </>
  );
}

// Hook to manage auth modals state
export function useAuthModals() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  return {
    isLoginOpen,
    isSignupOpen,
    onCloseLogin: () => setIsLoginOpen(false),
    onCloseSignup: () => setIsSignupOpen(false),
    onOpenLogin: () => setIsLoginOpen(true),
    onOpenSignup: () => setIsSignupOpen(true),
  };
}