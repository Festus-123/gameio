const TicTacToe = () => {
  return (
    <div className="w-full h-screen bg-zinc-300 flex items-center justify-center">
      {/* Playing field  */}
      <div className="w-full max-w-xl aspect-square p-6 bg-zinc-900 border-4 border-double border-orange-500 shadow-[8px_8px_0px_#ea580c] relative select-none font-mono">
        {/* Retro scanline overlay screen effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,0,0.06))] bg-[length:100%_4px,3px_100%] z-10"></div>

        {/* Tic Tac Toe Grid Canvas */}
        <div className="w-full h-full bg-zinc-950 border-2 border-dashed border-zinc-700 p-2 grid grid-cols-3 grid-rows-3 relative">
          {/* Sample Cell: Top-Left */}
          <div className="border-r-4 border-b-4 border-green-500/80 flex items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-colors group">
            {/* Example X player with classic 8-bit shadow box */}
            <span className="text-4xl md:text-5xl font-black text-yellow-400 drop-shadow-[3px_3px_0px_rgba(0,0,0,1)] animate-pulse">
              X
            </span>
          </div>

          {/* Sample Cell: Top-Middle */}
          <div className="border-r-4 border-b-4 border-green-500/80 flex items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-colors">
            {/* Example O player */}
            <span className="text-4xl md:text-5xl font-black text-orange-500 drop-shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              O
            </span>
          </div>

          {/* Sample Cell: Top-Right */}
          <div className="border-b-4 border-green-500/80 flex items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-colors">
            {/* Empty Cell */}
          </div>

          {/* Sample Cell: Center-Left */}
          <div className="border-r-4 border-b-4 border-green-500/80 flex items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-colors"></div>

          {/* Sample Cell: Center-Middle */}
          <div className="border-r-4 border-b-4 border-green-500/80 flex items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-colors"></div>

          {/* Sample Cell: Center-Right */}
          <div className="border-b-4 border-green-500/80 flex items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-colors"></div>

          {/* Sample Cell: Bottom-Left */}
          <div className="border-r-4 border-green-500/80 flex items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-colors"></div>

          {/* Sample Cell: Bottom-Middle */}
          <div className="border-r-4 border-green-500/80 flex items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-colors"></div>

          {/* Sample Cell: Bottom-Right */}
          <div className="flex items-center justify-center cursor-pointer hover:bg-zinc-900/50 transition-colors"></div>
        </div>
      </div>
    </div>
  );
};

export default TicTacToe;
