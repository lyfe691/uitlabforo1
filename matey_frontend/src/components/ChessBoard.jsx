import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

const ChessBoard = ({ gameId, onMove, opponentMove, isPlayerTurn }) => {
  const [game, setGame] = useState(new Chess());
  const [moveFrom, setMoveFrom] = useState('');
  const [rightClickedSquares, setRightClickedSquares] = useState({});
  const [moveSquares, setMoveSquares] = useState({});
  const [optionSquares, setOptionSquares] = useState({});
  const [promotionSquare, setPromotionSquare] = useState(null);

  // Reset game when gameId changes
  useEffect(() => {
    console.log('Game ID changed:', gameId);
    if (gameId) {
      const newGame = new Chess();
      console.log('Resetting game state with new game instance');
      setGame(newGame);
      setMoveFrom('');
      setRightClickedSquares({});
      setMoveSquares({});
      setOptionSquares({});
      setPromotionSquare(null);
    }
  }, [gameId]);

  // Handle opponent's move
  useEffect(() => {
    if (opponentMove && !isPlayerTurn) {
      console.log('Processing opponent move:', opponentMove);
      const gameCopy = new Chess(game.fen());
      try {
        const result = gameCopy.move({
          from: opponentMove.from,
          to: opponentMove.to,
          promotion: opponentMove.promotion || undefined
        });
        
        if (result) {
          console.log('Opponent move applied successfully');
          setGame(gameCopy);
          
          // Highlight the opponent's move
          setMoveSquares({
            [opponentMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
            [opponentMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
          });

          // Check game status
          if (gameCopy.isGameOver()) {
            console.log('Game is over:', {
              isCheckmate: gameCopy.isCheckmate(),
              isDraw: gameCopy.isDraw(),
              isStalemate: gameCopy.isStalemate(),
              isThreefoldRepetition: gameCopy.isThreefoldRepetition(),
              isInsufficientMaterial: gameCopy.isInsufficientMaterial()
            });
          }
        } else {
          console.error('Move was invalid according to chess.js');
        }
      } catch (e) {
        console.error('Error applying opponent move:', e);
      }
    }
  }, [opponentMove, isPlayerTurn, game]);

  const getMoveOptions = useCallback((square) => {
    if (!isPlayerTurn) {
      console.log('Not player turn, ignoring move options request');
      return false;
    }

    const moves = game.moves({
      square,
      verbose: true
    });
    
    if (moves.length === 0) {
      console.log('No valid moves from square:', square);
      setOptionSquares({});
      return false;
    }

    console.log('Valid moves from square:', square, moves);
    const newSquares = {};
    moves.forEach((move) => {
      newSquares[move.to] = {
        background:
          game.get(move.to) && game.get(move.to).color !== game.get(square).color
            ? 'radial-gradient(circle, rgba(255,0,0,.1) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
        borderRadius: '50%'
      };
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)'
    };
    setOptionSquares(newSquares);
    return true;
  }, [game, isPlayerTurn]);

  const onSquareClick = useCallback((square) => {
    if (!isPlayerTurn) {
      console.log('Not player turn, ignoring click');
      return;
    }

    setRightClickedSquares({});

    // Check if we're moving
    if (moveFrom) {
      console.log('Attempting move from', moveFrom, 'to', square);
      
      // Check if clicked square is a valid move
      const moves = game.moves({
        square: moveFrom,
        verbose: true
      });
      const move = moves.find(m => m.to === square);

      if (move) {
        // Check for pawn promotion
        if (move.flags.includes('p')) {
          setPromotionSquare(square);
          return;
        }

        const gameCopy = new Chess(game.fen());
        try {
          const result = gameCopy.move({
            from: moveFrom,
            to: square,
            promotion: 'q' // Default to queen for non-promotion moves
          });

          if (result) {
            console.log('Move applied successfully:', result);
            setGame(gameCopy);
            // Clear highlights
            setMoveSquares({
              [moveFrom]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
              [square]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
            });
            setOptionSquares({});
            // Notify parent of move
            onMove({
              from: moveFrom,
              to: square,
              promotion: result.promotion || undefined
            });
          }
        } catch (e) {
          console.error('Error applying move:', e);
        }
      } else {
        console.log('Invalid move attempted');
      }
      setMoveFrom('');
      return;
    }

    // Check if the square has a piece that can move
    const piece = game.get(square);
    if (piece) {
      console.log('Selected piece:', piece, 'at square:', square);
      if (
        (piece.color === 'w' && isPlayerTurn) ||
        (piece.color === 'b' && !isPlayerTurn)
      ) {
        const hasMoves = getMoveOptions(square);
        if (hasMoves) {
          console.log('Setting move from:', square);
          setMoveFrom(square);
        }
      }
    }
  }, [game, isPlayerTurn, moveFrom, onMove, getMoveOptions]);

  const onPromotionPieceSelect = useCallback((piece) => {
    if (!promotionSquare || !moveFrom) return;

    const gameCopy = new Chess(game.fen());
    try {
      const result = gameCopy.move({
        from: moveFrom,
        to: promotionSquare,
        promotion: piece[1].toLowerCase()
      });

      if (result) {
        console.log('Promotion move applied successfully:', result);
        setGame(gameCopy);
        // Clear highlights
        setMoveSquares({
          [moveFrom]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
          [promotionSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
        });
        setOptionSquares({});
        // Notify parent of move
        onMove({
          from: moveFrom,
          to: promotionSquare,
          promotion: piece[1].toLowerCase()
        });
      }
    } catch (e) {
      console.error('Error applying promotion move:', e);
    }

    setPromotionSquare(null);
    setMoveFrom('');
  }, [game, moveFrom, promotionSquare, onMove]);

  const onSquareRightClick = useCallback((square) => {
    const colour = 'rgba(0, 0, 255, 0.4)';
    setRightClickedSquares({
      ...rightClickedSquares,
      [square]:
        rightClickedSquares[square] &&
        rightClickedSquares[square].backgroundColor === colour
          ? undefined
          : { backgroundColor: colour }
    });
  }, [rightClickedSquares]);

  return (
    <div style={{ 
      width: '100%',
      maxWidth: '1000px',
      aspectRatio: '1/1'
    }}>
      <Chessboard
        id={gameId || 'main'}
        position={game.fen()}
        onSquareClick={onSquareClick}
        onSquareRightClick={onSquareRightClick}
        onPromotionPieceSelect={onPromotionPieceSelect}
        customSquareStyles={{
          ...moveSquares,
          ...optionSquares,
          ...rightClickedSquares
        }}
        boardOrientation={isPlayerTurn ? 'white' : 'black'}
      />
    </div>
  );
};

export default ChessBoard; 