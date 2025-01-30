import { Drawer, Menu, Avatar, Typography, Divider, Button } from 'antd';
import { 
  PlayCircleOutlined, 
  TeamOutlined, 
  LogoutOutlined, 
  UserOutlined, 
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Text } = Typography;

const MobileMenu = ({ visible, onClose, onSettingsClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
    onClose();
  };

  const selectedKey = location.pathname.split('/')[2] || 'play';

  const menuItems = [
    {
      key: 'play',
      icon: <PlayCircleOutlined />,
      label: 'Play',
      onClick: () => {
        navigate('/app/play');
        onClose();
      },
    },
    {
      key: 'friends',
      icon: <TeamOutlined />,
      label: 'Friends',
      onClick: () => {
        navigate('/app/friends');
        onClose();
      },
    },
    {
      key: 'members',
      icon: <UserOutlined />,
      label: 'Members',
      onClick: () => {
        navigate('/app/members');
        onClose();
      },
    },

  ];

  return (
    <Drawer
      title={
        <Text strong style={{ fontSize: '18px' }}>
          matey
        </Text>
      }
      placement="left"
      onClose={onClose}
      open={visible}
      styles={{
        body: { 
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        },
        header: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }
      }}
    >
      {/* Main Navigation */}
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        style={{ 
          flex: 1,
          background: 'transparent',
          border: 'none'
        }}
      />

      <Divider style={{ margin: 0, borderColor: 'rgba(255, 255, 255, 0.06)' }} />

      {/* User Section */}
      <div style={{ 
        padding: '16px',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        {/* User Profile */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          padding: '12px',
          marginBottom: '12px',
          borderRadius: '6px',
          background: 'rgba(255, 255, 255, 0.04)',
          cursor: 'pointer'
        }}
        onClick={() => {
          onSettingsClick();
          onClose();
        }}
        >
          <Avatar 
            size={40} 
            icon={<UserOutlined />}
            style={{ 
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--ant-color-primary)'
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text strong style={{ 
              color: 'white',
              display: 'block',
              fontSize: '16px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user?.username || 'User'}
            </Text>
            <Text style={{ 
              color: 'rgba(255, 255, 255, 0.45)',
              fontSize: '12px',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user?.email || 'email@example.com'}
            </Text>
          </div>
          <SettingOutlined style={{ color: 'rgba(255, 255, 255, 0.45)' }} />
        </div>

        {/* Logout Button */}
        <Button 
          danger 
          type="text" 
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{ 
            width: '100%', 
            textAlign: 'left',
            height: '40px'
          }}
        >
          Logout
        </Button>
      </div>
    </Drawer>
  );
};

export default MobileMenu; 