"use client";
import { useState, useEffect, useRef } from "react";

type Obstacle = {
  id: number;
  left: number; // Percentage from left boundary (0 to 100)
  width: number; // Width percentage
  height: number; // Height percentage
};

const Bounce = () => {
  // Game state controls
  const [gameState, setGameState] = useState<"MENU" | "PLAYING" | "PAUSED" | "FAIL">("MENU");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // Modifies object speeds based on difficulty

  // Ball physics configuration variables (Calculated in grid percentages)
  const [ballY, setBallY] = useState(50); // Vertical axis position (0 is top, 100 is ground)
  const velocityRef = useRef(0); // Going up/down accumulator metric
  
  const GRAVITY = 0.6;
  const BOUNCE_FORCE = -12;
  const TERMINAL_VELOCITY = 15;

  // Obstacles track tracking arrays
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const nextObstacleId = useRef(0);
  const obstacleSpawnTimer = useRef(0);

  // References to bypass React stale state boundaries inside requestAnimationFrame loops
  const stateRef = useRef(gameState);
  stateRef.current = gameState;
  const speedRef = useRef(speedMultiplier);
  speedRef.current = speedMultiplier;

  // Trigger a bounce
  const handleBounce = () => {
    if (stateRef.current !== "PLAYING") return;
    velocityRef.current = BOUNCE_FORCE;
  };

  // Set difficulty profile selection parameters
  const selectDifficulty = (multiplier: number) => {
    setSpeedMultiplier(multiplier);
    startGame();
  };

  const startGame = () => {
    setScore(0);
    setBallY(40);
    velocityRef.current = 0;
    setObstacles([]);
    nextObstacleId.current = 0;
    obstacleSpawnTimer.current = 0;
    setGameState("PLAYING");
  };

  // Global Key Event listeners for jump actions & pauses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault(); // Mute standard page scrolling behaviors
        if (stateRef.current === "PLAYING") {
          handleBounce();
        } else if (stateRef.current === "MENU") {
          // Defaults to Normal mode if space is pounded on raw splash menu
          selectDifficulty(1.2);
        } else if (stateRef.current === "FAIL") {
          startGame();
        }
      }
      if (e.key === "p" || e.key === "P") {
        if (stateRef.current === "PLAYING") setGameState("PAUSED");
        else if (stateRef.current === "PAUSED") setGameState("PLAYING");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Main Game Tick Loop (Runs at smooth 60fps utilizing requestAnimationFrame mechanics)
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = () => {
      if (stateRef.current !== "PLAYING") {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      // 1. Process Ball Gravity Physics
      velocityRef.current = Math.min(velocityRef.current + GRAVITY, TERMINAL_VELOCITY);
      let nextBallY = 0;
      
      setBallY((prevY) => {
        const computedY = prevY + velocityRef.current;
        // Floor collision boundary configuration
        if (computedY >= 88) {
          velocityRef.current = 0; // Kills residual speed inertia
          return 88;
        }
        // Ceiling constraints configuration
        if (computedY <= 0) {
          velocityRef.current = 2; // Bounces downwards gently off screen ceiling
          return 0;
        }
        nextBallY = computedY;
        return computedY;
      });

      // 2. Continuous Scoring updates
      setScore((prev) => {
        const newScore = prev + 1;
        if (newScore > highScore) setHighScore(newScore);
        return newScore;
      });

      // 3. Spawning Randomised Incoming Ground Obstacles 
      obstacleSpawnTimer.current += 1;
      // Spawns obstacles roughly every 1.5 to 2.5 seconds dynamically scaled to speed profiles
      const spawnThreshold = Math.max(50, 90 / speedRef.current);
      if (obstacleSpawnTimer.current >= spawnThreshold) {
        if (Math.random() > 0.45 || obstacles.length === 0) {
          const randomWidth = Math.floor(Math.random() * 5) + 4; // Width 4% to 8%
          const randomHeight = Math.floor(Math.random() * 25) + 15; // Height 15% to 40%
          
          setObstacles((prev) => [
            ...prev,
            {
              id: nextObstacleId.current++,
              left: 100, // Starts off-screen right edge
              width: randomWidth,
              height: randomHeight,
            },
          ]);
          obstacleSpawnTimer.current = 0;
        }
      }

      // 4. Update Obstacle Movements & Collision Grid Parsing Logic
      setObstacles((prevObstacles) => {
        const updatedObstacles = prevObstacles
          .map((obs) => ({
            ...obs,
            left: obs.left - 0.75 * speedRef.current, // Shift leftwards based on chosen speed
          }))
          .filter((obs) => obs.left + obs.width > 0); // Cleanup out-of-bounds nodes cleanly

        // Collision Check Framework
        // Ball bounds representation metrics: Left static horizontal slice = 20% mark layout
        const ballLeft = 20;
        const ballRight = 24; // Ball diameter spans roughly ~4% horizontal grid weight
        const ballTop = nextBallY;
        const ballBottom = nextBallY + 5.5; // Vertical payload slice clearance diameter

        for (const obs of updatedObstacles) {
          const obsLeft = obs.left;
          const obsRight = obs.left + obs.width;
          const obsTop = 100 - obs.height; // Since objects sit pinned to ground coordinate layout

          // Standard 2D Axis-Aligned Bounding Box Intersection evaluations
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
    <div className="w-full h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden relative select-none font-sans">
      
      {/* Heads Up Real-Time Score Dashboard HUD Panel */}
      {gameState !== "MENU" && (
        <div className="absolute top-5 left-5 flex gap-6 text-white font-mono z-40 bg-black/30 backdrop-blur px-4 py-2 rounded-xl border border-white/10">
          <div>SCORE: <span className="text-yellow-400 font-bold">{score}</span></div>
          <div>BEST: <span className="text-emerald-400 font-bold">{highScore}</span></div>
        </div>
      )}

      {/* Pause Mode Toggler Action Trigger Item */}
      {gameState === "PLAYING" && (
        <button
          onClick={() => setGameState("PAUSED")}
          className="absolute top-5 right-5 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold z-40 backdrop-blur border border-white/20 active:scale-95 transition-all text-xs md:text-sm"
        >
          ⏸ PAUSE (P)
        </button>
      )}

      {/* MENU STATE OVERLAY */}
      {gameState === "MENU" && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-11/12 border-2 border-purple-500 text-center animate-fade-in text-white">
            <h1 className="text-3xl font-black tracking-wider mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              🚀 INFINITE BOUNCE
            </h1>
            <p className="text-gray-400 text-xs font-semibold mb-6 uppercase tracking-widest">
              Tap Spacebar to bounce higher over objects
            </p>
            
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => selectDifficulty(1.0)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl border-b-4 border-emerald-800 active:scale-95 transition-transform tracking-wide">
                🟢 Casual (Slow)
              </button>
              <button 
                onClick={() => selectDifficulty(1.4)}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-xl border-b-4 border-amber-800 active:scale-95 transition-transform tracking-wide">
                🟡 Arcade (Medium)
              </button>
              <button 
                onClick={() => selectDifficulty(1.8)}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-6 rounded-xl border-b-4 border-rose-800 active:scale-95 transition-transform tracking-wide">
                🔴 Hyper (Fast)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE OVERLAY VIEW PANEL */}
      {gameState === "PAUSED" && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col justify-center items-center gap-4 z-50">
          <p className="text-white font-black tracking-widest text-3xl animate-pulse">GAME PAUSED</p>
          <button 
            onClick={() => setGameState("PLAYING")}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
          >
            ▶ Resume Game
          </button>
        </div>
      )}

      {/* FAIL CONDITION WINDOW SCREEN OVERLAY */}
      {gameState === "FAIL" && (
        <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-md flex flex-col gap-4 justify-center items-center z-50">
          <h1 className="text-7xl">💥</h1>
          <p className="text-white font-black text-3xl md:text-5xl tracking-wide uppercase">CRASH LANDED</p>
          <div className="text-rose-200 font-mono text-lg bg-black/40 px-6 py-2 rounded-xl border border-rose-500/30">
            Final Score: <span className="text-white font-bold">{score}</span>
          </div>
          <button
            onClick={() => setGameState("MENU")} // Sends player back to select different speeds
            className="mt-2 px-8 py-3 bg-white text-rose-950 rounded-xl font-black uppercase tracking-wider hover:bg-neutral-100 active:scale-95 shadow-2xl transition-all"
          >
            Play Again
          </button>
        </div>
      )}

      {/* ACTIVE GAME RENDERING CONTAINER CANVAS */}
      <div 
        onClick={handleBounce} 
        className="w-full max-w-4xl h-[450px] bg-slate-950/50 rounded-2xl border-2 border-white/10 relative overflow-hidden backdrop-blur-sm cursor-pointer shadow-2xl"
      >
        {/* Background Instruction Hints */}
        {gameState === "PLAYING" && score < 150 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white/10 font-bold uppercase tracking-widest text-center select-none text-sm p-4">
            Press Spacebar or Click Screen Container directly to Bounce!
          </div>
        )}

        {/* Dynamic Ball Actor Element */}
        <div
          style={{
            top: `${ballY}%`,
            left: `20%`,
          }}
          className="absolute w-10 h-10 bg-gradient-to-tr from-cyan-500 to-teal-300 rounded-full z-30 shadow-[0_0_15px_rgba(34,211,238,0.5)] border border-cyan-200 transition-shadow duration-300"
        >
          {/* Internal core shine detail element */}
          <span className="w-2 h-2 bg-white rounded-full absolute top-1.5 left-1.5 opacity-70"></span>
        </div>

        {/* Dynamic Procedural Obstacles Node Iteration */}
        {obstacles.map((obs) => (
          <div
            key={obs.id}
            style={{
              left: `${obs.left}%`,
              width: `${obs.width}%`,
              height: `${obs.height}%`,
              bottom: "12%", // Pins exactly to line up flush with the horizon track floor line element below
            }}
            className="absolute bg-gradient-to-b from-purple-600 to-indigo-800 border border-purple-400/50 rounded-t-lg shadow-lg z-20"
          />
        ))}

        {/* Level Track Horizon Floor Line Anchor Asset */}
        <div className="absolute bottom-0 left-0 right-0 h-[12%] bg-gradient-to-b from-slate-800 to-slate-900 border-t-2 border-indigo-500/40 z-10 flex items-center justify-center">
          <div className="w-full h-1 bg-indigo-500/10 animate-pulse"></div>
        </div>
      </div>

      {/* On-Screen Touch / Click Assist Button Overlay (Specifically tailored for mobile or mouse-heavy users) */}
      {gameState === "PLAYING" && (
        <button
          onClick={handleBounce}
          className="absolute bottom-10 px-12 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 active:from-purple-700 text-white rounded-2xl font-extrabold text-xl shadow-2xl active:scale-95 transition-all md:hidden border border-purple-400/30 z-40 tracking-wider"
        >
          BOUNCE!
        </button>
      )}
    </div>
  );
};

export default Bounce;