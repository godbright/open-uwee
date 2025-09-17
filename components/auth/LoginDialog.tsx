"use client";

import { useState } from "react";
import { Modal, Form, Input, Button, Divider } from "antd";
import { GoogleOutlined, GithubOutlined } from "@ant-design/icons";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormValues {
  email: string;
  password: string;
}

export default function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);

    // TODO: Implement actual login logic
    console.log("Login with:", values);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onClose();
      form.resetFields();
    }, 1000);
  };

  const handleSocialLogin = (provider: "google" | "github") => {
    // TODO: Implement social login
    console.log(`Login with ${provider}`);
  };

  return (
    <Modal
      title={<div className="text-lg font-semibold">Welcome back</div>}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={480}
      centered
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="mt-6"
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Please enter your email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input placeholder="Enter your email" size="large" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: "Please enter your password" }]}
        >
          <Input.Password placeholder="Enter your password" size="large" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            size="large"
            className="w-full"
            style={{
              backgroundColor: "#f97316",
              borderColor: "#f97316",
              height: "48px",
            }}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </Form.Item>
      </Form>

      <Divider>Or continue with</Divider>

      <div className="grid grid-cols-2 gap-3">
        <Button
          icon={<GoogleOutlined />}
          onClick={() => handleSocialLogin("google")}
          size="large"
          className="flex items-center justify-center"
        >
          Google
        </Button>

        <Button
          icon={<GithubOutlined />}
          onClick={() => handleSocialLogin("github")}
          size="large"
          className="flex items-center justify-center"
        >
          GitHub
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <button className="text-orange-600 hover:text-orange-500 font-medium">
          Sign up
        </button>
      </p>
    </Modal>
  );
}
