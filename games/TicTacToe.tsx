"use client";

import HomeControl from "@/components/home-control/HomeControl";
import ResetControl from "@/components/reset-control/ResetControl";
import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";

type FIELDS = {
  field: string;
};

const TicTacToe = () => {
  const [select, setSelect] = useState<"😎" | "🤔" | null>(null);
  const [turn, setTurn] = useState<"PLAYER" | "COMPUTER">("PLAYER");
  const [winner, setWinner] = useState<string | null>(null);
  const [options, setOptions] = useState(false);

  const [scores, setScores] = useState({
    player: 0,
    computer: 0,
  });

  const [fields, setFields] = useState<FIELDS[]>([
    { field: "" },
    { field: "" },
    { field: "" },
    { field: "" },
    { field: "" },
    { field: "" },
    { field: "" },
    { field: "" },
    { field: "" },
  ]);

  const winTerms = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  // Helper function to check if a winner exists based on current fields
  const checkWinner = (currentFields: FIELDS[]) => {
    for (const term of winTerms) {
      const [a, b, c] = term;
      if (
        currentFields[a].field &&
        currentFields[a].field === currentFields[b].field &&
        currentFields[a].field === currentFields[c].field
      ) {
        return currentFields[a].field;
      }
    }
    return null;
  };

  const play = (index: number) => {
    // Block moves if it's not the player's turn, field is filled, or game is won
    if (turn !== "PLAYER" || fields[index].field !== "" || winner) return;

    const currentEmoji = select === null || select === "🤔" ? "😎" : "🤔";

    const updatedFields = [...fields];
    updatedFields[index] = { field: currentEmoji };

    setFields(updatedFields);
    setSelect(currentEmoji);

    const gameWinner = checkWinner(updatedFields);
    if (gameWinner) {
      setWinner(gameWinner);
      setScores((prevScores) => ({
        ...prevScores,
        player: prevScores.player + (gameWinner === "😎" ? 1 : 0),
        computer: prevScores.computer + (gameWinner === "🤔" ? 1 : 0),
      }));
    } else if (updatedFields.every((f) => f.field !== "")) {
      setWinner("DRAW");
    } else {
      setTurn("COMPUTER");
    }
  };

  const computerPlay = () => {
    if (winner) return;

    // 1. Gather all empty box indices remaining on the board
    const emptyIndices: number[] = [];
    fields.forEach((item, index) => {
      if (item.field === "") emptyIndices.push(index);
    });

    // If no spaces left, break out
    if (emptyIndices.length === 0) return;

    // 2. Pick a random index guaranteed to be vacant
    const random = Math.floor(Math.random() * emptyIndices.length);
    const randomIndex = emptyIndices[random];
    const currentEmoji = select === "😎" ? "🤔" : "😎";

    const updatedFields = [...fields];
    updatedFields[randomIndex] = { field: currentEmoji };

    setFields(updatedFields);
    setSelect(currentEmoji);

    const gameWinner = checkWinner(updatedFields);
    if (gameWinner) {
      setWinner(gameWinner);
      setScores((prevScores) => ({
        ...prevScores,
        player: prevScores.player + (gameWinner === "😎" ? 1 : 0),
        computer: prevScores.computer + (gameWinner === "🤔" ? 1 : 0),
      }));
    } else if (updatedFields.every((f) => f.field !== "")) {
      setWinner("DRAW");
    } else {
      setTurn("PLAYER");
    }
  };

  // Trigger the computer move safely on turn state changes
  useEffect(() => {
    if (turn === "COMPUTER" && !winner) {
      // Small timeout adds realism so the computer doesn't move instantly
      const timer = setTimeout(() => {
        computerPlay();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [turn, winner, fields]);

  const resetGame = () => {
    setFields([
      { field: "" },
      { field: "" },
      { field: "" },
      { field: "" },
      { field: "" },
      { field: "" },
      { field: "" },
      { field: "" },
      { field: "" },
    ]);
    setSelect(null);
    setWinner(null);
    setOptions(false);
    setTurn("PLAYER");
  };

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center p-4 font-mono select-none">
      {/* Scanline CRT overlay effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,0,0.06))] bg-[length:100%_4px,3px_100%] z-20"></div>

      {/* Turn Indicator Banner */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="bg-black border-2 border-orange-500 text-white px-4 py-3 text-xs uppercase tracking-widest shadow-[4px_4px_0px_#ea580c] z-20">
          <span>Player:{scores.player}</span>
          <span className="ml-10">Computer:{scores.computer}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-black border-2 border-orange-500 text-white px-4 py-3 text-xs uppercase tracking-widest shadow-[4px_4px_0px_#ea580c] z-20">
            <span>Turn: {turn}</span>
          </div>
        </div>
      </div>
          <button
            onClick={() => setOptions(true)}
            className="absolute bottom-5 right-5  text-2xl md:text-3xl  p-3 cursor-pointer"
          >
            <FiSettings />
          </button>

      {/* Tic Tac Toe Grid Container with Retro Arcade Finish */}
      <div className="grid grid-cols-3 h-full w-full text-white">
        {fields.map((item, index) => (
          <div
            key={index}
            onClick={() => play(index)}
            className={`flex items-center justify-center cursor-pointer text-4xl border-blue-500/80 transition-colors hover:bg-zinc-900/50
                ${index % 3 !== 2 ? "border-r-4" : ""} 
                ${index < 6 ? "border-b-4" : ""}
              `}
          >
            <span className="drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              {item.field}
            </span>
          </div>
        ))}
      </div>

      {options && (
        <div className="absolute inset-0 bg-black/80 z-40 flex items-center justify-center">
          <div className="flex items-center gap-4 ">
            <HomeControl />
            <ResetControl onclick={resetGame} />
            <button
              onClick={() => setOptions(false)}
              className="rounded-full text-white border-2 border-white text-2xl md:text-4xl p-4"
            >
              <FaArrowLeft />
            </button>
          </div>
        </div>
      )}

      {winner && (
        <div className="absolute bg-black/80 z-40 inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <h1 className="flex flex-col gap-4 text-4xl md:text-8xl text-white items-center">
              { winner !== "DRAW" && (
              <div
                className="flex flex-col gap-4">
              <span>🍾🎉🎊</span>
              <span>Winner</span>
              </div>
              )}
              <span>{winner}</span>
            </h1>
            <button
              onClick={resetGame}
              className="mt-6 z-20 bg-orange-500 text-white px-6 py-2 border-2 border-black font-black uppercase tracking-wider text-sm active:translate-y-0.5 shadow-[4px_4px_0px_#000]"
            >
              Reset Match
            </button>
            <div className="absolute top-5 left-5 ">
              <HomeControl />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicTacToe;
