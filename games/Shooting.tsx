"use client";

import HomeControl from "@/components/home-control/HomeControl";
import ResetControl from "@/components/reset-control/ResetControl";
import { useEffect, useRef, useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";

type PowerUpType = "TRIPLE_SHOT" | "SHIELD" | "GIANT_SHOT";

export default function Shooting() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState<number>(0);
  const [gameState, setGameState] = useState<
    "START" | "PLAYING" | "FAILED" | "WON"
  >("START");
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">(
    "EASY",
  );

  // Power-up visual timer displays (for HUD feedback)
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [powerUpTimeLeft, setPowerUpTimeLeft] = useState<number>(0);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const touchStartX = useRef<number | null>(null);

  const difficultyConfigs = {
    EASY: { obstacleSpeedBase: 1.5, spawnRate: 35, obstacleMaxRadius: 18 },
    MEDIUM: { obstacleSpeedBase: 3.0, spawnRate: 22, obstacleMaxRadius: 24 },
    HARD: { obstacleSpeedBase: 5.0, spawnRate: 14, obstacleMaxRadius: 32 },
  };

  const gameEngine = useRef({
    player: { x: 0, y: 0, width: 45, height: 45, speed: 8 },
    lasers: [] as Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      speed: number;
      damageType?: "GIANT";
    }>,
    obstacles: [] as Array<{
      x: number;
      y: number;
      radius: number;
      speed: number;
    }>,
    gifts: [] as Array<{
      x: number;
      y: number;
      radius: number;
      speed: number;
      type: PowerUpType;
    }>,
    laserTimer: 0,
    obstacleSpawnTimer: 0,
    giftSpawnTimer: 0,
    canvasWidth: 400,
    canvasHeight: 500,
    winSequenceY: 0,
    // Power-up management frame counters (7 seconds @ 60fps = ~420 frames)
    powerUpTimers: { TRIPLE_SHOT: 0, SHIELD: 0, GIANT_SHOT: 0 },
  });

  const updateCanvasDimensions = () => {
    if (containerRef.current && canvasRef.current) {
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      canvasRef.current.width = w;
      canvasRef.current.height = h;
      gameEngine.current.canvasWidth = w;
      gameEngine.current.canvasHeight = h;
    }
  };

  const startGame = () => {
    updateCanvasDimensions();
    const engine = gameEngine.current;

    engine.player.width = Math.max(35, engine.canvasWidth * 0.08);
    engine.player.height = engine.player.width;
    engine.player.speed = Math.max(6, engine.canvasWidth * 0.015);

    engine.player.x = engine.canvasWidth / 2 - engine.player.width / 2;
    engine.player.y = engine.canvasHeight - engine.player.height - 30;
    engine.lasers = [];
    engine.obstacles = [];
    engine.gifts = [];
    engine.laserTimer = 0;
    engine.obstacleSpawnTimer = 0;
    engine.giftSpawnTimer = 0;
    engine.winSequenceY = engine.player.y;
    engine.powerUpTimers = { TRIPLE_SHOT: 0, SHIELD: 0, GIANT_SHOT: 0 };

    setScore(0);
    setIsPaused(false);
    setActivePowerUp(null);
    setPowerUpTimeLeft(0);
    setGameState("PLAYING");
  };

  // Keyboard hooks integrating absolute Spacebar checks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault(); // Stop window from scrolling down
        if (gameState === "PLAYING") {
          setIsPaused((prev) => !prev);
        }
      } else {
        keysPressed.current[e.key] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key !== " " && e.code !== "Space") {
        keysPressed.current[e.key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", updateCanvasDimensions);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", updateCanvasDimensions);
    };
  }, [gameState]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== "PLAYING" || isPaused) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameState !== "PLAYING" || isPaused || touchStartX.current === null)
      return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - touchStartX.current;
    const engine = gameEngine.current;
    engine.player.x = Math.max(
      0,
      Math.min(
        engine.canvasWidth - engine.player.width,
        engine.player.x + diffX * 1.3,
      ),
    );
    touchStartX.current = currentX;
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  // Main 60FPS Game Execution loop
  useEffect(() => {
    if (gameState === "START" || gameState === "FAILED") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const engine = gameEngine.current;
    const config = difficultyConfigs[difficulty];

    const gameLoop = () => {
      if (isPaused && gameState === "PLAYING") {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      const isWinSequenceActive = score >= 3000;

      // Decrement and synchronize UI power-up tickers
      let currentActiveType: PowerUpType | null = null;
      let maximalFramesRemaining = 0;

      Object.entries(engine.powerUpTimers).forEach(([type, frames]) => {
        if (frames > 0) {
          engine.powerUpTimers[type as PowerUpType]--;
          if (frames > maximalFramesRemaining) {
            maximalFramesRemaining = frames;
            currentActiveType = type as PowerUpType;
          }
        }
      });

      // Update React components states efficiently every few intervals
      if (engine.laserTimer % 3 === 0) {
        setActivePowerUp(currentActiveType);
        setPowerUpTimeLeft(Math.ceil(maximalFramesRemaining / 60));
      }

      const isTripleActive = engine.powerUpTimers.TRIPLE_SHOT > 0;
      const isShieldActive = engine.powerUpTimers.SHIELD > 0;
      const isGiantActive = engine.powerUpTimers.GIANT_SHOT > 0;

      // 1. COMPUTE TRANSLATIONS
      if (gameState === "PLAYING" && !isWinSequenceActive) {
        if (
          keysPressed.current["ArrowLeft"] ||
          keysPressed.current["a"] ||
          keysPressed.current["A"]
        ) {
          engine.player.x = Math.max(0, engine.player.x - engine.player.speed);
        }
        if (
          keysPressed.current["ArrowRight"] ||
          keysPressed.current["d"] ||
          keysPressed.current["D"]
        ) {
          engine.player.x = Math.min(
            engine.canvasWidth - engine.player.width,
            engine.player.x + engine.player.speed,
          );
        }

        // Maglev Rapid Laser Configuration Engine (Fires every 6 frames instead of 10)
        engine.laserTimer++;
        if (engine.laserTimer >= 6) {
          const lWidth = isGiantActive ? 24 : 4;
          const lHeight = isGiantActive ? 32 : 16;
          const lSpeed = isGiantActive ? 16 : 12;

          // Main Central Laser Core
          engine.lasers.push({
            x: engine.player.x + engine.player.width / 2 - lWidth / 2,
            y: engine.player.y,
            width: lWidth,
            height: lHeight,
            speed: lSpeed,
            damageType: isGiantActive ? "GIANT" : undefined,
          });

          // Weapon Arm Lasers (Activated by Triple Shot gift)
          if (isTripleActive) {
            engine.lasers.push({
              x: engine.player.x - lWidth / 2, // Left wing tips
              y: engine.player.y + engine.player.height * 0.5,
              width: lWidth,
              height: lHeight,
              speed: lSpeed,
            });
            engine.lasers.push({
              x: engine.player.x + engine.player.width - lWidth / 2, // Right wing tips
              y: engine.player.y + engine.player.height * 0.5,
              width: lWidth,
              height: lHeight,
              speed: lSpeed,
            });
          }
          engine.laserTimer = 0;
        }

        // Spawn falling debris obstacles
        engine.obstacleSpawnTimer++;
        if (engine.obstacleSpawnTimer >= config.spawnRate) {
          const radius =
            Math.floor(Math.random() * (config.obstacleMaxRadius - 10)) + 10;
          engine.obstacles.push({
            x: Math.random() * (engine.canvasWidth - radius * 2) + radius,
            y: -radius,
            radius: radius,
            speed: Math.random() * 2 + config.obstacleSpeedBase,
          });
          engine.obstacleSpawnTimer = 0;
        }

        // Spawn Gift Modules (Every ~350 frames randomly rolling types)
        engine.giftSpawnTimer++;
        if (engine.giftSpawnTimer >= 350) {
          const types: PowerUpType[] = ["TRIPLE_SHOT", "SHIELD", "GIANT_SHOT"];
          const selectedType = types[Math.floor(Math.random() * types.length)];
          engine.gifts.push({
            x: Math.random() * (engine.canvasWidth - 40) + 20,
            y: -20,
            radius: 14,
            speed: 2.2,
            type: selectedType,
          });
          engine.giftSpawnTimer = 0;
        }
      }

      // Physics vector mapping processing shifts
      engine.lasers = engine.lasers.filter((l) => {
        l.y -= l.speed;
        return l.y > 0;
      });

      engine.gifts = engine.gifts.filter((g) => {
        g.y += g.speed;
        return g.y < engine.canvasHeight + g.radius;
      });

      if (!isWinSequenceActive) {
        engine.obstacles = engine.obstacles.filter((o) => {
          o.y += o.speed;
          return o.y < engine.canvasHeight + o.radius;
        });
      } else {
        engine.obstacles = engine.obstacles.filter((o) => {
          o.y += 8;
          return o.y < engine.canvasHeight + o.radius;
        });
        engine.winSequenceY -= 5;
        if (engine.winSequenceY < -engine.player.height) {
          setGameState("WON");
          return;
        }
      }

      // 2. RUN REAL-TIME COLLISION DETECTIONS
      let crashDetected = false;

      if (!isWinSequenceActive) {
        // Laser vs Obstacle Check
        engine.obstacles.forEach((obs, obsIdx) => {
          engine.lasers.forEach((laser, laserIdx) => {
            if (
              laser.x > obs.x - obs.radius &&
              laser.x < obs.x + obs.radius &&
              laser.y > obs.y - obs.radius &&
              laser.y < obs.y + obs.radius
            ) {
              engine.obstacles.splice(obsIdx, 1);
              engine.lasers.splice(laserIdx, 1);
              setScore((prev) => Math.min(3000, prev + 5));
            }
          });

          // Player vs Obstacle Proximity check
          const closestX = Math.max(
            engine.player.x,
            Math.min(obs.x, engine.player.x + engine.player.width),
          );
          const closestY = Math.max(
            engine.player.y,
            Math.min(obs.y, engine.player.y + engine.player.height),
          );
          const distSq = (obs.x - closestX) ** 2 + (obs.y - closestY) ** 2;

          if (distSq < obs.radius * obs.radius) {
            if (isShieldActive) {
              // Destroy obstacle silently without blowing up the engine ship!
              engine.obstacles.splice(obsIdx, 1);
              setScore((prev) => Math.min(3000, prev + 2));
            } else {
              crashDetected = true;
            }
          }
        });

        // Player vs Gift Collectible Interaction Mapping
        engine.gifts.forEach((gift, giftIdx) => {
          const closestX = Math.max(
            engine.player.x,
            Math.min(gift.x, engine.player.x + engine.player.width),
          );
          const closestY = Math.max(
            engine.player.y,
            Math.min(gift.y, engine.player.y + engine.player.height),
          );
          const distSq = (gift.x - closestX) ** 2 + (gift.y - closestY) ** 2;

          if (distSq < gift.radius * gift.radius) {
            // Apply 7 Seconds duration state (420 physics calculation cycle ticks)
            engine.powerUpTimers[gift.type] = 420;
            engine.gifts.splice(giftIdx, 1);
          }
        });
      }

      if (crashDetected && gameState === "PLAYING") {
        setGameState("FAILED");
        return;
      }

      // 3. CANVAS GRAPHICS BUFFER CLEANUP AND RENDERING
      ctx.clearRect(0, 0, engine.canvasWidth, engine.canvasHeight);

      // Draw Lasers
      ctx.fillStyle = isGiantActive
        ? "#ec4899"
        : isTripleActive
          ? "#a855f7"
          : "#00ffff";
      engine.lasers.forEach((l) => ctx.fillRect(l.x, l.y, l.width, l.height));

      // Draw Gifts Items Capsules
      engine.gifts.forEach((g) => {
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#fff";
        ctx.stroke();
        ctx.closePath();

        // Symbol letters inside gift shells
        ctx.fillStyle = "#000";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const sym =
          g.type === "TRIPLE_SHOT" ? "3" : g.type === "SHIELD" ? "S" : "G";
        ctx.fillText(sym, g.x, g.y);
      });

      // Draw Obstacles
      engine.obstacles.forEach((obs) => {
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#450a0a";
        ctx.stroke();
        ctx.closePath();
      });

      const currentChassisY = isWinSequenceActive
        ? engine.winSequenceY
        : engine.player.y;

      // Draw Force Field Protective Deflector Shield Ring
      if (isShieldActive) {
        ctx.beginPath();
        ctx.arc(
          engine.player.x + engine.player.width / 2,
          currentChassisY + engine.player.height / 2,
          engine.player.width,
          0,
          Math.PI * 2,
        );
        ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.closePath();
      }

      // Draw Player Jet Structure
      ctx.fillStyle = isWinSequenceActive ? "#38bdf8" : "#22c55e";
      ctx.beginPath();
      ctx.moveTo(engine.player.x + engine.player.width / 2, currentChassisY);
      ctx.lineTo(engine.player.x, currentChassisY + engine.player.height);
      ctx.lineTo(
        engine.player.x + engine.player.width,
        currentChassisY + engine.player.height,
      );
      ctx.fill();
      ctx.closePath();

      // Wing Thruster fire dynamics
      ctx.fillStyle = Math.random() > 0.5 ? "#f97316" : "#eab308";
      ctx.fillRect(
        engine.player.x + engine.player.width * 0.2,
        currentChassisY + engine.player.height,
        engine.player.width * 0.15,
        8,
      );
      ctx.fillRect(
        engine.player.x + engine.player.width * 0.65,
        currentChassisY + engine.player.height,
        engine.player.width * 0.15,
        8,
      );

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, isPaused, difficulty, score]);

  return (
    <div className="relative w-full h-screen bg-zinc-900 flex flex-col items-center justify-center font-mono select-none overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,0,0.06))] bg-[length:100%_4px,3px_100%] z-20"></div>

      {/* Retro HUD Board Panel */}
      <div className="absolute top-5  w-full max-w-sm flex flex-col gap-2 mb-4 z-20 text-white bg-black border-2 border-orange-500 p-3 shadow-[4px_4px_0px_#ea580c]">
        <div className="flex justify-between items-center">
          <div className="text-xs uppercase tracking-wider">
            SCORE:{" "}
            <span className="text-sm font-black text-yellow-400">
              {score}/3000
            </span>
          </div>


          <div className="text-xs uppercase tracking-wider font-bold text-orange-500">
            {difficulty}
          </div>
        </div>

        {/* Real-time Dynamic Powerup Warning Banner subheader row */}
        {activePowerUp && (
          <div className="text-center bg-zinc-950 border border-sky-500/30 text-[10px] py-0.5 text-sky-400 tracking-wider uppercase font-bold animate-pulse">
            ⚡ {activePowerUp.replace("_", " ")} ACTIVE: {powerUpTimeLeft}s LEFT
          </div>
        )}
      </div>

      {/* Canvas Viewport Box Container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative z-20 overflow-hidden w-full  aspect-4/5"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Start Game Overlay */}
        {gameState === "START" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
            <h2 className="text-3xl md:text-6xl font-black text-orange-500 tracking-tighter mb-1 animate-pulse">
              🌌 GALAXY STRIKER
            </h2>
            <p className="text-lg uppercase text-zinc-400 tracking-widest mb-4">
              Hit 3000 points to trigger atmospheric extraction <br />
              Collect capsules go supper
            </p>

            <div className="flex p-3 gap-2 mb-6 bg-zinc-900 p-1 border border-zinc-700">
              {(["EASY", "MEDIUM", "HARD"] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setDifficulty(tier)}
                  className={`px-3 py-1 text-base font-black tracking-wider uppercase transition-colors ${
                    difficulty === tier
                      ? "bg-orange-500 text-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            <button
              onClick={startGame}
              className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black border-b-4 border-green-800 active:border-b-0 font-bold uppercase tracking-wider transition-all"
            >
              Launch Jet
            </button>

            <div
                className="absolute top-5 left-5">
                <HomeControl />
            </div>
          </div>
        )}

        {/* Game Paused Overlay */}
        {isPaused && gameState === "PLAYING" && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-6 z-40">
            <h3 className="text-orange-500 font-black text-2xl md:text-4xl tracking-widest uppercase border-2 border-orange-500 bg-zinc-900 px-4 py-2 shadow-[4px_4px_0px_#000] animate-pulse">
              TACTICAL PAUSE
            </h3>
            <p className="text-[10px] text-zinc-400 uppercase mt-2 tracking-widest">
              Press Spacebar or click Resume to continue
            </p>
            <div className="flex items-center gap-4 mt-6">
              <HomeControl />
              <ResetControl onclick={startGame} />
          {gameState === "PLAYING" && (
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="rounded-full border-2 border-white p-4 text-2xl md:text-4xl text-white active:scale-95 transition-transform"
            >
                 <FaPause /> 
            </button>
          )} 
            </div>
          </div>
        )}

        {/* Failed Screen */}
        {gameState === "FAILED" && (
          <div className="absolute inset-0 bg-black/80 flex flex-col gap-2 items-center justify-center p-6 text-center text-white">
            <h2 className="text-red-500 font-black text-2xl md:text-4xl tracking-tighter uppercase mb-2">
              💥 JET DESTROYED
            </h2>
            <div className="bg-black/60 px-4 py-2 border border-zinc-800 text-lg text-zinc-400 uppercase tracking-wide mb-6">
              Final Score:{" "}
              <span className="text-white font-bold">{score} PTS</span>
            </div>
            <div className="flex items-center gap-4">
              <HomeControl />
              <ResetControl onclick={startGame} />
            </div>
          </div>
        )}

        {/* Victory Screen */}
        {gameState === "WON" && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center text-white">
            <h2 className="text-sky-400 font-black text-3xl md:text-6xl tracking-tighter uppercase mb-2 animate-bounce">
              🌟 MISSION ACCOMPLISHED
            </h2>
            <p className="text-lg text-zinc-400  tracking-widest max-w-xs mb-6">
              Atmosphere successfully cleared of all 3,000 threats. Outstanding
              piloting!
            </p>
            <button
              onClick={() => setGameState("START")}
              className="px-6 py-2 bg-sky-500 hover:bg-sky-400 text-black border-b-4 border-sky-800 active:border-b-0 font-bold uppercase tracking-wider transition-all"
            >
              Return to Base
            </button>
          </div>
        )}
      </div>

      {gameState === "PLAYING" && (
        <p className="mt-4 text-[9px] text-zinc-500 tracking-widest uppercase md:hidden z-20 animate-pulse">
          ← Swipe screen left or right to pilot ship →
        </p>
      )}
    </div>
  );
}
