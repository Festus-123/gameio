type tileData = {
  image: string;
};

const Tiles = ({ image }: tileData) => {
  return (
    <div className="relative w-20 md:w-40 h-30 md:h-50 bg-blue-100 flex items-center justify-center text-2xl md:text-4xl">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,0,0.06))] bg-[length:100%_4px,3px_100%] z-10"></div>
      {image}
    </div>
  );
};

export default Tiles;
