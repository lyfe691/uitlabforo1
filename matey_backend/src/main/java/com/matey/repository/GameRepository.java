package com.matey.repository;

import com.matey.model.Game;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameRepository extends MongoRepository<Game, String> {
    List<Game> findByStatus(String status);
    List<Game> findByWhitePlayerIdOrBlackPlayerId(String whitePlayerId, String blackPlayerId);
    Optional<Game> findByIdAndStatus(String id, String status);
} 