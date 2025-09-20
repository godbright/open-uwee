"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, Button, Space, Avatar } from "antd";
import { LogoutOutlined, UserOutlined, SettingOutlined } from "@ant-design/icons";

export default function DashboardPage() {
  const { user, userProfile, signOut, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const displayName = userProfile?.first_name && userProfile?.last_name
    ? `${userProfile.first_name} ${userProfile.last_name}`
    : user.email?.split('@')[0] || 'User';

  const initials = userProfile?.first_name && userProfile?.last_name
    ? `${userProfile.first_name[0]}${userProfile.last_name[0]}`
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <Space>
              <Avatar 
                size="small" 
                src={userProfile?.avatar_url}
                style={{ backgroundColor: '#374151' }}
              >
                {initials}
              </Avatar>
              <span className="text-sm font-medium text-gray-700">
                {displayName}
              </span>
              <Button 
                type="text" 
                icon={<LogoutOutlined />}
                onClick={handleSignOut}
                className="text-gray-500 hover:text-gray-700"
              >
                Sign out
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <Card className="col-span-full">
            <div className="text-center py-8">
              <Avatar 
                size={64} 
                src={userProfile?.avatar_url}
                style={{ backgroundColor: '#374151' }}
                className="mb-4"
              >
                {initials}
              </Avatar>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {userProfile?.first_name || 'User'}!
              </h2>
              <p className="text-gray-600">
                You're successfully logged in to your dashboard.
              </p>
            </div>
          </Card>

          {/* Profile Information */}
          <Card title="Profile Information" className="h-fit">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              {userProfile?.first_name && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">
                    {userProfile.first_name} {userProfile.last_name}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Provider</label>
                <p className="text-gray-900 capitalize">
                  {userProfile?.provider || 'Email'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Member since</label>
                <p className="text-gray-900">
                  {userProfile?.created_at 
                    ? new Date(userProfile.created_at).toLocaleDateString()
                    : 'Recently'}
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions" className="h-fit">
            <div className="space-y-3">
              <Button 
                block 
                icon={<UserOutlined />}
                className="text-left"
              >
                Edit Profile
              </Button>
              <Button 
                block 
                icon={<SettingOutlined />}
                className="text-left"
              >
                Settings
              </Button>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card title="Recent Activity" className="h-fit">
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}