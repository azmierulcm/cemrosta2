'use client';

import { Flame } from 'lucide-react';
import { getAirportMeta } from '@/lib/utils/destinations';
import Image from 'next/image';

export interface TopDestEntry {
  iata: string;
  city: string;
  flagCode: string; // lowercase ISO 3166-1 alpha-2
  count: number;
  isNew: boolean;
}

// IATA → lowercase ISO country code for flagcdn.com
const IATA_FLAG: Record<string, string> = {
  KUL:'my', PEN:'my', JHB:'my', LGK:'my', BKI:'my', KCH:'my', MYY:'my', TWU:'my',
  SDK:'my', TGG:'my', AOR:'my', IPH:'my', SBW:'my', KUA:'my', LBU:'my',
  SIN:'sg', BKK:'th', DMK:'th', CNX:'th', HKT:'th', SGN:'vn', HAN:'vn', DAD:'vn',
  RGN:'mm', PNH:'kh', VTE:'la', MNL:'ph', CGK:'id', SUB:'id', DPS:'id',
  UPG:'id', BPN:'id', PKU:'id', JOG:'id', KNO:'id',
  NRT:'jp', HND:'jp', KIX:'jp', FUK:'jp', ICN:'kr', PEK:'cn', PKX:'cn',
  PVG:'cn', CAN:'cn', CSX:'cn', CTU:'cn', TFU:'cn', XMN:'cn', HKG:'hk', TPE:'tw',
  BOM:'in', DEL:'in', MAA:'in', BLR:'in', HYD:'in', AMD:'in', CCU:'in',
  CMB:'lk', DAC:'bd', KTM:'np', MLE:'mv', DOH:'qa', JED:'sa', MED:'sa', RUH:'sa',
  DXB:'ae', AUH:'ae', MCT:'om', KHI:'pk', IST:'tr', CAI:'eg', ADD:'et',
  NBO:'ke', JNB:'za', CPT:'za',
  LHR:'gb', LGW:'gb', CDG:'fr', AMS:'nl', FRA:'de', MAD:'es', FCO:'it',
  ZRH:'ch', VIE:'at', MUC:'de',
  SYD:'au', MEL:'au', BNE:'au', PER:'au', ADL:'au', AKL:'nz', ZQN:'nz',
  JFK:'us', LAX:'us', ORD:'us', YYZ:'ca', GRU:'br',
};

const RANK_BADGE: Record<number, string> = {
  1: 'border-[#d97706]/30 text-[#d97706] bg-[#fef3c7]',
  2: 'border-[#9ca3af]/30 text-[#6b7280] bg-[#f3f4f6]',
  3: 'border-[#b45309]/30 text-[#b45309] bg-[#fef3c7]/60',
};
const RANK_BADGE_DEFAULT = 'border-border text-text-subtle bg-surface';

function DestCard({ dest, rank, spanFull }: { dest: TopDestEntry; rank: number; spanFull: boolean }) {
  const badgeCls = RANK_BADGE[rank] ?? RANK_BADGE_DEFAULT;

  return (
    <div
      className={[
        'group flex flex-col justify-between p-3 sm:p-4 bg-bg rounded-xl sm:rounded-2xl',
        'border border-border transition-shadow duration-200',
        'hover:shadow-[0_6px_18px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.03)]',
        'active:scale-[0.98] cursor-pointer',
        spanFull ? 'col-span-2' : '',
      ].join(' ')}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black flex items-center justify-center border font-mono ${badgeCls}`}>
          #{rank}
        </span>
        {dest.isNew && (
          <span className="flex items-center gap-0.5 bg-accent-soft text-accent text-[8px] sm:text-[9px] font-black px-1.5 sm:px-2 py-0.5 rounded-full border border-accent/10 uppercase tracking-wide font-mono">
            <Flame className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            <span>New</span>
          </span>
        )}
      </div>

      {/* Flag + city */}
      <div className={`flex items-center gap-2 sm:gap-3 ${spanFull ? '' : 'my-1'}`}>
        <div className="relative w-10 h-7 sm:w-12 sm:h-8 overflow-hidden bg-surface border border-border shrink-0 shadow-sm">
          <Image
            src={`https://flagcdn.com/w80/${dest.flagCode}.png`}
            alt={dest.iata}
            width={48}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
        <div className={`min-w-0 ${spanFull ? 'flex-1' : ''}`}>
          <h3 className="text-sm sm:text-base font-black tracking-wide text-text leading-none font-mono">{dest.iata}</h3>
          <p className="text-[11px] sm:text-xs text-text-muted font-bold truncate mt-1">{dest.city}</p>
        </div>
        {spanFull && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-text-subtle font-mono">Freq</span>
            <span className="text-[10px] sm:text-xs font-black text-accent bg-accent-soft px-1.5 sm:px-2 py-0.5 rounded-md border border-accent/10 font-mono">
              {dest.count}×
            </span>
          </div>
        )}
      </div>

      {/* Footer frequency — standard cards only */}
      {!spanFull && (
        <div className="mt-3 sm:mt-4 pt-2 sm:pt-2.5 border-t border-border flex items-center justify-between gap-1">
          <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-text-subtle font-mono truncate">Freq</span>
          <span className="text-[10px] sm:text-xs font-black text-accent bg-accent-soft px-1.5 sm:px-2 py-0.5 rounded-md border border-accent/10 font-mono shrink-0">
            {dest.count}×
          </span>
        </div>
      )}
    </div>
  );
}

interface TopDestinationsProps {
  destinations: TopDestEntry[];
}

export function TopDestinations({ destinations }: TopDestinationsProps) {
  const top = destinations.slice(0, 5);
  if (top.length === 0) return null;

  const isOdd = top.length % 2 !== 0;

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {top.map((dest, i) => (
        <DestCard
          key={dest.iata}
          dest={dest}
          rank={i + 1}
          spanFull={isOdd && i === top.length - 1}
        />
      ))}
    </div>
  );
}

/** Convert EarnedDestination[] (profile page) → TopDestEntry[] */
export function earnedToTopDest(
  earned: Array<{ iata: string; visits: number; isNew: boolean; isHome: boolean }>,
): TopDestEntry[] {
  return earned
    .filter((d) => !d.isHome)
    .sort((a, b) => b.visits - a.visits)
    .map((d) => {
      const meta = getAirportMeta(d.iata);
      return {
        iata:     d.iata,
        city:     meta.city,
        flagCode: IATA_FLAG[d.iata.toUpperCase()] ?? 'un',
        count:    d.visits,
        isNew:    d.isNew,
      };
    });
}
