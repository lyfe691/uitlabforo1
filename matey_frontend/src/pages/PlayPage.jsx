import { useEffect, useState, useCallback } from 'react';
import { Button, App, Typography } from 'antd';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChessBoard from '../components/ChessBoard';
import PlayerInfo from '../components/PlayerInfo';
import { LoadingOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Media query breakpoint
const MOBILE_BREAKPOINT = 768;

const PlayPage = () => {
  const { message } = App.useApp();
  const { user } = useAuth();
  const { stompClient } = useOutletContext();
  const [isSearching, setIsSearching] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);
  const [showGameStart, setShowGameStart] = useState(false);
  const [gameState, setGameState] = useState({
    gameId: null,
    isInGame: false,
    isPlayerTurn: false,
    opponentMove: null,
    opponent: null
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleGameUpdate = useCallback((update) => {
    console.log('Handling game update:', update);
    
    switch (update.type) {
      case 'GAME_STARTED':
        console.log('Game started:', update);
        setIsSearching(false);
        message.destroy();
        setGameState(prev => ({
          ...prev,
          gameId: update.gameId,
          isInGame: true,
          isPlayerTurn: update.isWhite,
          opponent: update.opponent,
          opponentMove: null
        }));
        setShowGameStart(true);
        message.success(`Game started against ${update.opponent}! You are playing as ${update.isWhite ? 'White' : 'Black'}.`);
        break;
      case 'MOVE_MADE':
        console.log('Move made:', update);
        setGameState(prev => ({
          ...prev,
          isPlayerTurn: true,
          opponentMove: update.move
        }));
        break;
      case 'GAME_ENDED':
        console.log('Game ended:', update);
        setIsSearching(false);
        message.destroy();
        setGameState(prev => ({
          ...prev,
          gameId: null,
          isInGame: false,
          isPlayerTurn: false,
          opponent: null,
          opponentMove: null
        }));
        message.info(`Game ended: ${update.reason}`);
        break;
      default:
        console.warn('Unknown game update type:', update.type);
    }
  }, [message]);

  // WebSocket subscriptions
  useEffect(() => {
    if (stompClient?.connected) {
      console.log('Setting up game subscriptions for user:', user.id);
      
      // Subscribe to game updates and online players
      const subscriptions = [
        // Game updates subscription
        stompClient.subscribe(`/user/${user.id}/queue/game-updates`, (messageData) => {
          try {
            const update = JSON.parse(messageData.body);
            console.log('Received game update:', update);
            handleGameUpdate(update);
          } catch (error) {
            console.error('Failed to parse game update:', error);
          }
        }),

        // Online players subscription
        stompClient.subscribe('/topic/online-players', (messageData) => {
          try {
            const players = JSON.parse(messageData.body);
            console.log('Received online players update:', players);
            setOnlinePlayers(players.filter(p => p.userId !== user.id));
          } catch (error) {
            console.error('Failed to parse online players:', error);
          }
        })
      ];

      // Request initial online players list
      stompClient.publish({
        destination: '/app/online-users/get',
        body: JSON.stringify({ userId: user.id })
      });

      return () => {
        console.log('Cleaning up game subscriptions');
        subscriptions.forEach(sub => sub.unsubscribe());
      };
    }
  }, [stompClient, user.id, handleGameUpdate]);

  const findGame = useCallback(() => {
    if (stompClient?.connected) {
      setIsSearching(true);
      console.log('Finding game for user:', user.id);
      stompClient.publish({
        destination: '/app/game/find',
        body: JSON.stringify({ userId: user.id })
      });
      message.loading('Finding a game...', 0);
    } else {
      message.error('Not connected to server');
    }
  }, [stompClient, user.id, message]);

  const cancelSearch = useCallback(() => {
    if (stompClient?.connected) {
      console.log('Canceling game search for user:', user.id);
      stompClient.publish({
        destination: '/app/game/cancel',
        body: JSON.stringify({ userId: user.id })
      });
      setIsSearching(false);
      message.destroy();
    }
  }, [stompClient, user.id, message]);

  const handleMove = useCallback((move) => {
    if (stompClient?.connected && gameState.gameId) {
      console.log('Sending move:', move);
      stompClient.publish({
        destination: '/app/game/move',
        body: JSON.stringify({
          gameId: gameState.gameId,
          playerId: user.id,
          move: move
        })
      });
      setGameState(prev => ({
        ...prev,
        isPlayerTurn: false,
        opponentMove: null
      }));
    }
  }, [stompClient, gameState.gameId, user.id]);

  const handleResign = useCallback(() => {
    if (stompClient?.connected && gameState.gameId) {
      stompClient.publish({
        destination: '/app/game/resign',
        body: JSON.stringify({ 
          gameId: gameState.gameId,
          playerId: user.id 
        })
      });
      message.info('You resigned the game');
      setGameState({
        gameId: null,
        isInGame: false,
        isPlayerTurn: false,
        opponent: null,
        opponentMove: null
      });
    }
  }, [stompClient, gameState.gameId, user.id, message]);

  const Controls = () => (
    <>
      <Button
        type="primary"
        size="large"
        onClick={isSearching ? cancelSearch : findGame}
        icon={isSearching ? <LoadingOutlined /> : null}
        disabled={gameState.isInGame}
        style={{ 
          height: '48px',
          fontSize: '16px',
          borderRadius: '4px',
          boxShadow: 'none'
        }}
      >
        {isSearching ? 'Cancel Search' : 'Play'}
      </Button>

      {gameState.isInGame && (
        <Button 
          danger 
          size="large"
          onClick={handleResign}
          style={{ 
            marginTop: isMobile ? 0 : 'auto'
          }}
        >
          Resign
        </Button>
      )}

      {/* Online Players List */}
      {!isMobile && (
        <div style={{
          marginTop: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <Text style={{ 
            color: 'rgba(255, 255, 255, 0.45)',
            fontSize: '14px',
            fontWeight: 500
          }}>
            Online Players ({onlinePlayers.length})
          </Text>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '300px',
            overflowY: 'auto',
            paddingRight: '8px'
          }}>
            {onlinePlayers.map(player => (
              <div
                key={player.userId}
                style={{
                  padding: '12px 16px',
                  background: '#2a2a2a',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserOutlined style={{ 
                    fontSize: '16px', 
                    color: '#fff' 
                  }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Text style={{ 
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontSize: '14px',
                    fontWeight: 500
                  }}>
                    {player.username}
                  </Text>
                  <Text style={{ 
                    color: 'rgba(255, 255, 255, 0.45)',
                    fontSize: '12px',
                    display: 'block'
                  }}>
                    {player.inGame ? 'In Game' : 'Available'}
                  </Text>
                </div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: player.inGame ? '#666' : undefined,
                  boxShadow: player.inGame ? 'none' : undefined
                }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <div style={{ 
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        height: '100vh',
        background: '#141414',
        overflow: 'hidden'
      }}>
        {isMobile && (
          <div style={{
            background: '#1a1a1a',
            padding: '12px',
            display: 'flex',
            gap: '12px',
            borderBottom: '1px solid #2a2a2a'
          }}>
            <Controls />
          </div>
        )}

        {/* Main Content */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '20px' : '20px 320px 20px 20px',
          overflow: 'auto',
          height: isMobile ? 'calc(100vh - 72px)' : '100vh'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '900px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            {/* Opponent Info */}
            <PlayerInfo
              username={gameState.opponent || 'Opponent'}
              isActive={gameState.isInGame && !gameState.isPlayerTurn}
              isTop
            />

            {/* Notice */}
            <div style={{
              width: '100%',
              padding: '12px',
              background: '#2a1215',
              border: '1px solid rgb(220, 23, 66)',
              borderRadius: '8px',
              color: 'rgb(255, 77, 79)',
              textAlign: 'center',
              fontWeight: 500,
              fontSize: '16px',
              marginBottom: '8px',
              boxShadow: '0 0 8px rgba(220, 23, 66, 0.1)'
            }}>
              ℹ️ Multiplayer is currently not working, but you can enjoy the playground below.
            </div>

            {/* Chess Board */}
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1',
              maxWidth: '800px',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)'
            }}>
              <ChessBoard
                gameId={gameState.gameId}
                onMove={handleMove}
                opponentMove={gameState.opponentMove}
                isPlayerTurn={gameState.isPlayerTurn}
              />
            </div>

            {/* Player Info */}
            <PlayerInfo
              username={user.username}
              isActive={gameState.isInGame && gameState.isPlayerTurn}
            />
          </div>
        </div>

        {/* Right Sidebar - Only shown on desktop */}
        {!isMobile && (
          <div style={{
            width: '300px',
            background: '#1a1a1a',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
          }}>
            <Controls />
          </div>
        )}
      </div>
    </>
  );
};

export default PlayPage; 