import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR SCHEMES
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS = {
  figaro: {
    fur: '#2D2D2D',
    furLight: '#4A4A4A',
    furDark: '#1A1A1A',
    innerEar: '#FFB0B0',
    nose: '#FF8A8A',
    eyeWhite: '#FFFFFF',
    iris: '#FFD700',
    pupil: '#1A1A1A',
    eyeHighlight: '#FFF8DC',
    whisker: '#666666',
    collar: '#C62828',
    collarAccent: '#FFD700',
    mouth: '#FF6B6B',
    tongue: '#FF8A8A',
    blush: 'rgba(255, 107, 107, 0.15)',
    shadow: 'rgba(0,0,0,0.2)',
    glow: 'rgba(198,40,40,0.3)',
  },
  chilitit: {
    fur: '#8B8B8B',
    furLight: '#A0A0A0',
    furDark: '#6B6B6B',
    innerEar: '#D4D4D4',
    nose: '#B0B0B0',
    eyeWhite: '#F5F5F5',
    iris: '#9CA3AF',
    pupil: '#374151',
    eyeHighlight: '#E5E7EB',
    whisker: '#999999',
    collar: '#6B7280',
    collarAccent: '#D1D5DB',
    mouth: '#9CA3AF',
    tongue: '#B0B0B0',
    blush: 'rgba(156, 163, 175, 0.12)',
    shadow: 'rgba(0,0,0,0.15)',
    glow: 'rgba(107,114,128,0.3)',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SVG DIMENSIONS (viewBox 0 0 200 200)
// ═══════════════════════════════════════════════════════════════════════════════

const CX = 100; // center X
const CY = 100; // center Y
const HEAD_R = 55; // head radius

// ═══════════════════════════════════════════════════════════════════════════════
// BLINK ANIMATION (CSS keyframes)
// ═══════════════════════════════════════════════════════════════════════════════

const blinkKeyframes = `
@keyframes cat-blink {
  0%, 96%, 100% { transform: scaleY(1); }
  97% { transform: scaleY(0.05); }
  99% { transform: scaleY(0.05); }
}

@keyframes cat-blink-slow {
  0%, 98.5%, 100% { transform: scaleY(1); }
  99% { transform: scaleY(0.05); }
  99.5% { transform: scaleY(0.05); }
}

@keyframes cat-breathe {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-2px) scale(1.008); }
}

@keyframes ear-twitch-left {
  0%, 90%, 100% { transform: rotate(0deg); }
  92% { transform: rotate(-5deg); }
  94% { transform: rotate(3deg); }
  96% { transform: rotate(-2deg); }
}

@keyframes ear-twitch-right {
  0%, 88%, 100% { transform: rotate(0deg); }
  90% { transform: rotate(5deg); }
  92% { transform: rotate(-3deg); }
  94% { transform: rotate(2deg); }
}

@keyframes whisker-twitch-left {
  0%, 95%, 100% { transform: rotate(0deg); }
  97% { transform: rotate(-2deg); }
}

@keyframes whisker-twitch-right {
  0%, 93%, 100% { transform: rotate(0deg); }
  95% { transform: rotate(2deg); }
}

@keyframes chilitit-shake {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  15% { transform: translateX(-1px) rotate(-1deg); }
  30% { transform: translateX(1px) rotate(1deg); }
  45% { transform: translateX(-0.5px) rotate(-0.5deg); }
  60% { transform: translateX(0.5px) rotate(0.5deg); }
}

@keyframes chilitit-dizzy {
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(-2deg) scale(1.02); }
  50% { transform: rotate(0deg) scale(1); }
  75% { transform: rotate(2deg) scale(0.98); }
  100% { transform: rotate(0deg) scale(1); }
}

@keyframes tail-sway {
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
}

@keyframes surprise-pop {
  0% { transform: scale(1); }
  30% { transform: scale(1.15); }
  60% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

@keyframes sparkle-float {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0; }
  50% { opacity: 0.8; }
  100% { transform: translateY(-20px) rotate(180deg); opacity: 0; }
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

const AnimatedMascot = ({
  skin = 'figaro',
  isSpeaking = false,
  isThinking = false,
  size = 'md',
  className = '',
}) => {
  const [isPet, setIsPet] = useState(false);
  const [isSurprised, setIsSurprised] = useState(false);
  const colors = COLORS[skin] || COLORS.figaro;
  const isChilitit = skin === 'chilitit';

  // ── Tamaños responsivos ──────────────────────────────────────────────────
  const sizes = {
    sm: { w: 40, h: 40, svgScale: 0.4 },
    md: { w: 56, h: 56, svgScale: 0.56 },
    lg: { w: 72, h: 72, svgScale: 0.72 },
    xl: { w: 96, h: 96, svgScale: 0.96 },
  };
  const dim = sizes[size] || sizes.md;

  // ── Click / Pet handler ──────────────────────────────────────────────────
  const handlePet = useCallback(() => {
    setIsSurprised(true);
    setIsPet(true);
    setTimeout(() => {
      setIsSurprised(false);
      setTimeout(() => setIsPet(false), 300);
    }, 600);
  }, []);

  // ── Ejes de animación ────────────────────────────────────────────────────
  const floatAnim = isChilitit
    ? { y: [-2, 4, -2], rotate: [-2, 3, -2] }
    : { y: [-3, 3, -3], rotate: [-1, 1, -1] };

  const floatDur = isChilitit ? 2.5 : 3.5;

  return (
    <>
      <style>{blinkKeyframes}</style>
      <motion.div
        className={`relative inline-flex items-center justify-center shrink-0 cursor-pointer ${className}`}
        style={{ width: dim.w, height: dim.h }}
        animate={
          isSurprised
            ? { scale: [1, 1.12, 0.95, 1], rotate: [0, -2, 2, 0] }
            : isPet
              ? { scale: [1, 0.98, 1.02, 1] }
              : floatAnim
        }
        transition={{
          duration: isSurprised ? 0.5 : floatDur,
          repeat: isSurprised ? 0 : Infinity,
          ease: 'easeInOut',
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handlePet}
        title={isChilitit ? '🐈 Haz clic para molestar a Chilitit' : '🐾 Haz clic para acariciar a Fígaro'}
      >
        <svg
          viewBox="0 0 200 200"
          width={dim.w}
          height={dim.h}
          className="overflow-visible drop-shadow-lg"
          style={{ filter: isChilitit ? 'grayscale(100%) brightness(1.1) contrast(0.9)' : 'none' }}
        >
          {/* ── GLOW ─────────────────────────────────────────────────────── */}
          {isSpeaking && (
            <circle
              cx={CX}
              cy={CY + 20}
              r={HEAD_R + 15}
              fill="none"
              stroke={colors.glow}
              strokeWidth="3"
              opacity="0.5"
            >
              <animate attributeName="r" values={`${HEAD_R + 10};${HEAD_R + 20};${HEAD_R + 10}`} dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.5s" repeatCount="indefinite" />
            </circle>
          )}

          {/* ── BODY ─────────────────────────────────────────────────────── */}
          <ellipse cx={CX} cy={CY + 55} rx={45} ry={35} fill={colors.furLight} opacity="0.3" />
          <ellipse cx={CX} cy={CY + 52} rx={38} ry={28} fill={colors.fur} opacity="0.4" />

          {/* ── COLLAR ───────────────────────────────────────────────────── */}
          <path
            d={`M${CX - 25},${CY + 25} Q${CX},${CY + 38} ${CX + 25},${CY + 25}`}
            fill="none"
            stroke={colors.collar}
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Collar charm */}
          <circle cx={CX} cy={CY + 35} r={5} fill={colors.collarAccent}>
            {isChilitit && (
              <animate attributeName="cy" values={`${CY + 35};${CY + 38};${CY + 35}`} dur="1s" repeatCount="indefinite" />
            )}
          </circle>
          <text
            x={CX}
            y={CY + 37}
            textAnchor="middle"
            fontSize="6"
            fill={isChilitit ? '#374151' : '#FFF'}
            fontWeight="bold"
          >
            {isChilitit ? '?' : '★'}
          </text>

          {/* ── LEFT EAR ─────────────────────────────────────────────────── */}
          <g style={{ transformOrigin: `${CX - 35}px ${CY - 30}px`, animation: isChilitit ? 'none' : `ear-twitch-left 4s ease-in-out infinite` }}>
            <polygon
              points={`${CX - 42},${CY - 12} ${CX - 22},${CY - 52} ${CX - 8},${CY - 28}`}
              fill={colors.fur}
              stroke={colors.furDark}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <polygon
              points={`${CX - 36},${CY - 16} ${CX - 24},${CY - 44} ${CX - 14},${CY - 28}`}
              fill={colors.innerEar}
              opacity="0.7"
            />
          </g>

          {/* ── RIGHT EAR ────────────────────────────────────────────────── */}
          <g style={{ transformOrigin: `${CX + 35}px ${CY - 30}px`, animation: isChilitit ? 'none' : `ear-twitch-right 4.5s ease-in-out infinite` }}>
            <polygon
              points={`${CX + 42},${CY - 12} ${CX + 22},${CY - 52} ${CX + 8},${CY - 28}`}
              fill={colors.fur}
              stroke={colors.furDark}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <polygon
              points={`${CX + 36},${CY - 16} ${CX + 24},${CY - 44} ${CX + 14},${CY - 28}`}
              fill={colors.innerEar}
              opacity="0.7"
            />
          </g>

          {/* ── HEAD (FACE) ──────────────────────────────────────────────── */}
          <ellipse
            cx={CX}
            cy={CY - 5}
            rx={HEAD_R}
            ry={HEAD_R - 5}
            fill={colors.fur}
            stroke={colors.furDark}
            strokeWidth="2"
          />

          {/* ── CHEEKS (FAT CAT CHEEKS) ──────────────────────────────────── */}
          <ellipse cx={CX - 32} cy={CY + 5} rx={18} ry={14} fill={colors.furLight} opacity="0.7" />
          <ellipse cx={CX + 32} cy={CY + 5} rx={18} ry={14} fill={colors.furLight} opacity="0.7" />

          {/* ── BLUSH ────────────────────────────────────────────────────── */}
          <circle cx={CX - 30} cy={CY + 8} r={8} fill={colors.blush} />
          <circle cx={CX + 30} cy={CY + 8} r={8} fill={colors.blush} />

          {/* ── FOREHEAD MARKINGS ────────────────────────────────────────── */}
          {isChilitit ? (
            <path
              d={`M${CX},${CY - 38} L${CX - 5},${CY - 45} M${CX},${CY - 38} L${CX + 5},${CY - 45} M${CX - 5},${CY - 42} L${CX + 5},${CY - 42}`}
              stroke={colors.furLight}
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
          ) : (
            <path
              d={`M${CX - 3},${CY - 40} Q${CX},${CY - 48} ${CX + 3},${CY - 40}`}
              stroke={colors.furDark}
              strokeWidth="1.5"
              fill="none"
              opacity="0.4"
            />
          )}

          {/* ── EYES ────────────────────────────────────────────────────────
              Cada ojo tiene: blanco → iris → pupila → brillo
              El parpadeo se logra con scaleY en el grupo del ojo completo
          ────────────────────────────────────────────────────────────────── */}

          {/* LEFT EYE */}
          <g
            style={{
              transformOrigin: `${CX - 18}px ${CY - 8}px`,
              animation: isChilitit
                ? `cat-blink-slow 3.5s ease-in-out infinite, ${isThinking ? 'chilitit-shake 0.5s ease-in-out infinite' : ''}`
                : `cat-blink 4s ease-in-out infinite`,
            }}
          >
            <ellipse cx={CX - 18} cy={CY - 8} rx={13} ry={14} fill={colors.eyeWhite} />
            <ellipse cx={CX - 18} cy={CY - 8} rx={9} ry={10} fill={colors.iris} />
            <ellipse cx={CX - 16} cy={CY - 5} rx={4} ry={4} fill={colors.pupil} />
            <ellipse cx={CX - 21} cy={CY - 13} rx={4} ry={3} fill={colors.eyeHighlight} opacity="0.8" />
            {/* Eye outline */}
            <ellipse cx={CX - 18} cy={CY - 8} rx={13} ry={14} fill="none" stroke={colors.furDark} strokeWidth="1.5" />
          </g>

          {/* RIGHT EYE */}
          <g
            style={{
              transformOrigin: `${CX + 18}px ${CY - 8}px`,
              animation: isChilitit
                ? `cat-blink-slow 3.5s ease-in-out infinite`
                : `cat-blink 4.2s ease-in-out infinite`,
            }}
          >
            <ellipse cx={CX + 18} cy={CY - 8} rx={13} ry={14} fill={colors.eyeWhite} />
            <ellipse cx={CX + 18} cy={CY - 8} rx={9} ry={10} fill={colors.iris} />
            <ellipse cx={CX + 20} cy={CY - 5} rx={4} ry={4} fill={colors.pupil} />
            <ellipse cx={CX + 15} cy={CY - 13} rx={4} ry={3} fill={colors.eyeHighlight} opacity="0.8" />
            <ellipse cx={CX + 18} cy={CY - 8} rx={13} ry={14} fill="none" stroke={colors.furDark} strokeWidth="1.5" />
          </g>

          {/* ── SURPRISE EYES (when clicked) ─────────────────────────────── */}
          <AnimatePresence>
            {isSurprised && (
              <g>
                <circle cx={CX - 18} cy={CY - 8} r={16} fill="white" stroke={colors.furDark} strokeWidth="1.5" />
                <circle cx={CX - 18} cy={CY - 8} r={10} fill={colors.iris} />
                <circle cx={CX - 18} cy={CY - 8} r={6} fill={colors.pupil} />
                <circle cx={CX + 18} cy={CY - 8} r={16} fill="white" stroke={colors.furDark} strokeWidth="1.5" />
                <circle cx={CX + 18} cy={CY - 8} r={10} fill={colors.iris} />
                <circle cx={CX + 18} cy={CY - 8} r={6} fill={colors.pupil} />
              </g>
            )}
          </AnimatePresence>

          {/* ── NOSE ──────────────────────────────────────────────────────── */}
          <path
            d={`M${CX - 4},${CY + 2} Q${CX},${CY + 6} ${CX + 4},${CY + 2} Q${CX},${CY + 1} ${CX - 4},${CY + 2}Z`}
            fill={colors.nose}
          />

          {/* ── MOUTH ─────────────────────────────────────────────────────── */}
          {isSpeaking ? (
            /* Open mouth (speaking) */
            <g>
              <path
                d={`M${CX - 8},${CY + 7} Q${CX},${CY + 18} ${CX + 8},${CY + 7}`}
                fill={isChilitit ? '#5B5B5B' : '#4A0000'}
                stroke={colors.furDark}
                strokeWidth="1"
              />
              <ellipse cx={CX} cy={CY + 12} rx={5} ry={3} fill={colors.tongue} opacity="0.8">
                <animate attributeName="ry" values="3;5;3" dur="0.4s" repeatCount="indefinite" />
                <animate attributeName="rx" values="5;4;5" dur="0.4s" repeatCount="indefinite" />
              </ellipse>
            </g>
          ) : (
            /* Closed mouth — smile */
            <path
              d={`M${CX - 6},${CY + 5} Q${CX},${CY + 10} ${CX + 6},${CY + 5}`}
              fill="none"
              stroke={colors.mouth}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          )}

          {/* ── WHISKERS ──────────────────────────────────────────────────── */}
          <g style={{ animation: isChilitit ? 'whisker-twitch-left 3s ease-in-out infinite' : 'none' }}>
            <line x1={CX - 35} y1={CY + 2} x2={CX - 12} y2={CY + 4} stroke={colors.whisker} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            <line x1={CX - 33} y1={CY + 6} x2={CX - 10} y2={CY + 6} stroke={colors.whisker} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            <line x1={CX - 34} y1={CY + 10} x2={CX - 11} y2={CY + 8} stroke={colors.whisker} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          </g>
          <g style={{ animation: isChilitit ? 'whisker-twitch-right 3.5s ease-in-out infinite' : 'none' }}>
            <line x1={CX + 35} y1={CY + 2} x2={CX + 12} y2={CY + 4} stroke={colors.whisker} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            <line x1={CX + 33} y1={CY + 6} x2={CX + 10} y2={CY + 6} stroke={colors.whisker} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            <line x1={CX + 34} y1={CY + 10} x2={CX + 11} y2={CY + 8} stroke={colors.whisker} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          </g>

          {/* ── SPARKLES (thinking) ───────────────────────────────────────── */}
          {isThinking && !isChilitit && (
            <>
              {[
                { x: CX + 40, y: CY - 45, delay: 0 },
                { x: CX - 35, y: CY - 50, delay: 0.3 },
                { x: CX + 50, y: CY - 30, delay: 0.6 },
              ].map((s, i) => (
                <text
                  key={i}
                  x={s.x}
                  y={s.y}
                  fontSize="10"
                  fill={colors.collarAccent}
                  opacity="0.8"
                >
                  ✦
                  <animate attributeName="opacity" values="0;0.8;0" dur="1.5s" begin={`${s.delay}s`} repeatCount="indefinite" />
                  <animate attributeName="y" values={`${s.y};${s.y - 15}`} dur="1.5s" begin={`${s.delay}s`} repeatCount="indefinite" />
                </text>
              ))}
            </>
          )}

          {/* ── CHILITIT QUIRKY SIGNS ────────────────────────────────────── */}
          {isThinking && isChilitit && (
            <>
              {[
                { x: CX + 45, y: CY - 40, text: '?', delay: 0 },
                { x: CX - 40, y: CY - 35, text: '...', delay: 0.4 },
                { x: CX + 35, y: CY - 50, text: '¿', delay: 0.8 },
              ].map((s, i) => (
                <text
                  key={i}
                  x={s.x}
                  y={s.y}
                  fontSize="11"
                  fill={colors.collar}
                  fontWeight="bold"
                  opacity="0.7"
                >
                  {s.text}
                  <animate attributeName="opacity" values="0;0.7;0" dur="1.8s" begin={`${s.delay}s`} repeatCount="indefinite" />
                  <animateTransform attributeName="transform" type="rotate" values={`0 ${s.x} ${s.y};10 ${s.x} ${s.y};-10 ${s.x} ${s.y};0 ${s.x} ${s.y}`} dur="2s" begin={`${s.delay}s`} repeatCount="indefinite" />
                </text>
              ))}
            </>
          )}

          {/* ── EYEBROWS ──────────────────────────────────────────────────── */}
          {isThinking && (
            <>
              <line
                x1={CX - 28} y1={CY - 26} x2={CX - 10} y2={CY - 24}
                stroke={isChilitit ? '#6B6B6B' : '#2D2D2D'}
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
              >
                {isChilitit && (
                  <animate attributeName="x1" values={`${CX - 28};${CX - 26};${CX - 28}`} dur="1s" repeatCount="indefinite" />
                )}
              </line>
              <line
                x1={CX + 28} y1={CY - 24} x2={CX + 10} y2={CY - 26}
                stroke={isChilitit ? '#6B6B6B' : '#2D2D2D'}
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
              >
                {isChilitit && (
                  <animate attributeName="x1" values={`${CX + 28};${CX + 26};${CX + 28}`} dur="1s" repeatCount="indefinite" />
                )}
              </line>
            </>
          )}

          {/* ── DIZZY SPIRAL (ChilitAI only) ──────────────────────────────── */}
          {isChilitit && isThinking && (
            <g opacity="0.4">
              <text x={CX - 15} y={CY + 30} fontSize="8" fill="#6B6B6B" textAnchor="middle">
                @_@
                <animate attributeName="opacity" values="0.4;0.7;0.4" dur="1s" repeatCount="indefinite" />
              </text>
            </g>
          )}

          {/* ── HEART (when petted - Figaro only) ─────────────────────────── */}
          <AnimatePresence>
            {isPet && !isChilitit && (
              <g>
                {[
                  { x: CX + 30, y: CY - 52, delay: 0 },
                  { x: CX + 20, y: CY - 58, delay: 0.15 },
                  { x: CX + 40, y: CY - 48, delay: 0.3 },
                ].map((h, i) => (
                  <text
                    key={i}
                    x={h.x}
                    y={h.y}
                    fontSize="9"
                    fill="#FF6B8A"
                    opacity="0.9"
                  >
                    ♥
                    <animate attributeName="y" values={`${h.y};${h.y - 25}`} dur="1s" begin={`${h.delay}s`} fill="freeze" />
                    <animate attributeName="opacity" values="0.9;0" dur="1s" begin={`${h.delay}s`} fill="freeze" />
                  </text>
                ))}
              </g>
            )}
          </AnimatePresence>

          {/* ── ANGRY VIBES (when petted - ChilitAI only) ──────────────────── */}
          <AnimatePresence>
            {isPet && isChilitit && (
              <g>
                {[
                  { x: CX + 35, y: CY - 45, text: '💢', delay: 0 },
                  { x: CX - 30, y: CY - 40, text: '⚡', delay: 0.2 },
                ].map((a, i) => (
                  <text
                    key={i}
                    x={a.x}
                    y={a.y}
                    fontSize="10"
                    opacity="0.8"
                  >
                    {a.text}
                    <animate attributeName="y" values={`${a.y};${a.y - 20}`} dur="1s" begin={`${a.delay}s`} fill="freeze" />
                    <animate attributeName="opacity" values="0.8;0" dur="1s" begin={`${a.delay}s`} fill="freeze" />
                  </text>
                ))}
              </g>
            )}
          </AnimatePresence>
        </svg>
      </motion.div>
    </>
  );
};

export default AnimatedMascot;
