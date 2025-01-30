import { useState, useEffect } from 'react';
import { 
  Typography, 
  List, 
  Avatar, 
  Button, 
  Tabs, 
  Empty, 
  message, 
  App, 
  Dropdown,
  Modal,
  Space
} from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  UserAddOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:8080';

const FriendsPage = () => {
  const { message: messageApi } = App.useApp();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await axios.get('/api/users/me/friends', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setFriends(response.data);
    } catch (error) {
      messageApi.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get('/api/users/me/friend-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setFriendRequests(response.data);
    } catch (error) {
      messageApi.error('Failed to load friend requests');
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      await axios.post(`/api/users/friend-request/${userId}/accept`, null, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      messageApi.success('Friend request accepted!');
      await Promise.all([fetchFriends(), fetchFriendRequests()]);
    } catch (error) {
      messageApi.error('Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await axios.post(`/api/users/friend-request/${userId}/reject`, null, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      messageApi.success('Friend request rejected');
      await fetchFriendRequests();
    } catch (error) {
      messageApi.error('Failed to reject friend request');
    }
  };

  const handleRemoveFriend = async () => {
    if (!selectedFriend) return;
    
    try {
      await axios.delete(`/api/users/friend/${selectedFriend.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      messageApi.success('Friend removed');
      await fetchFriends();
      setIsDeleteModalVisible(false);
      setSelectedFriend(null);
    } catch (error) {
      messageApi.error('Failed to remove friend');
    }
  };

  const handleChallenge = (friend) => {
    navigate('/app/play', { state: { challengedUser: friend } });
  };

  const getFriendActions = (friend) => [
    {
      key: 'challenge',
      label: 'Challenge to a Game',
      icon: <PlayCircleOutlined />,
      onClick: () => handleChallenge(friend)
    },
    {
      key: 'message',
      label: 'Send Message',
      icon: <MessageOutlined />,
      onClick: () => messageApi.info('Chat feature coming soon!')
    },
    {
      type: 'divider'
    },
    {
      key: 'remove',
      label: 'Remove Friend',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {
        setSelectedFriend(friend);
        setIsDeleteModalVisible(true);
      }
    }
  ];

  const items = [
    {
      key: 'friends',
      label: (
        <span>
          <TeamOutlined />
          Friends
        </span>
      ),
      children: (
        <List
          loading={loading}
          dataSource={friends}
          renderItem={(friend) => (
            <List.Item
              key={friend.id}
              extra={
                <Dropdown
                  menu={{ items: getFriendActions(friend) }}
                  trigger={['click']}
                  placement="bottomRight"
                  arrow={{ pointAtCenter: true }}
                >
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    style={{ color: 'rgba(255, 255, 255, 0.65)' }}
                  />
                </Dropdown>
              }
              style={{
                background: '#1a1a1a',
                marginBottom: '8px',
                borderRadius: '8px',
                padding: '12px 24px',
                transition: 'all 0.3s ease'
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    size={48}
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: '#2a2a2a'
                    }}
                  />
                }
                title={
                  <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px' }}>
                    {friend.username}
                  </Text>
                }
                description={
                  <Text type="secondary">
                    {friend.email}
                  </Text>
                }
              />
            </List.Item>
          )}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                    <p>No friends yet</p>
                    <Button
                      type="link"
                      onClick={() => navigate('/app/members')}
                    >
                      Find Friends
                    </Button>
                  </div>
                }
              />
            )
          }}
        />
      ),
    },
    {
      key: 'requests',
      label: (
        <span>
          <UserAddOutlined />
          Friend Requests
          {friendRequests.length > 0 && (
            <span style={{ 
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '12px',
              marginLeft: '8px'
            }}>
              {friendRequests.length}
            </span>
          )}
        </span>
      ),
      children: (
        <List
          loading={loading}
          dataSource={friendRequests}
          renderItem={(request) => (
            <List.Item
              key={request.id}
              actions={[
                <Button
                  type="primary"
                  onClick={() => handleAcceptRequest(request.id)}
                >
                  Accept
                </Button>,
                <Button
                  type="text"
                  danger
                  onClick={() => handleRejectRequest(request.id)}
                >
                  Reject
                </Button>
              ]}
              style={{
                background: '#1a1a1a',
                marginBottom: '8px',
                borderRadius: '8px',
                padding: '12px 24px',
                transition: 'all 0.3s ease'
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    size={48}
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: '#2a2a2a'
                    }}
                  />
                }
                title={
                  <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '16px' }}>
                    {request.username}
                  </Text>
                }
                description={
                  <Text type="secondary">
                    {request.email}
                  </Text>
                }
              />
            </List.Item>
          )}
          locale={{
            emptyText: (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <Text type="secondary">No friend requests</Text>
              </div>
            )
          }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>Friends</Title>
        <Tabs
          items={items}
          defaultActiveKey="friends"
          animated={{ inkBar: true, tabPane: true }}
        />
      </Space>

      <Modal
        title="Remove Friend"
        open={isDeleteModalVisible}
        onOk={handleRemoveFriend}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setSelectedFriend(null);
        }}
        okText="Remove"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to remove {selectedFriend?.username} from your friend list?</p>
      </Modal>
    </div>
  );
};

export default FriendsPage; 