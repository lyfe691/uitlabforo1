import { Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

const PlayerInfo = ({ username, isActive, isTop = false }) => {
  return (
    <div style={{ 
      padding: '16px 24px',
      background: '#1a1a1a',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      alignSelf: 'stretch',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      transform: isTop ? 'rotate(180deg)' : 'none'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: '#2a2a2a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: isTop ? 'rotate(180deg)' : 'none'
      }}>
        <UserOutlined style={{ 
          fontSize: '20px', 
          color: 'var(--ant-color-primary)'
        }} />
      </div>
      <div style={{ 
        flex: 1,
        transform: isTop ? 'rotate(180deg)' : 'none'
      }}>
        <Text style={{ 
          color: 'rgba(255, 255, 255, 0.85)', 
          fontSize: '16px', 
          fontWeight: 500,
          display: 'block'
        }}>
          {username}
        </Text>
        <Text style={{ 
          color: 'rgba(255, 255, 255, 0.45)', 
          fontSize: '14px'
        }}>
          {isActive ? 'Your turn' : 'Waiting...'}
        </Text>
      </div>
      <div style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: isActive ? 'var(--ant-color-primary)' : '#666',
        boxShadow: isActive ? '0 0 10px var(--ant-color-primary-3)' : 'none',
        transform: isTop ? 'rotate(180deg)' : 'none'
      }} />
    </div>
  );
};

export default PlayerInfo; 