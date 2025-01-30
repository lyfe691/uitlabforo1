import { Button, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

const { Title } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, navigate]);

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
      <Title
        level={1}
        style={{
          color: 'white',
          fontSize: '4rem',
          marginBottom: '2rem',
        }}
      >
        matey
      </Title>
      <Space size="large">
        <Button
          type="primary"
          size="large"
          onClick={() => navigate('/signin')}
          style={{ minWidth: '120px' }}
        >
          Sign In
        </Button>
        <Button
          size="large"
          onClick={() => navigate('/signup')}
          style={{ minWidth: '120px' }}
        >
          Sign Up
        </Button>
      </Space>
    </div>
  );
};

export default LandingPage; 