import React from 'react';

interface MustacheLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const MustacheLogo: React.FC<MustacheLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const dimensions = {
    sm: { circle: 'w-8 h-8', mustache: 'w-4.5 h-2.5', text: 'text-base' },
    md: { circle: 'w-10 h-10', mustache: 'w-6 h-3.5', text: 'text-xl' },
    lg: { circle: 'w-14 h-14', mustache: 'w-8 h-4.5', text: 'text-2xl' },
    xl: { circle: 'w-20 h-20', mustache: 'w-12 h-7', text: 'text-4xl' },
  }[size];

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {/* Circle Badge with CT & Mustache in Immersive UI */}
      <div
        className={`${dimensions.circle} rounded-full bg-[#FF6321] flex items-center justify-center font-black text-black italic shadow-[0_0_15px_rgba(255,99,33,0.4)] relative group transition-transform duration-300 hover:scale-105 shrink-0`}
      >
        {/* Iconic Mustache SVG in high-contrast black */}
        <svg
          className={`${dimensions.mustache} text-black fill-current drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] relative z-10`}
          viewBox="0 0 100 50"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M50 32 C42 16, 26 12, 10 18 C3 21, 0 30, 2 34 C6 41, 19 40, 27 33 C35 26, 42 27, 50 32 C58 27, 65 26, 73 33 C81 40, 94 41, 98 34 C100 30, 97 21, 90 18 C74 12, 58 16, 50 32 Z" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className={`font-black italic tracking-tighter font-heading text-white ${dimensions.text}`}>
            CHENEB <span className="text-[#FF6321]">TACOS</span>
          </div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.18em] mt-1">
            El Oued • Fast Food
          </span>
        </div>
      )}
    </div>
  );
};
