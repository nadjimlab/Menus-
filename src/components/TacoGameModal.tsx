import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOrders } from '../context/OrderContext';
import { useLanguage } from '../context/LanguageContext';
import { soundFx } from '../utils/soundEffects';
import { MustacheLogo } from './MustacheLogo';
import { X, Play, RotateCcw, Trophy, Sparkles, Heart } from 'lucide-react';

interface GameItem {
  id: number;
  x: number; // percentage 5% to 90%
  y: number; // px from top
  type: 'taco' | 'burger' | 'drink' | 'pepper';
  emoji: string;
  points: number;
  speed: number;
}

export const TacoGameModal: React.FC = () => {
  const { isTacoGameOpen, setIsTacoGameOpen } = useOrders();
  const { isRTL } = useLanguage();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cheneb_high_score');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [basketX, setBasketX] = useState(50); // percentage 0% to 100%
  const [items, setItems] = useState<GameItem[]>([]);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animFrameId = useRef<number | null>(null);
  const nextItemId = useRef(1);

  // Restart game
  const startGame = () => {
    setScore(0);
    setLives(3);
    setItems([]);
    setIsGameOver(false);
    setIsPlaying(true);
    setBasketX(50);
  };

  // Keyboard controls
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setBasketX((prev) => Math.max(8, prev - 7));
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setBasketX((prev) => Math.min(92, prev + 7));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isGameOver]);

  // Touch and mouse dragging
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPlaying || isGameOver || !gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
    setBasketX(Math.max(8, Math.min(92, relativeX)));
  };

  // Spawn falling items
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const spawnInterval = setInterval(() => {
      const rand = Math.random();
      let type: GameItem['type'] = 'taco';
      let emoji = '🌮';
      let points = 10;

      if (rand < 0.4) {
        type = 'taco';
        emoji = '🌮';
        points = 10;
      } else if (rand < 0.65) {
        type = 'burger';
        emoji = '🍔';
        points = 15;
      } else if (rand < 0.82) {
        type = 'drink';
        emoji = '🥤';
        points = 5;
      } else {
        type = 'pepper';
        emoji = '🌶️';
        points = -15;
      }

      const newItem: GameItem = {
        id: nextItemId.current++,
        x: Math.floor(Math.random() * 80) + 10,
        y: 0,
        type,
        emoji,
        points,
        speed: Math.random() * 2 + 3.5,
      };

      setItems((prev) => [...prev, newItem]);
    }, 700);

    return () => clearInterval(spawnInterval);
  }, [isPlaying, isGameOver]);

  // Game loop for moving items and collision detection
  const updatePhysics = useCallback(() => {
    if (!isPlaying || isGameOver) return;

    setItems((prevItems) => {
      const remaining: GameItem[] = [];
      let newScore = score;
      let newLives = lives;

      for (const item of prevItems) {
        const nextY = item.y + item.speed;

        // Check if item reached the basket height (~320px)
        if (nextY >= 310 && nextY <= 345) {
          // Check horizontal collision with basket
          if (Math.abs(item.x - basketX) < 13) {
            if (item.type === 'pepper') {
              soundFx.playBombSound();
              newLives -= 1;
              if (newLives <= 0) {
                setIsGameOver(true);
                setIsPlaying(false);
              }
            } else {
              soundFx.playCatchSound();
              newScore += item.points;
            }
            continue; // Item caught!
          }
        }

        // Missed item
        if (nextY > 370) {
          continue;
        }

        remaining.push({ ...item, y: nextY });
      }

      setScore(newScore);
      setLives(newLives);

      if (newScore > highScore) {
        setHighScore(newScore);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cheneb_high_score', newScore.toString());
        }
      }

      return remaining;
    });

    animFrameId.current = requestAnimationFrame(updatePhysics);
  }, [isPlaying, isGameOver, basketX, score, lives, highScore]);

  useEffect(() => {
    if (isPlaying && !isGameOver) {
      animFrameId.current = requestAnimationFrame(updatePhysics);
    }
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isPlaying, isGameOver, updatePhysics]);

  if (!isTacoGameOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0F0F10] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-[#141416] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-[0_0_10px_rgba(147,51,234,0.4)]">
              <MustacheLogo className="w-4 h-2 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white font-heading">
                {isRTL ? 'تحدي شنب تاكوس' : 'Défi Cheneb Tacos'}
              </h3>
              <p className="text-[10px] text-gray-400">
                {isRTL ? 'اصطد التاكوس وتفادى الفلفل الحار 🌶️' : 'Attrapez les tacos et évitez les piments !'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-amber-400 text-xs font-black">
              <Trophy className="w-3.5 h-3.5" />
              <span>{highScore}</span>
            </div>

            <button
              onClick={() => setIsTacoGameOpen(false)}
              aria-label="Fermer"
              className="w-7 h-7 rounded-full bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game Arena */}
        <div
          ref={gameAreaRef}
          onPointerMove={handlePointerMove}
          className="relative w-full h-[380px] bg-radial from-[#1A1A1C] to-[#0A0A0B] overflow-hidden select-none cursor-ew-resize touch-none"
        >
          {/* Top Score and Lives Bar */}
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white">
              <span className="text-[10px] uppercase font-bold text-gray-400">Score:</span>
              <span className="text-base font-black text-[#FF6321] font-heading">{score}</span>
            </div>

            <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
              {[1, 2, 3].map((heartIndex) => (
                <Heart
                  key={heartIndex}
                  className={`w-4 h-4 transition-transform ${
                    heartIndex <= lives
                      ? 'text-rose-500 fill-rose-500 scale-100'
                      : 'text-gray-600 scale-75'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Falling Items */}
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                left: `${item.x}%`,
                top: `${item.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute text-2xl filter drop-shadow-md pointer-events-none transition-all duration-75"
            >
              {item.emoji}
            </div>
          ))}

          {/* Player Tray / Basket */}
          <div
            style={{
              left: `${basketX}%`,
              transform: 'translateX(-50%)',
            }}
            className="absolute bottom-5 w-24 h-12 bg-linear-to-r from-[#FF6321] to-amber-500 rounded-2xl flex flex-col items-center justify-center shadow-[0_4px_20px_rgba(255,99,33,0.5)] border-2 border-white/40 pointer-events-none transition-all duration-75"
          >
            <MustacheLogo className="w-8 h-3 text-black" />
            <span className="text-[9px] font-black uppercase text-black tracking-widest mt-0.5">
              CHENEB
            </span>
          </div>

          {/* Start Screen Overlay */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="w-14 h-14 rounded-2xl bg-[#FF6321] text-black flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(255,99,33,0.5)]">
                <MustacheLogo className="w-9 h-4 text-black" />
              </div>
              <h4 className="text-xl font-black text-white font-heading">
                {isRTL ? 'تحدي صياد التاكوس !' : 'Défi Cheneb Tacos !'}
              </h4>
              <p className="text-xs text-gray-300 max-w-xs mt-2 leading-relaxed">
                {isRTL
                  ? 'حرك الصينية بإصبعك أو بالأسهم لاصطياد التاكوس والبرغر (+10 نقاط) وتفادي الفلفل الحار 🌶️'
                  : 'Déplacez le plateau pour attraper tacos & burgers (+10 pts) et évitez les piments piquants 🌶️ !'}
              </p>
              <button
                onClick={startGame}
                className="mt-5 px-7 py-3 rounded-2xl bg-[#FF6321] hover:brightness-110 text-black font-black uppercase tracking-wider text-sm flex items-center gap-2 shadow-[0_4px_20px_rgba(255,99,33,0.4)] cursor-pointer active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isRTL ? 'ابدأ اللعب الآن' : 'Commencer'}</span>
              </button>
            </div>
          )}

          {/* Game Over Screen Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-2 shadow-lg">
                <Trophy className="w-6 h-6 text-amber-300" />
              </div>
              <h4 className="text-lg font-black text-white font-heading">
                {isRTL ? 'انتهت اللعبة !' : 'Partie terminée !'}
              </h4>
              <div className="my-2">
                <span className="text-3xl font-black text-[#FF6321] font-heading block">
                  {score} pts
                </span>
                <span className="text-xs text-gray-400">
                  {score >= 100
                    ? isRTL ? '👑 شنب ذهبي - أسطورة التاكوس!' : '👑 Cheneb d\'Or - Légende du Tacos !'
                    : isRTL ? '👏 نتيجة ممتازة!' : '👏 Bien joué !'}
                </span>
              </div>

              {/* Reward Coupon */}
              <div className="p-3 rounded-xl bg-[#1A1A1C] border border-[#FF6321]/40 my-3 max-w-xs w-full">
                <div className="flex items-center justify-center gap-1 text-[11px] font-black text-[#FF6321]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isRTL ? 'هدية الشنب الخاصة' : 'Cadeau Spécial Cheneb'}</span>
                </div>
                <p className="text-[10px] text-gray-300 mt-1">
                  {isRTL
                    ? 'كود الخصم: CHENEB5 (خصم 5% عند الدفع عند النادل)'
                    : 'Code promo : CHENEB5 (-5% à table ou à la caisse)'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={startGame}
                  className="px-5 py-2.5 rounded-xl bg-[#FF6321] hover:brightness-110 text-black font-black uppercase text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{isRTL ? 'إعادة المحاولة' : 'Rejouer'}</span>
                </button>
                <button
                  onClick={() => setIsTacoGameOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] text-gray-300 hover:text-white text-xs font-bold border border-white/10 cursor-pointer"
                >
                  {isRTL ? 'إغلاق' : 'Quitter'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/5 bg-[#141416] text-center text-[11px] text-gray-400">
          {isRTL
            ? '💡 اسحب إصبعك يميناً ويساراً لتحريك الصينية'
            : '💡 Glissez votre doigt de gauche à droite pour déplacer le plateau'}
        </div>
      </div>
    </div>
  );
};
