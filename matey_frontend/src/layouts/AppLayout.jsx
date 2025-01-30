import { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Divider, Badge, Space, App } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import { 
  PlayCircleOutlined, 
  TeamOutlined, 
  LogoutOutlined, 
  MenuOutlined, 
  UserOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import MobileMenu from '../components/MobileMenu';
import SettingsModal from '../components/SettingsModal';

const { Header, Sider, Content } = Layout;
const MOBILE_BREAKPOINT = 768;

const AppLayout = () => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: {
        login: 'guest',
        passcode: 'guest',
        userId: user.id,
        username: user.username
      },
      debug: function (str) {
        console.log('STOMP: ' + str);
      },
      onConnect: () => {
        console.log('Connected to WebSocket');
        setStompClient(client);
        
        // Subscribe to online count updates
        client.subscribe('/topic/online-count', (message) => {
          const count = JSON.parse(message.body);
          setOnlineCount(count);
        });

        // Initial connection - only send from AppLayout
        client.publish({
          destination: '/app/player/connect',
          body: JSON.stringify({ 
            userId: user.id, 
            username: user.username 
          })
        });
      },
      onDisconnect: () => {
        console.log('Disconnected from WebSocket');
        setStompClient(null);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        message.error('Connection error');
        setStompClient(null);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.activate();

    return () => {
      if (client.connected) {
        client.publish({
          destination: '/app/player/disconnect',
          body: JSON.stringify({ userId: user.id })
        });
        client.deactivate();
      }
    };
  }, [user.id, user.username, message]);

  const selectedKey = location.pathname.split('/')[2] || 'play';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Menu items configuration
  const menuItems = [
    {
      key: 'play',
      icon: <PlayCircleOutlined />,
      label: 'Play',
      onClick: () => navigate('/app/play'),
    },
    {
      key: 'friends',
      icon: <TeamOutlined />,
      label: 'Friends',
      onClick: () => navigate('/app/friends'),
    },
    {
      key: 'members',
      icon: <UserOutlined />,
      label: 'Members',
      onClick: () => navigate('/app/members'),
    },
  ];

  // User dropdown menu items
  const userMenuItems = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => setSettingsOpen(true),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const logoSection = (
    <h1 style={{ 
      color: 'white', 
      margin: 0, 
      fontSize: collapsed ? '14px' : '24px'
    }}>
      matey
    </h1>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sider */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
          }}
        >
          <div style={{ padding: '16px', textAlign: collapsed ? 'center' : 'left' }}>
            {logoSection}
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            style={{ flex: 1 }}
          />

          <div style={{ position: 'absolute', bottom: 48, width: '100%' }}>
            <Divider style={{ margin: '12px 0', borderColor: 'rgba(255, 255, 255, 0.1)' }} />

            {/* User profile section */}
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={['click']}
              placement={collapsed ? 'right' : 'top'}
              arrow={{ pointAtCenter: true }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderRadius: '4px',
                  margin: '0 8px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  src={user?.avatar}
                />
                {!collapsed && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      color: 'white',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {user?.username || 'User'}
                    </div>
                    <div style={{ 
                      color: 'rgba(255, 255, 255, 0.45)',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {user?.email || 'email@example.com'}
                    </div>
                  </div>
                )}
              </div>
            </Dropdown>
          </div>
        </Sider>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <Header
          style={{
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileMenuVisible(true)}
            style={{ color: 'white' }}
          />
          {logoSection}
          <div style={{ width: 32 }} />
        </Header>
      )}

      {/* Mobile Menu */}
      <MobileMenu
        visible={mobileMenuVisible && isMobile}
        onClose={() => setMobileMenuVisible(false)}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Content */}
      <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 80 : 200) }}>
        <Content style={{ padding: '24px', minHeight: 280 }}>
          <Outlet context={{ stompClient }} />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout; 