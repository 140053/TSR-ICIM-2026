interface HexagonTileProps {
  title: string;
  image: string;
  onClick?: () => void;
}

export function HexagonTile({ title, image, onClick }: HexagonTileProps) {
  return (
    <button
      onClick={onClick}
      className="hexagon-wrapper group relative cursor-pointer transition-all duration-300 hover:scale-105"
      style={{
        width: '180px',
        height: '208px',
      }}
    >
      <div
        className="hexagon absolute inset-0 overflow-hidden"
        style={{
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }}
      >
        {/* Image background */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110 shadow-2xl shadow-gray-600"
          style={{
            backgroundImage: `url(${image})`,
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-black/30 to-black/60 transition-opacity duration-300 group-hover:from-black/40 group-hover:to-black/70" />
        
        {/* Title */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <h3 className="text-white text-center text-xl font-semibold tracking-wide drop-shadow-lg">
            {title}
          </h3>
        </div>
      </div>
    </button>
  );
}
