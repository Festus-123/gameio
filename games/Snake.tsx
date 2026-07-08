"use client";
import HomeControl from "@/components/home-control/HomeControl";
import ResetControl from "@/components/reset-control/ResetControl";
import { useState, useEffect, useRef } from "react";

type CORD = {
  top: number;
  left: number;
};

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT" | null;

const Snake = () => {
  const [ballCord, setBallCord] = useState<CORD>({ top: 30, left: 30 });
  const [score, setScore] = useState(0);
  const [snakeSegments, setSnakeSegments] = useState<CORD[]>([
    { top: 50, left: 50 }, // Head
    { top: 50, left: 52 }, // Body 1
    { top: 50, left: 54 }, // Body 2
    { top: 50, left: 56 }, // Body 3
  ]);

  const [direction, setDirection] = useState<Direction>(null);
  const [fail, setFail] = useState(false);
  const [pause, setPause] = useState(false);
  const [speed, setSpeed] = useState<number | null>(null); // Initialized to null to show difficulty selector first

  const directionRef = useRef<Direction>(null);

  const track_ball = () => {
    const randomTop = Math.floor(Math.random() * 44) * 2 + 6;
    const randomLeft = Math.floor(Math.random() * 44) * 2 + 6;
    setBallCord({ top: randomTop, left: randomLeft });
  };

  const restartGame = () => {
    setSnakeSegments([
      { top: 50, left: 50 },
      { top: 50, left: 51 },
      { top: 50, left: 52 },
      { top: 50, left: 53 },
    ]);
    setDirection(null);
    setFail(false);
    setPause(false);
    setSpeed(null); // Reset speed selection to bring back the difficulty overlay
    setScore(0);
    track_ball();
  };

  // Game loop handling slithering movement logic
  useEffect(() => {
    if (!direction || pause || fail || speed === null) return;
    directionRef.current = direction;

    const moveSnake = () => {
      setSnakeSegments((prevSegments) => {
        const newSegments = [...prevSegments];
        const head = { ...newSegments[0] };
        const STEP = 2;

        switch (directionRef.current) {
          case "UP":
            head.top -= STEP;
            break;
          case "DOWN":
            head.top += STEP;
            break;
          case "LEFT":
            head.left -= STEP;
            break;
          case "RIGHT":
            head.left += STEP;
            break;
        }

        // 1. Boundary Wall Collision Checks
        if (head.top < 0 || head.top > 98 || head.left < 0 || head.left > 98) {
          setFail(true);
          return prevSegments;
        }

        // 2. Self-Harm Collision Check
        const hitSelf = prevSegments.some(
          (segment, idx) =>
            idx !== 0 && segment.top === head.top && segment.left === head.left,
        );
        if (hitSelf) {
          setFail(true);
          return prevSegments;
        }

        newSegments.unshift(head);

        // 3. Check if head eats the food
        if (
          Math.abs(head.top - ballCord.top) < 2 &&
          Math.abs(head.left - ballCord.left) < 2
        ) {
          setScore((prev) => prev + 5);
          track_ball();
        } else {
          newSegments.pop();
        }

        return newSegments;
      });
    };

    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [direction, ballCord, pause, fail, speed]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (fail || speed === null) return;

      if (e.key === " ") {
        e.preventDefault();
        if (directionRef.current) setPause((prev) => !prev);
        return;
      }

      if (pause) return;

      switch (e.key) {
        case "ArrowUp":
          if (directionRef.current !== "DOWN") setDirection("UP");
          break;
        case "ArrowDown":
          if (directionRef.current !== "UP") setDirection("DOWN");
          break;
        case "ArrowLeft":
          if (directionRef.current !== "RIGHT") setDirection("LEFT");
          break;
        case "ArrowRight":
          if (directionRef.current !== "LEFT") setDirection("RIGHT");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pause, fail, speed]);

  return (
    <div className="relative w-full h-screen bg-yellow-400 flex items-center justify-center overflow-hidden relative select-none">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,0,0.06))] bg-[length:100%_4px,3px_100%] z-50"></div>

      {/* Real-time Live Score Display */}
      {speed !== null && (
        <div className="absolute top-5 left-5 text-shadow-lg text-white px-4 py-2 font-extrabold tracking-wider z-40 text-xl md:text-3xl">
          {score}
        </div>
      )}

      {/* Speed / Difficulty Selection Overlay */}
      {speed === null && !fail && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-11/12 border-4 border-black text-center animate-fade-in">
            <h2 className="text-2xl font-black text-black tracking-wide mb-2">
              🐍 SLITHER SNAKE
            </h2>
            <p className="text-gray-600 text-sm font-semibold mb-6">
              Select your game difficulty to begin:
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => setSpeed(100)}
                className="w-full bg-green-400 text-white font-bold py-3 px-6 rounded-xl border-b-4 border-green-700 active:scale-95 transition-transform uppercase tracking-wider"
              >
                🟢 Easy
              </button>
              <button
                onClick={() => setSpeed(80)}
                className="w-full bg-orange-400 text-white font-bold py-3 px-6 rounded-xl border-b-4 border-orange-700 active:scale-95 transition-transform uppercase tracking-wider"
              >
                🟡 Medium
              </button>
              <button
                onClick={() => setSpeed(40)}
                className="w-full bg-red-400 text-white font-bold py-3 px-6 rounded-xl border-b-4 border-red-700 active:scale-95 transition-transform uppercase tracking-wider"
              >
                🔴 Hard
              </button>
            </div>
          </div>
          <div className="absolute top-5 left-5 z-50">
            <HomeControl />
          </div>
        </div>
      )}

      {/* Active Play Mode Movement Instructions */}
      {speed !== null && !direction && !fail && (
        <div className="absolute top-20 text-center font-bold text-black text-base md:text-lg animate-bounce z-40">
          Press an Arrow Key or D-Pad to Slither! <br />
          <span className="text-xs opacity-75 font-semibold">
            Avoid boundaries & biting your tail
          </span>
        </div>
      )}

      {/* Pause/Play Controls */}
      {direction && !fail && (
        <button
          onClick={() => setPause(!pause)}
          className="absolute top-5 right-5 bg-black/40 text-white px-4 py-2 rounded-lg font-bold z-40 active:scale-95 text-xs md:text-sm"
        >
          {pause ? "▶ RESUME" : "⏸ PAUSE"}
        </button>
      )}

      {/* Pause Screen Overlay */}
      {pause && (
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center gap-4 z-50">
          <div
            onClick={() => setPause(!pause)}
            className="flex items-center gap-4"
          >
            <div className="w-6 h-16 bg-white border-2 rounded-sm"></div>
            <div className="w-6 h-16 bg-white border-2 rounded-sm"></div>
          </div>
          <p className="text-white font-bold tracking-widest text-xl">
            GAME PAUSED
          </p>
          <div className="flex items-center gap-4">
            <HomeControl />
            <ResetControl onclick={restartGame} />
          </div>
        </div>
      )}

      {/* Fail Overlay Screen */}
      {fail && (
        <div className="absolute inset-0 bg-red-600/90 flex flex-col gap-4 justify-center items-center z-50">
          <h1 className="text-white text-shadow-lg tracking-wider text-xl md:text-3xl p-2">
            SCORE: {score}{" "}
          </h1>
          <h1 className="text-6xl md:text-8xl">☹️</h1>
          <p className="text-white font-black text-2xl md:text-4xl tracking-wide">
            YOU FAILED
          </p>
          <p className="text-red-100 font-bold -mt-2">Final Score: {score}</p>
          {/* <button
            onClick={restartGame}
            className="mt-2 px-6 py-3 bg-white text-red-600 rounded-xl font-bold uppercase tracking-wider hover:bg-neutral-100 active:scale-95 shadow-2xl transition-transform"
          >
            Try Again
          </button> */}
          <div className="flex items-center gap-4">
            <HomeControl />
            <ResetControl onclick={restartGame} />
          </div>
        </div>
      )}

      {/* Snake Rendering */}
      {snakeSegments.map((segment, index) => (
        <div
          key={index}
          style={{
            top: `${segment.top}%`,
            left: `${segment.left}%`,
          }}
          className={`absolute w-5 h-5 bg-black z-30 transition-all duration-75 ease-linear
            ${index === 0 ? "rounded-full bg-neutral-900 z-40 flex items-center justify-center" : "rounded-md"}`}
        >
          {index === 0 && (
            <span className="bg-white w-1.5 h-1.5 rounded-full block animate-pulse"></span>
          )}
        </div>
      ))}

      {/* Snake Food */}
      <span
        style={{
          top: `${ballCord.top}%`,
          left: `${ballCord.left}%`,
        }}
        className="absolute rounded-full w-5 h-5 bg-red-500 z-20 shadow-md"
      ></span>

      {/* Mobile D-Pad Controls */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:hidden z-40 opacity-85">
        <button
          onClick={() =>
            !pause &&
            !fail &&
            speed !== null &&
            directionRef.current !== "DOWN" &&
            setDirection("UP")
          }
          className="w-14 h-14 bg-black/40 text-white rounded-xl flex items-center justify-center font-bold text-2xl active:scale-95 shadow-lg"
        >
          ▲
        </button>
        <div className="flex gap-14">
          <button
            onClick={() =>
              !pause &&
              !fail &&
              speed !== null &&
              directionRef.current !== "RIGHT" &&
              setDirection("LEFT")
            }
            className="w-14 h-14 bg-black/40 text-white rounded-xl flex items-center justify-center font-bold text-2xl active:scale-95 shadow-lg"
          >
            ◀
          </button>
          <button
            onClick={() =>
              !pause &&
              !fail &&
              speed !== null &&
              directionRef.current !== "LEFT" &&
              setDirection("RIGHT")
            }
            className="w-14 h-14 bg-black/40 text-white rounded-xl flex items-center justify-center font-bold text-2xl active:scale-95 shadow-lg"
          >
            ▶
          </button>
        </div>
        <button
          onClick={() =>
            !pause &&
            !fail &&
            speed !== null &&
            directionRef.current !== "UP" &&
            setDirection("DOWN")
          }
          className="w-14 h-14 bg-black/40 text-white rounded-xl flex items-center justify-center font-bold text-2xl active:scale-95 shadow-lg"
        >
          ▼
        </button>
      </div>
    </div>
  );
};

export default Snake;
