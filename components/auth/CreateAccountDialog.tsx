"use client";

import { useState } from "react";
import { Modal, Form, Input, Button, Row, Col, Divider } from "antd";
import { GoogleOutlined, GithubOutlined } from "@ant-design/icons";

interface CreateAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export default function CreateAccountDialog({
  isOpen,
  onClose,
}: CreateAccountDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);

    // TODO: Implement actual signup logic
    console.log("Create account with:", values);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onClose();
      form.resetFields();
    }, 1000);
  };

  const handleSocialSignup = (provider: "google" | "github") => {
    // TODO: Implement social signup
    console.log(`Sign up with ${provider}`);
  };

  return (
    <Modal
      title={<div className="text-lg font-semibold">Create your account</div>}
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
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              name="firstName"
              label="First name"
              rules={[
                { required: true, message: "Please enter your first name" },
              ]}
            >
              <Input placeholder="First name" size="large" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lastName"
              label="Last name"
              rules={[
                { required: true, message: "Please enter your last name" },
              ]}
            >
              <Input placeholder="Last name" size="large" />
            </Form.Item>
          </Col>
        </Row>

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
          rules={[
            { required: true, message: "Please create a password" },
            { min: 8, message: "Password must be at least 8 characters" },
          ]}
        >
          <Input.Password placeholder="Create a password" size="large" />
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
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </Form.Item>
      </Form>

      <Divider>Or sign up with</Divider>

      <div className="grid grid-cols-2 gap-3">
        <Button
          icon={<GoogleOutlined />}
          onClick={() => handleSocialSignup("google")}
          size="large"
          className="flex items-center justify-center"
        >
          Google
        </Button>

        <Button
          icon={<GithubOutlined />}
          onClick={() => handleSocialSignup("github")}
          size="large"
          className="flex items-center justify-center"
        >
          GitHub
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <button className="text-orange-600 hover:text-orange-500 font-medium">
          Sign in
        </button>
      </p>
    </Modal>
  );
}
