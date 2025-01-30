import { Form, Input, Button, Typography, message, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

const { Title } = Typography;

const SignIn = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values) => {
    const success = await login(values.emailOrUsername, values.password, values.remember);
    if (success) {
      messageApi.success('Successfully signed in!');
    } else {
      messageApi.error('Invalid email or password');
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#141414',
      }}
    >
      {contextHolder}
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
        }}
      >
        <Title
          level={2}
          style={{
            color: 'white',
            textAlign: 'center',
            marginBottom: '2rem',
          }}
        >
          Sign In to matey
        </Title>

        <Form
          form={form}
          name="signin"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          initialValues={{ remember: true }}
        >
          <Form.Item
            name="emailOrUsername"
            rules={[
              {
                required: true,
                message: 'Please enter your email or username!',
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Email or Username"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: 'Please enter your password!',
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="remember"
            valuePropName="checked"
          >
            <Checkbox style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Remember me</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.65)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#1890ff' }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn; 