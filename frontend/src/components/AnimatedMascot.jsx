import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMES — Figaro: gato negro con blanco  |  ChilitAI: gato gris tabby
// ═══════════════════════════════════════════════════════════════════════════════

const COLORS = {
  figaro: {
    fur:       '#2B2B2B',  // negro azabache
    furLight:  '#4A4A4A',
    furDark:   '#1A1A1A',
    furWhite:  '#FFFFFF',
    innerEar:  '#F5A0A0',
    nose:      '#FF6B6B',
    eyeWhite:  '#FFFFFF',
    iris:      '#F5C842',  // amarillo dorado
    pupil:     '#1A1A1A',
    eyeLine:   '#1A1A1A',
    whisker:   '#888888',
    collar:    '#C62828',
    collarTag: '#FFD700',
    mouth:     '#FF6B6B',
    tongue:    '#FF8A8A',
    glow:      'rgba(198,40,40,0.3)',
  },
  chilitit: {
    fur:       '#8C8C8C',  // gris medio
    furLight:  '#A8A8A8',
    furDark:   '#6B6B6B',
    furWhite:  '#D4D4D4',
    innerEar:  '#C8C8C8',
    nose:      '#B0B0B0',
    eyeWhite:  '#F0F0F0',
    iris:      '#9CA3AF',
    pupil:     '#374151',
    eyeLine:   '#374151',
    whisker:   '#999999',
    collar:    '#6B7280',
    collarTag: '#D1D5DB',
    mouth:     '#9CA3AF',
    tongue:    '#B0B0B0',
    glow:      'rgba(107,114,128,0.3)',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CSS KEYFRAMES
// ═══════════════════════════════════════════════════════════════════════════════

const keyframesCSS = `
@keyframes gm-blink {
  0%, 95%, 100% { transform: scaleY(1); }
  96% { transform: scaleY(0.1); }
  98% { transform: scaleY(0.1); }
}
@keyframes gm-blink-slow {
  0%, 97.5%, 100% { transform: scaleY(1); }
  98% { transform: scaleY(0.1); }
  99.5% { transform: scaleY(0.1); }
}
@keyframes gm-ear-left {
  0%, 85%, 100% { transform: rotate(0deg); }
  87% { transform: rotate(-4deg); }
  89% { transform: rotate(2deg); }
  91% { transform: rotate(-1deg); }
}
@keyframes gm-ear-right {
  0%, 82%, 100% { transform: rotate(0deg); }
  84% { transform: rotate(4deg); }
  86% { transform: rotate(-2deg); }
  88% { transform: rotate(1deg); }
}
@keyframes gm-chilitit-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-1.5px) rotate(-0.8deg); }
  40% { transform: translateX(1.5px) rotate(0.8deg); }
  60% { transform: translateX(-0.8px) rotate(-0.4deg); }
  80% { transform: translateX(0.8px) rotate(0.4deg); }
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// SVG GEOMETRY  — viewBox 0 0 240 240, centro ~(120,120)
// ═══════════════════════════════════════════════════════════════════════════════

const S = { viewW: 240, viewH: 240 };
const CX = 120, CY = 110;

/* ─── Helper: dibuja ojo almendrado de gato ─────────────────────────────── */
const CatEye = ({ cx, cy, isLeft, colors, isClosed, isSurprised }) => {
  const w = 26, h = 18; // tamaño base del ojo
  const tilt = isLeft ? -0.15 : 0.15; // inclinación
  const rot = isLeft ? -8 : 8; // rotación en grados

  if (isSurprised) {
    return (
      <g transform={`translate(${cx},${cy})`}>
        <circle r={16} fill={colors.eyeWhite} stroke={colors.eyeLine} strokeWidth="2" />
        <circle r={9} fill={colors.iris} />
        <circle r={5} fill={colors.pupil} />
        <circle cx={-4} cy={-5} r={3} fill="#FFF" opacity="0.8" />
      </g>
    );
  }

  if (isClosed) {
    return (
      <g transform={`translate(${cx},${cy}) rotate(${rot})`}>
        <path d={`M${-w/2},0 Q0,${h/3} ${w/2},0`} fill="none" stroke={colors.eyeLine} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    );
  }

  return (
    <g transform={`translate(${cx},${cy}) rotate(${rot})`}>
      {/* Blanco */}
      <path d={`M${-w/2},0 C${-w/2},${-h} ${-w/4},${-h} 0,${-h} C${w/4},${-h} ${w/2},${-h} ${w/2},0 C${w/2},${h} ${w/4},${h} 0,${h} C${-w/4},${h} ${-w/2},${h} ${-w/2},0Z`}
        fill={colors.eyeWhite} stroke={colors.eyeLine} strokeWidth="2" />
      {/* Iris */}
      <path d={`M${-w/2+4},${-1} C${-w/2+4},${-h+6} ${-w/4},${-h+4} 0,${-h+4} C${w/4},${-h+4} ${w/2-4},${-h+6} ${w/2-4},${-1} C${w/2-4},${h-6} ${w/4},${h-4} 0,${h-4} C${-w/4},${h-4} ${-w/2+4},${h-6} ${-w/2+4},${-1}Z`}
        fill={colors.iris} />
      {/* Pupila — vertical/elíptica como los gatos */}
      <ellipse cx={0} cy={0} rx={5} ry={11} fill={colors.pupil} />
      {/* Brillo */}
      <ellipse cx={-5} cy={-7} rx={4} ry={3} fill="#FFF" opacity="0.7" />
      {/* Delineado superior reforzado */}
      <path d={`M${-w/2-2},${-2} Q${-w/2},${-h-2} 0,${-h-3} Q${w/2},${-h-2} ${w/2+2},${-2}`}
        fill="none" stroke={colors.eyeLine} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE
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
  const c = COLORS[skin] || COLORS.figaro;
  const isChili = skin === 'chilitit';

  // ── Tamaños ──────────────────────────────────────────────────────────────
  const dims = {
    sm: 40, md: 56, lg: 80, xl: 100,
  };
  const px = dims[size] || dims.md;

  // ── Click / Pet ───────────────────────────────────────────────────────────
  const handlePet = useCallback(() => {
    setIsSurprised(true);
    setIsPet(true);
    setTimeout(() => { setIsSurprised(false); setTimeout(() => setIsPet(false), 300); }, 600);
  }, []);

  const floatAnim = isChili
    ? { y: [-2, 5, -2], rotate: [-2, 3, -2] }
    : { y: [-3, 3, -3], rotate: [-1, 1, -1] };

  return (
    <>
      <style>{keyframesCSS}</style>
      <motion.div
        className={`relative inline-flex items-center justify-center shrink-0 cursor-pointer select-none ${className}`}
        style={{ width: px, height: px }}
        animate={isSurprised
          ? { scale: [1, 1.15, 0.95, 1], rotate: [0, -3, 3, 0] }
          : isPet
            ? { scale: [1, 0.97, 1.03, 1] }
            : floatAnim}
        transition={{ duration: isSurprised ? 0.5 : (isChili ? 2.5 : 3.5), repeat: isSurprised ? 0 : Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
        onClick={handlePet}
        title={isChili ? '🐈 Haz clic para molestar a Chilitit' : '🐾 Haz clic para acariciar a Fígaro'}
      >
        <svg viewBox={`0 0 ${S.viewW} ${S.viewH}`} width={px} height={px} className="overflow-visible drop-shadow-lg">
          <defs>
            <filter id="shadow-cat">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.2" />
            </filter>
          </defs>

          <g filter="url(#shadow-cat)">
            {/* ═══════════════ BODY (semioculto tras la cabeza) ═══════════════ */}
            <ellipse cx={CX} cy={CY + 70} rx={50} ry={36} fill={c.fur} opacity="0.35" />

            {/* ═══════════════ PECHA BLANCA (Figaro) ══════════════════════════ */}
            <path d={`M${CX-30},${CY+20} Q${CX},${CY+50} ${CX+30},${CY+20} Q${CX},${CY+60} ${CX-30},${CY+20}Z`}
              fill={c.furWhite} opacity={skin === 'figaro' ? 0.6 : 0.15} />

            {/* ═══════════════ COLLAR ════════════════════════════════════════ */}
            <path d={`M${CX-30},${CY+30} Q${CX},${CY+42} ${CX+30},${CY+30}`} fill="none" stroke={c.collar} strokeWidth="6" strokeLinecap="round" />
            {/* Medalla */}
            <circle cx={CX} cy={CY + 40} r={7} fill={c.collarTag} stroke={c.collar} strokeWidth="1.5" />
            <text x={CX} y={CY + 44} textAnchor="middle" fontSize="10" fill={skin === 'figaro' ? '#FFF' : '#374151'} fontWeight="bold">
              {isChili ? '?' : '★'}
            </text>

            {/* ═══════════════ OREJAS ════════════════════════════════════════ */}
            {/* Izquierda */}
            <g style={{ transformOrigin: `${CX-48}px ${CY-50}px`, animation: isChili ? 'none' : 'gm-ear-left 4s ease-in-out infinite' }}>
              <polygon points={`${CX-55},${CY-10} ${CX-32},${CY-80} ${CX-10},${CY-32}`} fill={c.fur} stroke={c.furDark} strokeWidth="2" strokeLinejoin="round" />
              <polygon points={`${CX-48},${CY-16} ${CX-35},${CY-68} ${CX-18},${CY-34}`} fill={c.innerEar} opacity="0.6" />
            </g>
            {/* Derecha */}
            <g style={{ transformOrigin: `${CX+48}px ${CY-50}px`, animation: isChili ? 'none' : 'gm-ear-right 4.2s ease-in-out infinite' }}>
              <polygon points={`${CX+55},${CY-10} ${CX+32},${CY-80} ${CX+10},${CY-32}`} fill={c.fur} stroke={c.furDark} strokeWidth="2" strokeLinejoin="round" />
              <polygon points={`${CX+48},${CY-16} ${CX+35},${CY-68} ${CX+18},${CY-34}`} fill={c.innerEar} opacity="0.6" />
            </g>

            {/* ═══════════════ CABEZA (cara de gato con barbilla) ════════════ */}
            <path d={`
              M${CX-62},${CY-18}
              C${CX-68},${CY-36} ${CX-56},${CY-58} ${CX-38},${CY-67}
              C${CX-24},${CY-74} ${CX+24},${CY-74} ${CX+38},${CY-67}
              C${CX+56},${CY-58} ${CX+68},${CY-36} ${CX+62},${CY-18}
              C${CX+64},${CY-4} ${CX+58},${CY+16} ${CX+44},${CY+30}
              C${CX+34},${CY+40} ${CX+18},${CY+48} ${CX},${CY+48}
              C${CX-18},${CY+48} ${CX-34},${CY+40} ${CX-44},${CY+30}
              C${CX-58},${CY+16} ${CX-64},${CY-4} ${CX-62},${CY-18}Z
            `} fill={c.fur} stroke={c.furDark} strokeWidth="2" />

            {/* ── MEJILLAS ──────────────────────────────────────────── */}
            <ellipse cx={CX-34} cy={CY+8} rx={18} ry={13} fill={c.furWhite} opacity={skin === 'figaro' ? 0.5 : 0.12} />
            <ellipse cx={CX+34} cy={CY+8} rx={18} ry={13} fill={c.furWhite} opacity={skin === 'figaro' ? 0.5 : 0.12} />

            {/* ── HOCICO (morro blanco) ─────────────────────────────── */}
            <path d={`
              M${CX-18},${CY+10}
              Q${CX-22},${CY+22} ${CX-12},${CY+32}
              Q${CX},${CY+36} ${CX+12},${CY+32}
              Q${CX+22},${CY+22} ${CX+18},${CY+10}
              Q${CX},${CY+6} ${CX-18},${CY+10}Z
            `} fill={c.furWhite} opacity={skin === 'figaro' ? 0.7 : 0.2} />

            {/* ── MANCHITA EN FRENTE (ChilitAI = rayas tabby) ──────── */}
            {isChili && (
              <path d={`M${CX-8},${CY-62} L${CX},${CY-54} L${CX+8},${CY-62} M${CX-5},${CY-58} L${CX},${CY-50} L${CX+5},${CY-58}`}
                stroke={c.furDark} strokeWidth="1.8" fill="none" opacity="0.35" strokeLinecap="round" />
            )}

            {/* ═══════════════ OJOS ALMENDRADOS ══════════════════════════════ */}
            {isChili && isThinking ? (
              /* ChilitAI pensando — ojos entrecerrados */
              <>
                <CatEye cx={CX-24} cy={CY-12} colors={c} isClosed={true} isLeft={true} />
                <CatEye cx={CX+24} cy={CY-12} colors={c} isClosed={false} isLeft={false} />
              </>
            ) : (
              <g style={{ animation: isChili ? 'gm-blink-slow 4s ease-in-out infinite, gm-chilitit-shake 3s ease-in-out infinite' : 'gm-blink 3.8s ease-in-out infinite' }}>
                <CatEye cx={CX-24} cy={CY-12} colors={c} isLeft={true} isSurprised={isSurprised} />
                <CatEye cx={CX+24} cy={CY-12} colors={c} isLeft={false} isSurprised={isSurprised} />
              </g>
            )}

            {/* ═══════════════ NARIZ (triángulo gatuno) ══════════════════════ */}
            <path d={`M${CX-5},${CY+8} L${CX},${CY+14} L${CX+5},${CY+8} Q${CX},${CY+6} ${CX-5},${CY+8}Z`}
              fill={c.nose} stroke={c.furDark} strokeWidth="1" />

            {/* ═══════════════ BOCA ══════════════════════════════════════════ */}
            {isSpeaking ? (
              <g>
                <path d={`M${CX-12},${CY+16} Q${CX},${CY+32} ${CX+12},${CY+16}`} fill={c.furDark} />
                <ellipse cx={CX} cy={CY+23} rx={7} ry={4} fill={c.tongue} opacity="0.7">
                  <animate attributeName="ry" values="4;6;4" dur="0.35s" repeatCount="indefinite" />
                </ellipse>
              </g>
            ) : (
              <path d={`M${CX-10},${CY+15} Q${CX},${CY+22} ${CX+10},${CY+15}`}
                fill="none" stroke={c.mouth} strokeWidth="2" strokeLinecap="round" />
            )}

            {/* ── LINEA DE NARIZ A BOCA ────────────────────────────── */}
            <line x1={CX} y1={CY+14} x2={CX} y2={CY+16} stroke={c.mouth} strokeWidth="1.5" strokeLinecap="round" />

            {/* ═══════════════ BIGOTES ══════════════════════════════════════ */}
            <g opacity="0.5">
              {/* Izquierdos */}
              <line x1={CX-48} y1={CY+2} x2={CX-16} y2={CY+8} stroke={c.whisker} strokeWidth="1.5" strokeLinecap="round" />
              <line x1={CX-46} y1={CY+10} x2={CX-14} y2={CY+12} stroke={c.whisker} strokeWidth="1.5" strokeLinecap="round" />
              <line x1={CX-44} y1={CY+18} x2={CX-12} y2={CY+16} stroke={c.whisker} strokeWidth="1.5" strokeLinecap="round" />
              {/* Derechos */}
              <line x1={CX+48} y1={CY+2} x2={CX+16} y2={CY+8} stroke={c.whisker} strokeWidth="1.5" strokeLinecap="round" />
              <line x1={CX+46} y1={CY+10} x2={CX+14} y2={CY+12} stroke={c.whisker} strokeWidth="1.5" strokeLinecap="round" />
              <line x1={CX+44} y1={CY+18} x2={CX+12} y2={CY+16} stroke={c.whisker} strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* ═══════════════ GLOW al hablar ═══════════════════════════════ */}
            {isSpeaking && (
              <ellipse cx={CX} cy={CY-10} rx={68} ry={62} fill="none" stroke={c.glow} strokeWidth="3" opacity="0.4">
                <animate attributeName="rx" values="62;72;62" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.5;0.2" dur="1.5s" repeatCount="indefinite" />
              </ellipse>
            )}

            {/* ═══════════════ CHISPAS (pensando) ════════════════════════════ */}
            {isThinking && !isChili && (
              <>
                {[{x:CX+52,y:CY-68},{x:CX-48,y:CY-72},{x:CX+64,y:CY-42}].map((s,i)=>(
                  <text key={i} x={s.x} y={s.y} fontSize="12" fill="#FFD700" fontWeight="bold" opacity="0.8">
                    ✦
                    <animate attributeName="opacity" values="0;0.8;0" dur={`${1.2+i*0.3}s`} repeatCount="indefinite" />
                    <animate attributeName="y" values={`${s.y};${s.y-18}`} dur={`${1.2+i*0.3}s`} repeatCount="indefinite" />
                  </text>
                ))}
              </>
            )}

            {/* ChilitAI pensando — signos de interrogación */}
            {isThinking && isChili && (
              <>
                {[{x:CX+55,y:CY-62,ch:'?'},{x:CX-52,y:CY-58,ch:'¿'},{x:CX+46,y:CY-76,ch:'?'}].map((s,i)=>(
                  <text key={i} x={s.x} y={s.y} fontSize="14" fill="#6B7280" fontWeight="bold" opacity="0.6">
                    {s.ch}
                    <animate attributeName="opacity" values="0;0.6;0" dur={`${1.5+i*0.4}s`} repeatCount="indefinite" />
                    <animateTransform attributeName="transform" type="rotate" values={`0 ${s.x} ${s.y};15 ${s.x} ${s.y};-15 ${s.x} ${s.y};0 ${s.x} ${s.y}`} dur="2s" repeatCount="indefinite" />
                  </text>
                ))}
              </>
            )}

            {/* ═══════════════ CORAZONES / REACCIÓN ══════════════════════════ */}
            <AnimatePresence>
              {isPet && !isChili && ['♥','♥','♥'].map((h,i)=>(
                <text key={i} x={CX+(i-1)*16} y={CY-70} fontSize="10" fill="#FF4466" opacity="0.9">
                  {h}
                  <animate attributeName="y" values={`${CY-60};${CY-90}`} dur={`${0.6+i*0.2}s`} fill="freeze" />
                  <animate attributeName="opacity" values="0.9;0" dur={`${0.6+i*0.2}s`} fill="freeze" />
                </text>
              ))}
              {isPet && isChili && ['💢','⚡','💢'].map((h,i)=>(
                <text key={i} x={CX+(i-1)*20} y={CY-65+i*5} fontSize="11" opacity="0.8">
                  {h}
                  <animate attributeName="y" values={`${CY-55-i*5};${CY-85-i*5}`} dur={`${0.5+i*0.2}s`} fill="freeze" />
                  <animate attributeName="opacity" values="0.8;0" dur={`${0.5+i*0.2}s`} fill="freeze" />
                </text>
              ))}
            </AnimatePresence>
          </g>
        </svg>
      </motion.div>
    </>
  );
};

export default AnimatedMascot;
