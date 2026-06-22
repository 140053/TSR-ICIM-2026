export default function Loading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        pointerEvents: 'none', // let clicks pass through once curtain has parted
      }}
    >
      <style>{`
        @keyframes partLeft {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes partRight {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeOutCenter {
          0%   { opacity: 1; }
          60%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes bobUpDown {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes pulseText {
          0%, 100% { opacity: 0.5; }
          50%      { opacity: 1; }
        }

        .curtain-left, .curtain-right {
          position: absolute;
          top: 0;
          width: 55%;
          height: 100%;
          background: linear-gradient(to bottom, #aee3f7 0%, #d9f0fb 50%, #f3faff 100%);
          animation-fill-mode: forwards;
          animation-timing-function: cubic-bezier(0.65, 0, 0.35, 1);
        }
        .curtain-left {
          left: 0;
          animation: partLeft 1.4s 0.3s forwards;
        }
        .curtain-right {
          right: 0;
          animation: partRight 1.4s 0.3s forwards;
        }
      `}</style>

      {/* Left curtain panel */}
      <div className="curtain-left">
        <CloudShape top="10%" left="10%" scale={1.3} opacity={0.9} />
        <CloudShape top="55%" left="40%" scale={1.5} opacity={0.85} />
        <CloudShape top="30%" left="65%" scale={1.1} opacity={0.8} />
      </div>

      {/* Right curtain panel */}
      <div className="curtain-right">
        <CloudShape top="15%" left="20%" scale={1.4} opacity={0.85} />
        <CloudShape top="60%" left="50%" scale={1.2} opacity={0.9} />
        <CloudShape top="35%" left="5%" scale={1.5} opacity={0.8} />
      </div>

      {/* Center loading indicator, fades out as curtain opens */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          animation: 'fadeOutCenter 1.2s ease forwards',
        }}
      >
        <div style={{ animation: 'bobUpDown 1.2s ease-in-out infinite' }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <path
              d="M18 38 a10 10 0 0 1 0 -20 a14 14 0 0 1 27 -4 a11 11 0 0 1 1 21 z"
              fill="#ffffff"
              stroke="#bcdff0"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <span
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#5b86a3',
            textTransform: 'uppercase',
            animation: 'pulseText 1s ease-in-out infinite',
          }}
        >
          Loading
        </span>
      </div>
    </div>
  );
}

function CloudShape({
  top,
  left = '0%',
  scale = 1,
  opacity = 1,
}: {
  top: string;
  left?: string;
  scale?: number;
  opacity?: number;
}) {
  return (
    <svg
      width="220"
      height="120"
      viewBox="0 0 220 120"
      style={{
        position: 'absolute',
        top,
        left,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <path
        d="M40 90
           C10 90 0 65 22 55
           C15 30 50 15 70 30
           C85 5 130 5 140 32
           C170 25 195 50 175 70
           C190 80 180 95 160 92
           Z"
        fill="#ffffff"
      />
    </svg>
  );
}