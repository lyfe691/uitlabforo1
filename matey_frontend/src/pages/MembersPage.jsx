import { useState, useEffect } from 'react';
import { 
  Typography, 
  List, 
  Avatar, 
  Button, 
  Input, 
  Space, 
  App,
  Badge,
  Card,
  Tooltip
} from 'antd';
import { 
  UserOutlined, 
  SearchOutlined,
  UserAddOutlined,
  CheckOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';

const { Title, Text } = Typography;
const { Search } = Input;

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:8080';

const MembersPage = () => {
  const { message: messageApi } = App.useApp();
  const { user } = useAuth();
  const { stompClient } = useOutletContext();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [pendingRequests, setPendingRequests] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    fetchMembers();

    // Subscribe to online users updates
    if (stompClient) {
      console.log('Subscribing to online users updates');
      
      const subscription = stompClient.subscribe('/topic/online-players', (message) => {
        try {
          const onlinePlayers = JSON.parse(message.body);
          console.log('Received online players:', onlinePlayers);
          // Create a Set of online user IDs
          const onlineIds = new Set(onlinePlayers.map(player => player.userId));
          setOnlineUsers(onlineIds);
        } catch (error) {
          console.error('Failed to parse online players:', error);
        }
      });

      // Request current online users
      stompClient.publish({
        destination: '/app/online-users/get',
        body: JSON.stringify({ userId: user.id })
      });

      return () => {
        console.log('Unsubscribing from online users updates');
        subscription.unsubscribe();
      };
    }
  }, [stompClient, user.id]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/users/members', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.data && Array.isArray(response.data)) {
        console.log('Members loaded:', response.data);
        setMembers(response.data);
      } else {
        console.error('Invalid response format:', response.data);
        setMembers([]);
        messageApi.error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to load members:', error);
      setMembers([]);
      messageApi.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      setPendingRequests(prev => new Set(prev).add(userId));
      await axios.post(`/api/users/friend-request/${userId}`, null, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      messageApi.success('Friend request sent!');
      await fetchMembers();
    } catch (error) {
      messageApi.error(error.response?.data?.message || 'Failed to send friend request');
      setPendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const filteredMembers = members.filter(member => 
    member.username.toLowerCase().includes(searchText.toLowerCase()) ||
    member.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderMemberCard = (member) => {
    const isOnline = onlineUsers.has(member.id);
    return (
      <Card
        key={member.id}
        style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #2a2a2a',
          marginBottom: '16px',
          transition: 'all 0.3s ease'
        }}
        styles={{
          body: {
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }
        }}
        hoverable
      >
        <div style={{ position: 'relative', display: 'flex' }}>
          <Avatar
            size={56}
            icon={<UserOutlined />}
            style={{
              backgroundColor: '#2a2a2a'
            }}
          />
          {isOnline && (
            <Badge
              status="success"
              style={{
                position: 'absolute',
                bottom: 4,
                right: -2,
                width: '10px',
                height: '10px',
                border: '2px solid #1a1a1a'
              }}
            />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text strong style={{ 
              fontSize: '16px', 
              color: 'rgba(255, 255, 255, 0.85)',
              marginBottom: '4px'
            }}>
              {member.username}
            </Text>
            {isOnline && (
              <Text type="success" style={{ fontSize: '12px' }}>
                Online
              </Text>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            {member.email}
          </Text>
        </div>

        <Tooltip title={pendingRequests.has(member.id) ? 'Request Sent' : 'Add Friend'}>
          <Button
            type="primary"
            icon={pendingRequests.has(member.id) ? <CheckOutlined /> : <UserAddOutlined />}
            onClick={() => handleSendFriendRequest(member.id)}
            loading={loading}
            disabled={pendingRequests.has(member.id)}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </Tooltip>
      </Card>
    );
  };

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '800px', 
      margin: '0 auto',
      minHeight: '100%'
    }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <Title level={2} style={{ margin: 0 }}>
            Members {members.length > 0 && `(${members.length})`}
          </Title>
          <Search
            placeholder="Search by username or email"
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{ 
              width: '300px',
              maxWidth: '100%'
            }}
            prefix={<SearchOutlined style={{ color: 'rgba(255, 255, 255, 0.45)' }} />}
          />
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Text type="secondary">Loading members...</Text>
          </div>
        ) : filteredMembers.length > 0 ? (
          <div>
            {filteredMembers.map(renderMemberCard)}
          </div>
        ) : (
          <div style={{ 
            padding: '40px 0', 
            textAlign: 'center',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #2a2a2a'
          }}>
            <Text type="secondary">
              {searchText ? 'No members found matching your search' : 'No members found'}
            </Text>
          </div>
        )}
      </Space>
    </div>
  );
};

export default MembersPage; 