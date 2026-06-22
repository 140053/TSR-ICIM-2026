export default function Loading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: '#ffffff',
      }}
    >
      <style>{`
        @keyframes moveAwayLeft {
          0%   { transform: translate(-50%, -50%) scale(1.6); }
          100% { transform: translate(-145%, -50%) scale(1.3); }
        }
        @keyframes moveAwayRight {
          0%   { transform: translate(-50%, -50%) scale(1.6); }
          100% { transform: translate(45%, -50%) scale(1.3); }
        }
        @keyframes fadeOutSmoke {
          0%   { opacity: 1; }
          70%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes fadeOutCenter {
          0%   { opacity: 1; }
          50%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes bobUpDown {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes pulseText {
          0%, 100% { opacity: 0.45; }
          50%      { opacity: 1; }
        }
        @keyframes puffBreathe1 {
          0%, 100% { transform: scale(1) translate(0,0); }
          50%      { transform: scale(1.05) translate(3px, -4px); }
        }
        @keyframes puffBreathe2 {
          0%, 100% { transform: scale(1) translate(0,0); }
          50%      { transform: scale(0.96) translate(-4px, 3px); }
        }
        @keyframes puffBreathe3 {
          0%, 100% { transform: scale(1) translate(0,0); }
          50%      { transform: scale(1.04) translate(2px, 4px); }
        }

        .puff-a { animation: puffBreathe1 4.2s ease-in-out infinite; transform-origin: center; }
        .puff-b { animation: puffBreathe2 5s ease-in-out infinite; transform-origin: center; }
        .puff-c { animation: puffBreathe3 3.6s ease-in-out infinite; transform-origin: center; }

        .smoke-patch {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100vw;
          height: 100vh;
          min-width: 900px;
          min-height: 900px;
          animation-fill-mode: forwards;
          animation-timing-function: cubic-bezier(0.45, 0, 0.4, 1);
        }
        .smoke-patch-left {
          animation: moveAwayLeft 1.7s 0.2s forwards, fadeOutSmoke 1.7s 0.2s forwards;
        }
        .smoke-patch-right {
          animation: moveAwayRight 1.7s 0.2s forwards, fadeOutSmoke 1.7s 0.2s forwards;
        }
      `}</style>

      {/* Left smoke mass */}
      <div className="smoke-patch smoke-patch-left">
        <SmokeMass flip={false} />
      </div>

      {/* Right smoke mass */}
      <div className="smoke-patch smoke-patch-right">
        <SmokeMass flip={true} />
      </div>

      {/* Center loading indicator */}
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
          animation: 'fadeOutCenter 1.0s ease forwards',
        }}
      >
        <div style={{ animation: 'bobUpDown 1.2s ease-in-out infinite' }}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <circle cx="20" cy="34" r="13" fill="#bdbdbd" />
            <circle cx="34" cy="22" r="16" fill="#a8a8a8" />
            <circle cx="44" cy="34" r="11" fill="#bdbdbd" />
          </svg>
        </div>
        <span
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#7a7a7a',
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

/**
 * Flat vector cartoon smoke — solid fills, no blur/gradient.
 * Built in two layers per cluster:
 *  - SHADOW circles (darker grey, offset down-right) sit behind/below
 *  - BASE circles (lighter grey) sit on top, slightly offset up-left
 * This light-on-top / dark-underneath layering is what creates the
 * puffy "billowing cartoon smoke" look from the reference image.
 */
function SmokeMass({ flip }: { flip: boolean }) {
  const BASE = '#b8b8b8';
  const SHADOW = '#8c8c8c';

  return (
    <svg
      viewBox="0 0 400 400"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
    >
      {/* ---- Cluster 1 (top) ---- */}
      <g className="puff-a" style={{ transformBox: 'fill-box' }}>
        <circle cx="255" cy="95" r="70" fill={SHADOW} />
        <circle cx="225" cy="70" r="62" fill={BASE} />
        <circle cx="300" cy="60" r="55" fill={BASE} />
        <circle cx="190" cy="110" r="48" fill={BASE} />
      </g>

      {/* ---- Cluster 2 (middle) ---- */}
      <g className="puff-b" style={{ transformBox: 'fill-box' }}>
        <circle cx="300" cy="220" r="68" fill={SHADOW} />
        <circle cx="255" cy="200" r="58" fill={BASE} />
        <circle cx="335" cy="190" r="50" fill={BASE} />
        <circle cx="220" cy="235" r="44" fill={BASE} />
      </g>

      {/* ---- Cluster 3 (bottom, anchors the mass) ---- */}
      <g className="puff-c" style={{ transformBox: 'fill-box' }}>
        <circle cx="330" cy="330" r="72" fill={SHADOW} />
        <circle cx="280" cy="310" r="60" fill={BASE} />
        <circle cx="370" cy="300" r="52" fill={BASE} />
        <circle cx="220" cy="340" r="50" fill={BASE} />
        <circle cx="150" cy="360" r="42" fill={BASE} />
      </g>

      {/* Solid fill connecting the bottom of all clusters so there's no gap to the screen edge */}
      <rect x="0" y="340" width="400" height="60" fill={BASE} />
    </svg>
  );
}