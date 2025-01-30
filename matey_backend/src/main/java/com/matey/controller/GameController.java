package com.matey.controller;

import com.matey.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import java.util.Map;

@Controller
public class GameController {
    @Autowired
    private GameService gameService;

    @MessageMapping("/player/connect")
    public void handlePlayerConnect(@Payload Map<String, String> payload) {
        String userId = payload.get("userId");
        String username = payload.get("username");
        gameService.handlePlayerConnect(userId, username);
    }

    @MessageMapping("/player/disconnect")
    public void handlePlayerDisconnect(@Payload Map<String, String> payload) {
        String userId = payload.get("userId");
        gameService.handlePlayerDisconnect(userId);
    }

    @MessageMapping("/online-users/get")
    public void getOnlineUsers(@Payload Map<String, String> payload) {
        gameService.broadcastOnlineUsers();
    }

    @MessageMapping("/game/find")
    public void findGame(@Payload Map<String, String> payload) {
        String userId = payload.get("userId");
        System.out.println("GameController: Received find game request for user: " + userId);
        System.out.println("GameController: Payload: " + payload);
        gameService.findGame(userId);
    }

    @MessageMapping("/game/cancel")
    public void cancelSearch(@Payload Map<String, String> payload) {
        String userId = payload.get("userId");
        System.out.println("GameController: Received cancel search request for user: " + userId);
        gameService.cancelSearch(userId);
    }

    @MessageMapping("/game/move")
    public void handleMove(@Payload Map<String, Object> payload) {
        String gameId = (String) payload.get("gameId");
        String playerId = (String) payload.get("playerId");
        @SuppressWarnings("unchecked")
        Map<String, String> move = (Map<String, String>) payload.get("move");
        
        gameService.handleMove(gameId, playerId, move);
    }

    @MessageMapping("/game/resign")
    public void handleResign(@Payload Map<String, String> payload) {
        String gameId = payload.get("gameId");
        String playerId = payload.get("playerId");
        gameService.handleResign(gameId, playerId);
    }
} 