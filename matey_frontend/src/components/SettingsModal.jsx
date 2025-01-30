import { Modal, Tabs, Form, Input, Button, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const { Text } = Typography;

const SettingsModal = ({ open, onClose }) => {
  const { user, updateProfile, changePassword } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleProfileUpdate = async (values) => {
    setLoading(true);
    try {
      await updateProfile(values);
      messageApi.success('Profile updated successfully');
    } catch (error) {
      messageApi.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    setLoading(true);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      messageApi.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error) {
      messageApi.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      key: 'profile',
      label: 'Profile',
      children: (
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleProfileUpdate}
          initialValues={{
            username: user?.username,
            email: user?.email,
          }}
          style={{ maxWidth: 400, margin: '0 auto' }}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please input your username!' },
              { min: 3, max: 20, message: 'Username must be between 3 and 20 characters' },
              {
                pattern: /^[a-zA-Z0-9_]*$/,
                message: 'Username can only contain letters, numbers and underscores',
              },
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Username"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
              { max: 50, message: 'Email must not exceed 50 characters' },
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Email"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              size="large"
            >
              Update Profile
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'password',
      label: 'Password',
      children: (
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
          style={{ maxWidth: 400, margin: '0 auto' }}
        >
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[
              { required: true, message: 'Please input your current password!' },
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Current Password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please input your new password!' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="New Password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Confirm Password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              size="large"
            >
              Change Password
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <Modal
      title="Settings"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      styles={{
        body: {
          maxHeight: '80vh',
          overflow: 'auto',
          paddingTop: '24px',
        },
        content: {
          background: '#141414',
        },
        header: {
          borderBottom: 'none',
          background: '#141414',
        }
      }}
    >
      {contextHolder}
      <Tabs
        items={items}
        defaultActiveKey="profile"
        style={{ marginTop: '-24px' }}
      />
    </Modal>
  );
};

export default SettingsModal; 