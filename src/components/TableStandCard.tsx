import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { MustacheLogo } from './MustacheLogo';
import { Printer, Download, ExternalLink, QrCode } from 'lucide-react';

interface TableStandCardProps {
  tableNumber: number;
}

export const TableStandCard: React.FC<TableStandCardProps> = ({ tableNumber }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  const getTableUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?table=${tableNumber}`;
  };

  const tableUrl = getTableUrl();

  useEffect(() => {
    if (!tableUrl) return;
    QRCode.toDataURL(tableUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0A0A0B',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation failed', err));
  }, [tableUrl, tableNumber]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `cheneb-tacos-table-${tableNumber}-qr.png`;
    a.click();
  };

  const handleTestLink = () => {
    window.open(tableUrl, '_blank');
  };

  return (
    <div className="flex flex-col items-center">
      {/* Printable Card */}
      <div
        ref={cardRef}
        className="print-card w-full max-w-[340px] bg-white text-black rounded-3xl p-6 shadow-2xl border-4 border-[#FF6321] text-center flex flex-col items-center relative overflow-hidden"
      >
        {/* Top Banner */}
        <div className="w-full bg-[#0A0A0B] text-white py-2 px-4 rounded-xl mb-4 flex items-center justify-center gap-2 shadow-inner">
          <MustacheLogo className="w-5 h-2.5 text-[#FF6321]" />
          <span className="text-sm font-black font-heading tracking-wider">CHENEB TACOS</span>
        </div>

        {/* Table Number Badge */}
        <div className="mb-3">
          <span className="text-[11px] uppercase tracking-widest font-black text-gray-500 block">
            VOTRE TABLE / طاولتكم
          </span>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-[#FF6321] text-black font-black font-heading text-2xl shadow-md mt-1">
            <span>TABLE N° {tableNumber}</span>
            <span className="text-lg">طاولة {tableNumber}</span>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-gray-300 shadow-sm my-2 flex items-center justify-center w-56 h-56">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR Code Table ${tableNumber}`} className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
              <QrCode className="w-8 h-8 animate-pulse" />
              <span className="text-xs">Génération...</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-2 space-y-1">
          <p className="text-xs font-bold text-gray-800 leading-tight">
            📱 Scannez pour consulter le menu et commander
          </p>
          <p className="text-[11px] font-medium text-gray-600 font-sans leading-tight">
            امسح الكود بكاميرا هاتفك واطلب وجبتك مباشرة إلى طاولتك
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-200 w-full flex items-center justify-between text-[10px] text-gray-500 font-semibold">
          <span>Tacos • Burgers • Plats</span>
          <span className="text-[#FF6321] font-black">El Oued</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] border border-white/10 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-[#FF6321]" />
          <span>Imprimer</span>
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1A1A1C] hover:bg-[#252527] border border-white/10 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Télécharger PNG</span>
        </button>

        <button
          onClick={handleTestLink}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF6321] hover:brightness-110 text-black text-xs font-black transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Tester cette table</span>
        </button>
      </div>
    </div>
  );
};
