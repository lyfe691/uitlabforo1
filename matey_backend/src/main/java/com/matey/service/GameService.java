package com.matey.service;

import com.matey.model.Game;
import com.matey.model.User;
import com.matey.repository.GameRepository;
import com.matey.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Lazy;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class GameService {
    private final GameRepository gameRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private final Map<String, String> playerQueue = new ConcurrentHashMap<>();
    private final Map<String, PlayerInfo> onlinePlayers = new ConcurrentHashMap<>();
    private final Map<String, String> sessionToUser = new ConcurrentHashMap<>();

    @Autowired
    public GameService(
        GameRepository gameRepository, 
        UserRepository userRepository, 
        @Lazy SimpMessagingTemplate messagingTemplate
    ) {
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    static class PlayerInfo {
        String userId;
        String username;
        boolean inGame;
        Set<String> sessions;

        PlayerInfo(String userId, String username) {
            this.userId = userId;
            this.username = username;
            this.inGame = false;
            this.sessions = new HashSet<>();
        }

        Map<String, Object> toMap() {
            return Map.of(
                "userId", userId,
                "username", username,
                "inGame", inGame
            );
        }
    }

    public void handlePlayerConnect(String userId, String username) {
        System.out.println("GameService: Player connected - userId: " + userId + ", username: " + username);
        PlayerInfo playerInfo = onlinePlayers.computeIfAbsent(userId, 
            k -> new PlayerInfo(userId, username));
        System.out.println("GameService: Updated online players: " + onlinePlayers);
        broadcastOnlineUsers();
    }

    public void handleSessionConnect(String sessionId, String userId, String username) {
        System.out.println("GameService: Session connected - sessionId: " + sessionId + ", userId: " + userId);
        sessionToUser.put(sessionId, userId);
        PlayerInfo playerInfo = onlinePlayers.computeIfAbsent(userId, 
            k -> new PlayerInfo(userId, username));
        playerInfo.sessions.add(sessionId);
        System.out.println("GameService: Updated session mapping: " + sessionToUser);
        System.out.println("GameService: Updated online players: " + onlinePlayers);
        broadcastOnlineUsers();
    }

    public void handleSessionDisconnect(String sessionId) {
        System.out.println("GameService: Session disconnected - sessionId: " + sessionId);
        String userId = sessionToUser.remove(sessionId);
        if (userId != null) {
            PlayerInfo playerInfo = onlinePlayers.get(userId);
            if (playerInfo != null) {
                playerInfo.sessions.remove(sessionId);
                if (playerInfo.sessions.isEmpty()) {
                    onlinePlayers.remove(userId);
                    playerQueue.remove(userId);
                    System.out.println("GameService: Removed player " + userId + " (no active sessions)");
                }
            }
            System.out.println("GameService: Updated online players: " + onlinePlayers);
            System.out.println("GameService: Updated queue state: " + playerQueue);
            broadcastOnlineUsers();
        }
    }

    public void handlePlayerDisconnect(String userId) {
        PlayerInfo playerInfo = onlinePlayers.remove(userId);
        if (playerInfo != null) {
            playerInfo.sessions.forEach(sessionToUser::remove);
        }
        playerQueue.remove(userId);
        broadcastOnlineUsers();
    }

    public void broadcastOnlineUsers() {
        List<Map<String, Object>> onlineUsersList = onlinePlayers.values().stream()
            .filter(player -> !player.sessions.isEmpty())
            .map(PlayerInfo::toMap)
            .collect(Collectors.toList());
        
        System.out.println("GameService: Broadcasting online users: " + onlineUsersList);
        messagingTemplate.convertAndSend("/topic/online-players", onlineUsersList);
        messagingTemplate.convertAndSend("/topic/online-count", onlineUsersList.size());
    }

    public void findGame(String userId) {
        System.out.println("GameService: Finding game for user: " + userId);
        System.out.println("GameService: Current queue state: " + playerQueue);
        System.out.println("GameService: Online players: " + onlinePlayers);

        // Remove any existing queue entry
        playerQueue.remove(userId);

        // Find an opponent
        Optional<String> opponent = playerQueue.keySet().stream()
            .filter(id -> !id.equals(userId))
            .findFirst();

        System.out.println("GameService: Found opponent: " + opponent);

        if (opponent.isPresent()) {
            String opponentId = opponent.get();
            System.out.println("GameService: Creating game between " + userId + " and " + opponentId);
            playerQueue.remove(opponentId);
            createGame(userId, opponentId);
        } else {
            // Add player to queue
            System.out.println("GameService: No opponent found, adding " + userId + " to queue");
            playerQueue.put(userId, "WAITING");
            System.out.println("GameService: Updated queue state: " + playerQueue);
        }
    }

    public void cancelSearch(String userId) {
        playerQueue.remove(userId);
    }

    public void createGame(String player1Id, String player2Id) {
        // Randomly assign colors
        boolean player1IsWhite = new Random().nextBoolean();
        String whitePlayerId = player1IsWhite ? player1Id : player2Id;
        String blackPlayerId = player1IsWhite ? player2Id : player1Id;

        // Create new game
        Game game = new Game();
        game.setWhitePlayerId(whitePlayerId);
        game.setBlackPlayerId(blackPlayerId);
        game.setStatus("IN_PROGRESS");
        game = gameRepository.save(game);

        // Update player statuses
        Optional.ofNullable(onlinePlayers.get(whitePlayerId))
            .ifPresent(p -> p.inGame = true);
        Optional.ofNullable(onlinePlayers.get(blackPlayerId))
            .ifPresent(p -> p.inGame = true);
        broadcastOnlineUsers();

        // Get player usernames
        User whitePlayer = userRepository.findById(whitePlayerId).orElseThrow();
        User blackPlayer = userRepository.findById(blackPlayerId).orElseThrow();

        // Notify players
        notifyGameStart(game, whitePlayer, blackPlayer);
    }

    public void handleMove(String gameId, String playerId, Map<String, String> move) {
        Game game = gameRepository.findByIdAndStatus(gameId, "IN_PROGRESS")
                .orElseThrow(() -> new IllegalStateException("Game not found or not in progress"));

        // Verify it's the player's turn
        boolean isWhiteTurn = game.getCurrentPosition().contains(" w ");
        if ((isWhiteTurn && !playerId.equals(game.getWhitePlayerId())) ||
            (!isWhiteTurn && !playerId.equals(game.getBlackPlayerId()))) {
            throw new IllegalStateException("Not your turn");
        }

        // Update game state
        String newPosition = calculateNewPosition(game.getCurrentPosition(), move);
        game.setCurrentPosition(newPosition);
        game = gameRepository.save(game);

        // Notify opponent
        String opponentId = playerId.equals(game.getWhitePlayerId()) 
            ? game.getBlackPlayerId() 
            : game.getWhitePlayerId();
        
        notifyMove(opponentId, gameId, move);

        // Check for game end conditions
        checkGameEnd(game);
    }

    public void handleResign(String gameId, String playerId) {
        Game game = gameRepository.findByIdAndStatus(gameId, "IN_PROGRESS")
                .orElseThrow(() -> new IllegalStateException("Game not found or not in progress"));

        game.setStatus("FINISHED");
        game.setWinner(playerId.equals(game.getWhitePlayerId()) ? "BLACK" : "WHITE");
        gameRepository.save(game);

        // Update player statuses
        Optional.ofNullable(onlinePlayers.get(game.getWhitePlayerId()))
            .ifPresent(p -> p.inGame = false);
        Optional.ofNullable(onlinePlayers.get(game.getBlackPlayerId()))
            .ifPresent(p -> p.inGame = false);
        broadcastOnlineUsers();

        // Notify players
        notifyGameEnd(game, playerId.equals(game.getWhitePlayerId()) 
            ? "White resigned" 
            : "Black resigned");
    }

    private String calculateNewPosition(String currentPosition, Map<String, String> move) {
        // Create a new game instance with the current position
        Game game = new Game();
        game.setCurrentPosition(currentPosition);

        // Apply the move
        String from = move.get("from");
        String to = move.get("to");
        String promotion = move.get("promotion");

        // Convert algebraic notation to indices
        int fromFile = from.charAt(0) - 'a';
        int fromRank = Character.getNumericValue(from.charAt(1)) - 1;
        int toFile = to.charAt(0) - 'a';
        int toRank = Character.getNumericValue(to.charAt(1)) - 1;

        // Parse FEN
        String[] fenParts = currentPosition.split(" ");
        String[] ranks = fenParts[0].split("/");
        char[][] board = new char[8][8];

        // Convert FEN to 2D array
        for (int rank = 0; rank < 8; rank++) {
            int file = 0;
            for (int i = 0; i < ranks[7-rank].length() && file < 8; i++) {
                char c = ranks[7-rank].charAt(i);
                if (Character.isDigit(c)) {
                    int emptySquares = Character.getNumericValue(c);
                    for (int j = 0; j < emptySquares; j++) {
                        board[rank][file++] = ' ';
                    }
                } else {
                    board[rank][file++] = c;
                }
            }
        }

        // Make the move
        char piece = board[fromRank][fromFile];
        board[fromRank][fromFile] = ' ';
        
        // Handle promotion
        if (promotion != null && !promotion.isEmpty() && 
            ((piece == 'P' && toRank == 7) || (piece == 'p' && toRank == 0))) {
            board[toRank][toFile] = Character.isUpperCase(piece) ? 
                promotion.toUpperCase().charAt(0) : 
                promotion.toLowerCase().charAt(0);
        } else {
            board[toRank][toFile] = piece;
        }

        // Convert back to FEN
        StringBuilder newPosition = new StringBuilder();
        for (int rank = 7; rank >= 0; rank--) {
            int emptyCount = 0;
            for (int file = 0; file < 8; file++) {
                if (board[rank][file] == ' ') {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        newPosition.append(emptyCount);
                        emptyCount = 0;
                    }
                    newPosition.append(board[rank][file]);
                }
            }
            if (emptyCount > 0) {
                newPosition.append(emptyCount);
            }
            if (rank > 0) {
                newPosition.append('/');
            }
        }

        // Update turn
        boolean isWhiteTurn = fenParts[1].equals("w");
        newPosition.append(" ").append(isWhiteTurn ? "b" : "w");

        // Append remaining FEN parts (castling rights, en passant, etc.)
        for (int i = 2; i < fenParts.length; i++) {
            newPosition.append(" ").append(fenParts[i]);
        }

        return newPosition.toString();
    }

    private void checkGameEnd(Game game) {
        String[] fenParts = game.getCurrentPosition().split(" ");
        String position = fenParts[0];
        boolean isWhiteTurn = fenParts[1].equals("w");

        // Check for insufficient material
        if (hasInsufficientMaterial(position)) {
            game.setStatus("FINISHED");
            game.setWinner("DRAW");
            gameRepository.save(game);
            notifyGameEnd(game, "Draw by insufficient material");
            return;
        }

        // Check for stalemate or checkmate
        if (isStalemate(position, isWhiteTurn)) {
            game.setStatus("FINISHED");
            game.setWinner("DRAW");
            gameRepository.save(game);
            notifyGameEnd(game, "Draw by stalemate");
        } else if (isCheckmate(position, isWhiteTurn)) {
            game.setStatus("FINISHED");
            game.setWinner(isWhiteTurn ? "BLACK" : "WHITE");
            gameRepository.save(game);
            notifyGameEnd(game, isWhiteTurn ? "Black wins by checkmate" : "White wins by checkmate");
        }
    }

    private boolean hasInsufficientMaterial(String position) {
        // Count pieces
        int whitePieces = 0, blackPieces = 0;
        int whiteBishops = 0, blackBishops = 0;
        int whiteKnights = 0, blackKnights = 0;

        for (char c : position.toCharArray()) {
            switch (c) {
                case 'P':
                case 'p':
                case 'Q':
                case 'q':
                case 'R':
                case 'r':
                    return false; // These pieces are sufficient for mate
                case 'B':
                    whiteBishops++;
                    whitePieces++;
                    break;
                case 'b':
                    blackBishops++;
                    blackPieces++;
                    break;
                case 'N':
                    whiteKnights++;
                    whitePieces++;
                    break;
                case 'n':
                    blackKnights++;
                    blackPieces++;
                    break;
                case 'K':
                    whitePieces++;
                    break;
                case 'k':
                    blackPieces++;
                    break;
            }
        }

        // King vs King
        if (whitePieces == 1 && blackPieces == 1) {
            return true;
        }

        // King and Bishop vs King
        if ((whitePieces == 2 && whiteBishops == 1 && blackPieces == 1) ||
            (blackPieces == 2 && blackBishops == 1 && whitePieces == 1)) {
            return true;
        }

        // King and Knight vs King
        if ((whitePieces == 2 && whiteKnights == 1 && blackPieces == 1) ||
            (blackPieces == 2 && blackKnights == 1 && whitePieces == 1)) {
            return true;
        }

        return false;
    }

    private boolean isStalemate(String position, boolean isWhiteTurn) {
    // to be added later, now not even the connection is working so yeah
        return false;
    }

    private boolean isCheckmate(String position, boolean isWhiteTurn) {
      // to be added later, now not even the connection is working so yeah
        return false;
    }

    private void notifyGameStart(Game game, User whitePlayer, User blackPlayer) {
        System.out.println("GameService: Notifying game start");
        System.out.println("GameService: White player: " + whitePlayer.getId() + " (" + whitePlayer.getUsername() + ")");
        System.out.println("GameService: Black player: " + blackPlayer.getId() + " (" + blackPlayer.getUsername() + ")");

        // Notify white player
        Map<String, Object> whiteMessage = Map.of(
            "type", "GAME_STARTED",
            "gameId", game.getId(),
            "isWhite", true,
            "opponent", blackPlayer.getUsername()
        );
        System.out.println("GameService: Sending message to white player: " + whiteMessage);
        messagingTemplate.convertAndSendToUser(
            whitePlayer.getId(),
            "/user/queue/game-updates",
            whiteMessage
        );

        // Notify black player
        Map<String, Object> blackMessage = Map.of(
            "type", "GAME_STARTED",
            "gameId", game.getId(),
            "isWhite", false,
            "opponent", whitePlayer.getUsername()
        );
        System.out.println("GameService: Sending message to black player: " + blackMessage);
        messagingTemplate.convertAndSendToUser(
            blackPlayer.getId(),
            "/user/queue/game-updates",
            blackMessage
        );
    }

    private void notifyMove(String playerId, String gameId, Map<String, String> move) {
        System.out.println("GameService: Notifying move to player: " + playerId);
        messagingTemplate.convertAndSendToUser(
            playerId,
            "/user/queue/game-updates",
            Map.of(
                "type", "MOVE_MADE",
                "gameId", gameId,
                "move", move
            )
        );
    }

    private void notifyGameEnd(Game game, String reason) {
        System.out.println("GameService: Notifying game end - " + reason);
        Map<String, Object> message = Map.of(
            "type", "GAME_ENDED",
            "gameId", game.getId(),
            "reason", reason
        );

        messagingTemplate.convertAndSendToUser(
            game.getWhitePlayerId(),
            "/user/queue/game-updates",
            message
        );

        messagingTemplate.convertAndSendToUser(
            game.getBlackPlayerId(),
            "/user/queue/game-updates",
            message
        );
    }
} 