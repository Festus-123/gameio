"use client";

import HomeControl from "@/components/home-control/HomeControl";
import ResetControl from "@/components/reset-control/ResetControl";
import Tiles from "@/components/tiles/Tiles";
import { useEffect, useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";

// Track metadata for each active board block
type TileState = {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
};

const MatchTiles = () => {
  const [boardTiles, setBoardTiles] = useState<TileState[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(45); // 45 seconds total game duration
  const [gameState, setGameState] = useState<"PLAYING" | "WON" | "FAILED">(
    "PLAYING",
  );
  const [isPaused, setIsPaused] = useState<boolean>(false); // Added pause state tracking

  const baseTiles = [
    "😎",
    "😁",
    "🥶",
    "🎮",
    "😍",
    "😓",
    "🤑",
    "🤬",
    "🤡",
    "💀",
    "👺",
    "🙉",
  ];

  // Initialize and shuffle board pairs
  const initializeGame = () => {
    const gameSet = baseTiles.slice(0, 8);
    const duplicatedPairs = [...gameSet, ...gameSet];

    const shuffled = duplicatedPairs
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }))
      .sort(() => Math.random() - 0.5);

    setBoardTiles(shuffled);
    setTimeLeft(45);
    setGameState("PLAYING");
    setIsPaused(false); // Reset pause state on new match initialization
    setSelectedIndices([]);
  };

  // Run game bootstrap setup once on component build mount
  useEffect(() => {
    initializeGame();
  }, []);

  // Game Loop Countdown Timer Engine
  useEffect(() => {
    // FIXED: Halt the timer engine completely if game is paused
    if (gameState !== "PLAYING" || isPaused) return;

    if (timeLeft <= 0) {
      setGameState("FAILED");
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, gameState, isPaused]);

  // Click handler evaluation logic
  const handleTileClick = (clickedIndex: number) => {
    // FIXED: Block player inputs completely if the match is paused
    if (gameState !== "PLAYING" || isPaused) return;

    const targetTile = boardTiles[clickedIndex];
    if (
      targetTile.isFlipped ||
      targetTile.isMatched ||
      selectedIndices.length >= 2
    )
      return;

    const updatedIndices = [...selectedIndices, clickedIndex];

    setBoardTiles((prev) =>
      prev.map((tile, idx) =>
        idx === clickedIndex ? { ...tile, isFlipped: true } : tile,
      ),
    );
    setSelectedIndices(updatedIndices);

    if (updatedIndices.length === 2) {
      const [firstIdx, secondIdx] = updatedIndices;
      const firstTile = boardTiles[firstIdx];
      const secondTile = boardTiles[secondIdx];

      if (firstTile.emoji === secondTile.emoji) {
        setTimeout(() => {
          setBoardTiles((prev) => {
            const next = prev.map((tile, idx) =>
              idx === firstIdx || idx === secondIdx
                ? { ...tile, isMatched: true, isFlipped: false }
                : tile,
            );

            if (next.every((t) => t.isMatched)) {
              setGameState("WON");
            }
            return next;
          });
          setSelectedIndices([]);
        }, 400);
      } else {
        setTimeout(() => {
          setBoardTiles((prev) =>
            prev.map((tile, idx) =>
              idx === firstIdx || idx === secondIdx
                ? { ...tile, isFlipped: false }
                : tile,
            ),
          );
          setSelectedIndices([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-red-400 font-mono ">
      {/* Scanline CRT overlay effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,0,0.06))] bg-[length:100%_4px,3px_100%] z-10"></div>

      {/* Retro Header Board Panel Stats HUD */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-6 z-20 text-white bg-black border-2 border-orange-500 p-3 shadow-[4px_4px_0px_#ea580c]">
        <div className="text-xs tracking-wider">
          TIME:{" "}
          <span
            className={`text-sm font-black ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-yellow-400"}`}
          >
            {timeLeft}s
          </span>
        </div>

        {/* Toggle Pause button built inside the HUD parameters directly */}
        {gameState === "PLAYING" && (
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            className="px-2 py-0.5  text-xl hover:bg-zinc-700 active:scale-95 text-white font-black tracking-widest uppercase transition-transform"
          >
            {isPaused ? <FaPlay /> : <FaPause />}
          </button>
        )}

        <div className="text-xs uppercase tracking-wider font-bold">
          STATUS: {isPaused ? "PAUSED" : gameState}
        </div>
      </div>

      {/* Playing field layout board box context canvas */}
      <div className="relative w-full max-w-4xl min-h-100 h-max">
        <div className="grid grid-cols-4 gap-2 w-full h-full">
          {boardTiles.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleTileClick(index)}
              className={`w-full h-full border-2 border-green-500 flex items-center justify-center cursor-pointer transition-all duration-200 min-h-24
                ${item.isMatched ? "opacity-25 border-zinc-700 bg-zinc-900 scale-95 cursor-not-allowed pointer-events-none" : ""}
                ${item.isFlipped ? "bg-zinc-800 border-yellow-400 text-3xl" : "bg-zinc-900 text-transparent"}
              `}
            >
              <span
                className={`drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] ${item.isFlipped || item.isMatched ? "block" : "hidden"}`}
              >
                {item.emoji}
              </span>
              {!item.isFlipped && !item.isMatched && (
                <span className="text-zinc-600 font-bold text-xs">❓</span>
              )}
            </div>
          ))}
        </div>

        {/* Retro Inline Board Freeze Overlay when Game is Paused */}
        {isPaused && gameState === "PLAYING" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 border-4 border-dashed border-orange-500 animate-fade-in">
            <h2 className="text-orange-500 font-black text-3xl tracking-widest uppercase bg-zinc-950 px-6 py-3 border-2 border-orange-500 shadow-[4px_4px_0px_#000] animate-pulse">
              GAME PAUSED
            </h2>
            <p className="text-zinc-400 text-[10px] uppercase tracking-widest mt-2 bg-black px-2">
              Click Resume above to continue
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <HomeControl />
              <ResetControl onclick={initializeGame} />
            </div>
          </div>
        )}
      </div>

      {/* Screen Modals Overlays */}
      {gameState !== "PLAYING" && (
        <div className="absolute inset-0 bg-black/90 flex flex-col gap-4 justify-center items-center z-50 p-4">

            <h2
              className={`font-black text-4xl md:text-6xl uppercase tracking-tighter mb-2 ${gameState === "WON" ? "text-green-500" : "text-red-500"}`}
            >
              {gameState === "WON" ? "🎉 STAGE CLEARED" : "💀 TIME EXPIRED"}
            </h2>
            <p className="text-lg text-zinc-400 mb-6 uppercase tracking-widest">
              {gameState === "WON"
                ? "Outstanding Reflexes!"
                : "Too slow on the draw."}
            </p>
            <div className="flex items-center justify-center gap-4">
              <HomeControl />
              <ResetControl onclick={initializeGame} />
            </div>
        </div>
      )}
    </div>
  );
};

export default MatchTiles;
