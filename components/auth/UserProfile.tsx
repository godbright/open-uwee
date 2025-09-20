"use client";

import { useState } from "react";
import { Avatar, Dropdown, Button, Space } from "antd";
import { UserOutlined, LogoutOutlined, SettingOutlined } from "@ant-design/icons";
import { useAuth } from "@/lib/auth-context";

export default function UserProfile() {
  const { user, userProfile, signOut, loading } = useAuth();

  if (loading) {
    return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />;
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
  };

  const menuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Sign out",
      onClick: handleLogout,
    },
  ];

  const displayName = userProfile?.first_name && userProfile?.last_name
    ? `${userProfile.first_name} ${userProfile.last_name}`
    : user.email?.split('@')[0] || 'User';

  const initials = userProfile?.first_name && userProfile?.last_name
    ? `${userProfile.first_name[0]}${userProfile.last_name[0]}`
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <Dropdown
      menu={{ items: menuItems }}
      placement="bottomRight"
      trigger={["click"]}
    >
      <Button
        type="text"
        className="flex items-center gap-2 h-auto p-2"
      >
        <Space>
          <Avatar 
            size="small" 
            src={userProfile?.avatar_url}
            style={{ backgroundColor: '#f97316' }}
          >
            {initials}
          </Avatar>
          <span className="hidden md:inline text-sm font-medium">
            {displayName}
          </span>
        </Space>
      </Button>
    </Dropdown>
  );
}