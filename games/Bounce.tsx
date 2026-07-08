"use client";
import HomeControl from "@/components/home-control/HomeControl";
import ResetControl from "@/components/reset-control/ResetControl";
import { useState, useEffect, useRef } from "react";

import { FaPause, FaPlay } from "react-icons/fa";

type Obstacle = {
  id: number;
  left: number; // Percentage from left boundary (0 to 100)
  width: number; // Width percentage
  height: number; // Height percentage
};

const Bounce = () => {
  // Game state controls
  const [gameState, setGameState] = useState<
    "MENU" | "PLAYING" | "PAUSED" | "FAIL"
  >("MENU");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Ball physics configuration variables
  const [ballY, setBallY] = useState(50);
  const velocityRef = useRef(0);
  const jumpCountRef = useRef(0); // Tracking multi-jump counts (up to 2 jumps)

  const GRAVITY = 0.5;
  const IDLE_BOUNCE_FORCE = -5; // Small, automatic gentle bounce on floor impact
  const BASE_BOUNCE_FORCE = -10; // First intentional space-bar bounce
  const DOUBLE_BOUNCE_FORCE = -14; // Second immediate space-bar bounce
  const TERMINAL_VELOCITY = 14;

  // Obstacles track tracking arrays
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const nextObstacleId = useRef(0);
  const obstacleSpawnTimer = useRef(0);

  // References to bypass React stale state boundaries inside loops
  const stateRef = useRef(gameState);
  stateRef.current = gameState;
  const speedRef = useRef(speedMultiplier);
  speedRef.current = speedMultiplier;

  // Load High Score from local storage on mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem("retro_bounce_highscore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Trigger a manual bounce (Space / Click)
  const handleBounce = () => {
    if (stateRef.current !== "PLAYING") return;

    if (jumpCountRef.current === 0) {
      velocityRef.current = BASE_BOUNCE_FORCE;
      jumpCountRef.current = 1;
    } else if (jumpCountRef.current === 1) {
      velocityRef.current = DOUBLE_BOUNCE_FORCE;
      jumpCountRef.current = 2;
    }
  };

  const selectDifficulty = (multiplier: number) => {
    setSpeedMultiplier(multiplier);
    startGame();
  };

  const startGame = () => {
    setScore(0);
    setBallY(40);
    velocityRef.current = 0;
    jumpCountRef.current = 0;
    setObstacles([]);
    nextObstacleId.current = 0;
    obstacleSpawnTimer.current = 0;
    setGameState("PLAYING");
  };

  // Global Key Event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        if (stateRef.current === "PLAYING") {
          handleBounce();
        } else if (stateRef.current === "MENU") {
          selectDifficulty(1.0); // Default fallback if they space past menu
        }
        // Removed the "FAIL" state automatic restart check to fix the accidental spacebar continue
      }
      if (e.key === "p" || e.key === "P") {
        if (stateRef.current === "PLAYING") setGameState("PAUSED");
        else if (stateRef.current === "PAUSED") setGameState("PLAYING");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Main Game Loop Engine
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = () => {
      if (stateRef.current !== "PLAYING") {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      // 1. Process Ball Gravity Physics
      velocityRef.current = Math.min(
        velocityRef.current + GRAVITY,
        TERMINAL_VELOCITY,
      );
      let nextBallY = 0;

      setBallY((prevY) => {
        const computedY = prevY + velocityRef.current;

        // Floor Boundary: Triggers automatic small gentle bounce
        if (computedY >= 82) {
          velocityRef.current = IDLE_BOUNCE_FORCE;
          jumpCountRef.current = 0; // Reset double-jump capacity upon touching floor
          return 82;
        }

        // Ceiling Constraints Configuration
        if (computedY <= 0) {
          velocityRef.current = 2;
          return 0;
        }

        nextBallY = computedY;
        return computedY;
      });

      // 2. Score Tracking & Storage Syncing
      setScore((prev) => {
        const newScore = prev + 1;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem("retro_bounce_highscore", newScore.toString());
        }
        return newScore;
      });

      // 3. Spawning Randomised Incoming Brick Obstacles
      obstacleSpawnTimer.current += 1;
      const spawnThreshold = Math.max(40, 80 / speedRef.current);
      if (obstacleSpawnTimer.current >= spawnThreshold) {
        if (Math.random() > 0.4 || obstacles.length === 0) {
          const randomWidth = Math.floor(Math.random() * 3) + 5;
          const randomHeight = Math.floor(Math.random() * 20) + 15;

          setObstacles((prev) => [
            ...prev,
            {
              id: nextObstacleId.current++,
              left: 100,
              width: randomWidth,
              height: randomHeight,
            },
          ]);
          obstacleSpawnTimer.current = 0;
        }
      }

      // 4. Handle Movement & 2D Box Collisions
      setObstacles((prevObstacles) => {
        const updatedObstacles = prevObstacles
          .map((obs) => ({
            ...obs,
            left: obs.left - 0.8 * speedRef.current,
          }))
          .filter((obs) => obs.left + obs.width > 0);

        const ballLeft = 20;
        const ballRight = 24;
        const ballTop = nextBallY;
        const ballBottom = nextBallY + 6;

        for (const obs of updatedObstacles) {
          const obsLeft = obs.left;
          const obsRight = obs.left + obs.width;
          const obsTop = 88 - obs.height;

          if (
            ballRight > obsLeft &&
            ballLeft < obsRight &&
            ballBottom > obsTop
          ) {
            setGameState("FAIL");
          }
        }

        return updatedObstacles;
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [highScore]);

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden relative select-none font-mono p-4">
      {/* HUD Dashboard */}
      {gameState !== "MENU" && (
        <div className="absolute top-5 left-5 flex gap-6 text-green-400 text-sm z-40 bg-black border-2 border-green-400 p-2 shadow-[4px_4px_0px_#22c55e]">
          <div>
            SCORE: <span>{score}</span>
          </div>
          <div>
            HI-SCORE: <span>{highScore}</span>
          </div>
        </div>
      )}

      {/* Pause Button */}
      {gameState === "PLAYING" && (
        <button
          onClick={() => setGameState("PAUSED")}
          className="absolute top-5 right-5 bg-black hover:bg-zinc-900 text-green-400 border-2 border-green-400 px-4 py-2 font-bold z-40 shadow-[4px_4px_0px_#22c55e] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all text-xs uppercase"
        >
          <FaPause />
        </button>
      )}

      {/* CLASSIC 2D MENU OVERLAY */}
      {gameState === "MENU" && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="absolute top-5 left-5">
            <HomeControl />
          </div>

          <div className="bg-zinc-900 p-8 border-4 border-double border-orange-500 max-w-sm w-full text-center text-white shadow-[8px_8px_0px_#ea580c]">
            <h1 className="text-3xl font-black tracking-tighter mb-1 text-orange-500 animate-pulse">
              🎮 RETRO BOUNCE
            </h1>
            <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-6">
              Double-tap SPACE for Super Height
            </p>

            <div className="flex flex-col gap-4 w-full text-black">
              <button
                onClick={() => selectDifficulty(1.0)}
                className="w-full bg-yellow-400 hover:bg-yellow-300 font-bold py-2 border-b-4 border-yellow-700 active:border-b-0 uppercase text-sm tracking-wider"
              >
                Easy
              </button>
              <button
                onClick={() => selectDifficulty(1.4)}
                className="w-full bg-orange-500 hover:bg-orange-400 font-bold py-2 border-b-4 border-orange-800 active:border-b-0 uppercase text-sm tracking-wider"
              >
                Medium
              </button>
              <button
                onClick={() => selectDifficulty(2.0)}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 border-b-4 border-red-900 active:border-b-0 uppercase text-sm tracking-wider"
              >
                Difficult
              </button>
            </div>
            <div className="mt-6 text-zinc-500 text-[11px] uppercase">
              Current Record: {highScore} PTS
            </div>
          </div>
        </div>
      )}

      {/* PAUSE SCREEN */}
      {gameState === "PAUSED" && (
        <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center gap-4 z-50">
          <p className="text-yellow-400 font-bold tracking-widest text-2xl border-4 border-dashed border-yellow-400 p-4 bg-black">
            GAME PAUSED
          </p>
          <div className="flex items-center gap-4 mt-4">
            <HomeControl />
            <ResetControl onclick={startGame} />
            <button
              onClick={() => setGameState("PLAYING")}
              className="rounded-full p-4 border-white border-2 text-2xl md:text-4xl text-white"
            >
              <FaPause />
            </button>
          </div>
        </div>
      )}

      {/* FAIL GAME OVER OVERLAY */}
      {gameState === "FAIL" && (
        <div className="absolute inset-0 bg-black/95 flex flex-col gap-4 justify-center items-center z-50 p-4">
          <div className="border-4 border-red-600 p-6 text-center bg-zinc-900 max-w-sm w-full shadow-[8px_8px_0px_#dc2626]">
            <h1 className="text-red-600 font-black text-3xl uppercase tracking-tighter mb-4">
              GAME FAILED
            </h1>

            <div className="flex flex-col gap-2 font-mono text-sm uppercase mb-6 bg-black/40 p-3 border border-zinc-700 text-left">
              <div className="text-zinc-400 flex justify-between">
                <span>Your Run:</span>
                <span className="text-white font-bold">{score} pts</span>
              </div>
              <div className="text-zinc-400 flex justify-between border-t border-zinc-800 pt-1">
                <span>High Score:</span>
                <span className="text-green-400 font-bold">
                  {highScore} pts
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-4">
              <HomeControl />
              <ResetControl onclick={startGame} />
            </div>
          </div>
        </div>
      )}

      {/* 2D ARCADE RENDER SCREEN VIEW CONTAINER */}
      <div
        onClick={handleBounce}
        className="w-full h-full bg-zinc-950 rounded-none border-4 border-dashed border-zinc-700 relative overflow-hidden cursor-pointer"
      >
        {/* Retro scanline overlay screen effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,0,0.06))] bg-[length:100%_4px,3px_100%] z-40"></div>

        {/* Action Jump Indicator Hint */}
        {gameState === "PLAYING" && score < 120 && (
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none text-zinc-700 font-bold text-xs text-center select-none uppercase tracking-widest animate-pulse">
            Press Spacebar Once to Jump / Double-Press for Max Air
          </div>
        )}

        {/* Pixel/8-Bit Style Ball Actor */}
        <div
          style={{
            top: `${ballY}%`,
            left: `20%`,
          }}
          className="absolute w-8 h-8 bg-yellow-400 border-2 border-black z-30 shadow-[2px_2px_0px_rgba(255,255,0,0.4)] flex items-center justify-center rounded-none"
        >
          {/* Retro Face Detail */}
          <div className="flex gap-1 justify-center w-full">
            <span className="w-1 h-1 bg-black block"></span>
            <span className="w-1 h-1 bg-black block"></span>
          </div>
        </div>

        {/* Stylized Brick Wall Obstacles */}
        {obstacles.map((obs) => (
          <div
            key={obs.id}
            style={{
              left: `${obs.left}%`,
              width: `${obs.width}%`,
              height: `${obs.height}%`,
              bottom: "12%",
            }}
            className="absolute bg-orange-600 border-2 border-black z-20 flex flex-col justify-between overflow-hidden shadow-[4px_0px_0px_rgba(0,0,0,0.5)]"
          >
            {/* Retro 2D Brick Row Alternating Subdivisions */}
            <div className="w-full h-2 border-b border-black/30 bg-orange-500 opacity-85"></div>
            <div className="w-full h-2 border-b border-black/30 bg-orange-700 opacity-90 flex justify-around">
              <span className="w-0.5 h-full bg-black/40"></span>
              <span className="w-0.5 h-full bg-black/40"></span>
            </div>
            <div className="w-full h-2 border-b border-black/30 bg-orange-500 opacity-85"></div>
            <div className="w-full h-full bg-orange-600"></div>
          </div>
        ))}

        {/* Level Horizon Floor Line Anchor (8-Bit Checkered Track Floor Layout) */}
        <div className="absolute bottom-0 left-0 right-0 h-[12%] bg-zinc-800 border-t-4 border-green-500 z-10 flex flex-col justify-between p-0.5">
          <div className="w-full h-1/2 bg-[repeating-linear-gradient(90deg,#22c55e,#22c55e_10px,#166534_10px,#166534_20px)] opacity-80"></div>
          <div className="w-full h-1/2 bg-zinc-900"></div>
        </div>
      </div>

      {/* On-Screen Mobile Action Assist Control Trigger */}
      {gameState === "PLAYING" && (
        <button
          onClick={handleBounce}
          className="absolute bottom-8 px-10 py-3 bg-orange-500 text-black font-black border-2 border-black rounded-none shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all md:hidden z-40 text-sm tracking-wider"
        >
          BOUNCE BUTTON
        </button>
      )}
    </div>
  );
};

export default Bounce;
