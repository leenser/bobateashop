import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productsApi } from '../services/api';
import { translateCategory, translateProduct } from '../i18n/productTranslations';

interface Product {
  id: number;
  name: string;
  category: string;
  base_price: number;
  is_popular: boolean;
  description?: string | null;
}

/** ---------------------------
 *  Visual theme helpers
 *  --------------------------- */

type CatTheme = {
  icon: string;
  accentFrom: string;
  accentTo: string;
  chipBg: string;
  chipText: string;
  glow: string;
  pattern: 'pearls' | 'waves' | 'spark' | 'grid';
};

const DEFAULT_THEME: CatTheme = {
  icon: '🧋',
  accentFrom: '#A855F7',
  accentTo: '#EC4899',
  chipBg: 'bg-white/10',
  chipText: 'text-white',
  glow: 'shadow-[0_0_40px_rgba(168,85,247,0.35)]',
  pattern: 'pearls',
};

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function themeForCategory(categoryRaw: string): CatTheme {
  const category = (categoryRaw || 'Other').toLowerCase();

  const presets: Array<[RegExp, CatTheme]> = [
    // Seasonal teas 🍵 (put FIRST so it overrides generic tea matching)
    [
      /(seasonal|season|limited|special)\s*(tea|drink|beverage)?/i,
      {
        icon: '🍵',
        accentFrom: '#22C55E',
        accentTo: '#06B6D4',
        chipBg: 'bg-emerald-400/20',
        chipText: 'text-emerald-50',
        glow: 'shadow-[0_0_55px_rgba(34,197,94,0.28)]',
        pattern: 'spark',
      },
    ],
  
    // Smoothies 🥤
    [
      /(smoothie|smoothies|slush|slushie|blended|frappe|frappé)/i,
      {
        icon: '🥤',
        accentFrom: '#60A5FA',
        accentTo: '#A78BFA',
        chipBg: 'bg-sky-400/20',
        chipText: 'text-sky-50',
        glow: 'shadow-[0_0_55px_rgba(96,165,250,0.30)]',
        pattern: 'waves',
      },
    ],
  
    // Snacks 🥡
    [
      /(snack|snacks)/i,
      {
        icon: '🥡',
        accentFrom: '#F97316',
        accentTo: '#F59E0B',
        chipBg: 'bg-orange-400/20',
        chipText: 'text-orange-50',
        glow: 'shadow-[0_0_55px_rgba(249,115,22,0.35)]',
        pattern: 'grid',
      },
    ],
  
    // Keep desserts separate if you have them (still 🍰)
    [
      /(dessert|sweet|cake|cookie|pastry)/i,
      {
        icon: '🍰',
        accentFrom: '#22C55E',
        accentTo: '#06B6D4',
        chipBg: 'bg-emerald-400/20',
        chipText: 'text-emerald-50',
        glow: 'shadow-[0_0_55px_rgba(34,197,94,0.28)]',
        pattern: 'spark',
      },
    ],
  
    // Generic teas/drinks 🧋
    [
      /(milk|boba|tea|drink|beverage)/i,
      {
        icon: '🧋',
        accentFrom: '#A855F7',
        accentTo: '#EC4899',
        chipBg: 'bg-fuchsia-500/20',
        chipText: 'text-fuchsia-50',
        glow: 'shadow-[0_0_55px_rgba(236,72,153,0.35)]',
        pattern: 'pearls',
      },
    ],
  
    // Coffee ☕️
    [
      /(coffee|espresso)/i,
      {
        icon: '☕️',
        accentFrom: '#F97316',
        accentTo: '#F59E0B',
        chipBg: 'bg-orange-400/20',
        chipText: 'text-orange-50',
        glow: 'shadow-[0_0_55px_rgba(249,115,22,0.35)]',
        pattern: 'waves',
      },
    ],
  
    // Toppings ✨
    [
      /(topping|add[-\s]?on|addon|extra)/i,
      {
        icon: '✨',
        accentFrom: '#60A5FA',
        accentTo: '#A78BFA',
        chipBg: 'bg-sky-400/20',
        chipText: 'text-sky-50',
        glow: 'shadow-[0_0_55px_rgba(96,165,250,0.30)]',
        pattern: 'grid',
      },
    ],
  ];
  

  for (const [re, theme] of presets) {
    if (re.test(category)) return theme;
  }

  const h = hashString(category);
  const hue = h % 360;
  const hue2 = (hue + 35 + (h % 50)) % 360;

  const from = `hsl(${hue} 85% 60%)`;
  const to = `hsl(${hue2} 90% 58%)`;

  const iconPool = ['🧋', '🥤', '🍓', '🍯', '🍋', '🫐', '🌸', '🍑', '✨', '🧊', '🍬', '🍵'];
  const icon = iconPool[h % iconPool.length];

  const patterns: CatTheme['pattern'][] = ['pearls', 'waves', 'spark', 'grid'];
  const pattern = patterns[(h >>> 8) % patterns.length];

  return {
    ...DEFAULT_THEME,
    icon,
    accentFrom: from,
    accentTo: to,
    chipBg: 'bg-white/10',
    chipText: 'text-white',
    glow: 'shadow-[0_0_55px_rgba(255,255,255,0.12)]',
    pattern,
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatMoneyUSD(price: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(price);
}

function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Generates an SVG “photo card” (data URI) for a product so the menu is image-rich
 * without needing image URLs in the DB.
 *
 * NOTE: Popular ribbon removed from the image on purpose (tag only).
 */
function productImageDataUri(p: Product, theme: CatTheme): string {
  const name = p.name ?? 'Item';
  const short = name.length > 22 ? name.slice(0, 22) + '…' : name;

  const h = hashString(`${p.category}|${p.name}`);
  const seed = h % 9999;

  const tilt = ((h % 17) - 8) * 0.55;
  const pearlCount = 8 + (h % 7);
  const sparkleCount = 6 + (h % 6);

  const bgPattern = (() => {
    if (theme.pattern === 'pearls') {
      const pearls = Array.from({ length: pearlCount }).map((_, i) => {
        const x = 10 + ((seed * (i + 3) * 17) % 80);
        const y = 10 + ((seed * (i + 5) * 29) % 70);
        const r = 3 + ((seed * (i + 7) * 13) % 5);
        const a = 0.12 + (((seed * (i + 11)) % 20) / 100);
        return `<circle cx="${x}%" cy="${y}%" r="${r}" fill="white" opacity="${a}"/>`;
      });
      return pearls.join('');
    }
    if (theme.pattern === 'waves') {
      return `
        <path d="M0,70 C20,55 40,85 60,70 C80,55 100,85 120,70" stroke="white" stroke-opacity="0.18" stroke-width="10" fill="none"/>
        <path d="M0,35 C25,20 50,50 75,35 C100,20 125,50 150,35" stroke="white" stroke-opacity="0.12" stroke-width="8" fill="none"/>
      `;
    }
    if (theme.pattern === 'spark') {
      const sparks = Array.from({ length: sparkleCount }).map((_, i) => {
        const x = 8 + ((seed * (i + 2) * 31) % 84);
        const y = 10 + ((seed * (i + 4) * 19) % 70);
        const s = 6 + ((seed * (i + 7) * 11) % 10);
        const o = 0.12 + (((seed * (i + 9)) % 12) / 100);
        return `
          <path d="M ${x} ${y - s} L ${x} ${y + s}" stroke="white" stroke-opacity="${o}" stroke-width="2" stroke-linecap="round"/>
          <path d="M ${x - s} ${y} L ${x + s} ${y}" stroke="white" stroke-opacity="${o}" stroke-width="2" stroke-linecap="round"/>
        `;
      });
      return sparks.join('');
    }
    return `
      <path d="M0 22 H120 M0 44 H120 M0 66 H120 M24 0 V90 M48 0 V90 M72 0 V90 M96 0 V90"
        stroke="white" stroke-opacity="0.10" stroke-width="1"/>
    `;
  })();

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="960" height="720" viewBox="0 0 120 90">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${theme.accentFrom}"/>
        <stop offset="100%" stop-color="${theme.accentTo}"/>
      </linearGradient>
      <radialGradient id="r" cx="30%" cy="20%" r="80%">
        <stop offset="0%" stop-color="white" stop-opacity="0.28"/>
        <stop offset="60%" stop-color="white" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="black" stop-opacity="0.10"/>
      </radialGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/>
      </filter>
    </defs>

    <rect width="120" height="90" fill="url(#g)"/>
    <rect width="120" height="90" fill="url(#r)"/>
    <g transform="rotate(${tilt} 60 45)">
      ${bgPattern}
    </g>

    <g filter="url(#shadow)">
      <rect x="8" y="10" rx="10" ry="10" width="104" height="50" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)"/>
      <text x="60" y="38" font-size="22" font-family="system-ui, -apple-system, Segoe UI, Roboto" text-anchor="middle" fill="white" font-weight="800">
        ${theme.icon}
      </text>
      <text x="60" y="56" font-size="8.2" font-family="system-ui, -apple-system, Segoe UI, Roboto" text-anchor="middle" fill="rgba(255,255,255,0.92)" font-weight="750">
        ${escapeXml(short)}
      </text>
    </g>
  </svg>`;

  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

/** ---------------------------
 *  Component
 *  --------------------------- */

export const MenuBoard: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Re-render when async translations come back
  const [translationTrigger, setTranslationTrigger] = useState(0);
  useEffect(() => {
    const handleTranslationUpdate = () => setTranslationTrigger(prev => prev + 1);
    window.addEventListener('translationUpdate', handleTranslationUpdate);
    return () => window.removeEventListener('translationUpdate', handleTranslationUpdate);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await productsApi.getAll();
        setProducts(res.data ?? []);
      } catch (err) {
        console.error('Failed to load menu board products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      const key = p.category || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }

    for (const [cat, list] of map.entries()) {
      list.sort((a, b) => {
        if (a.is_popular !== b.is_popular) return a.is_popular ? -1 : 1;
        if (a.base_price !== b.base_price) return a.base_price - b.base_price;
        return a.name.localeCompare(b.name);
      });
      map.set(cat, list);
    }

    const entries = Array.from(map.entries());
    entries.sort((a, b) => {
      const popA = a[1].filter(x => x.is_popular).length;
      const popB = b[1].filter(x => x.is_popular).length;
      if (popA !== popB) return popB - popA;
      return a[0].localeCompare(b[0]);
    });

    return entries;
  }, [products]);

  const chips = useMemo(() => {
    return grouped.map(([cat]) => {
      const id = slugify(cat);
      const theme = themeForCategory(cat);
      return {
        cat,
        id,
        theme,
        label: translateCategory(cat, i18n.language),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grouped, i18n.language, translationTrigger]);

  const scrollToCategory = (id: string) => {
    const el = document.getElementById(`cat-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const popular = useMemo(() => products.filter(p => p.is_popular), [products]);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  useEffect(() => {
    if (popular.length <= 1) return;
    const handle = window.setInterval(() => {
      setSpotlightIndex(i => (i + 1) % popular.length);
    }, 3500);
    return () => window.clearInterval(handle);
  }, [popular.length]);

  const spotlight = popular.length ? popular[spotlightIndex] : null;
  const marqueeRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="min-h-screen w-full text-white overflow-x-hidden bg-[#05050A]">
      <style>{`
        .mb-noise {
          background-image:
            radial-gradient(circle at 20% 10%, rgba(168,85,247,0.35), transparent 45%),
            radial-gradient(circle at 80% 20%, rgba(236,72,153,0.28), transparent 48%),
            radial-gradient(circle at 30% 85%, rgba(34,197,94,0.18), transparent 52%),
            radial-gradient(circle at 85% 78%, rgba(59,130,246,0.18), transparent 52%);
        }
        .mb-grain::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.12'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
          opacity: 0.25;
        }
        .mb-float { animation: floaty 10s ease-in-out infinite; }
        @keyframes floaty { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .mb-marquee { animation: marquee 22s linear infinite; }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @media (prefers-reduced-motion: reduce) { .mb-float, .mb-marquee { animation: none !important; } }
        .mb-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .mb-clamp-3 { display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
      `}</style>

      <div className="fixed inset-0 mb-noise" />
      <div className="fixed inset-0 mb-grain" />

      <div className="pointer-events-none fixed inset-0 opacity-70">
        {Array.from({ length: 14 }).map((_, i) => {
          const x = hashString(`x${i}`) % 100;
          const y = hashString(`y${i}`) % 100;
          const s = 18 + (hashString(`s${i}`) % 34);
          const o = 0.10 + (hashString(`o${i}`) % 18) / 100;
          const d = (hashString(`d${i}`) % 9000) / 1000;
          return (
            <div
              key={i}
              className="absolute rounded-full mb-float"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${s}px`,
                height: `${s}px`,
                opacity: o,
                background:
                  'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0.08), rgba(0,0,0,0.25))',
                filter: 'blur(0.2px)',
                animationDelay: `${d}s`,
              }}
            />
          );
        })}
      </div>

      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/35 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/customer')}
              className="shrink-0 rounded-2xl px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold shadow-[0_0_25px_rgba(255,255,255,0.08)] transition"
              aria-label={t('back_to_kiosk_aria')}
            >
              <span className="mr-2">←</span>
              {t('back_to_kiosk')}
            </button>

            <div>
              <div className="flex items-center gap-3">
                <div className="text-4xl md:text-5xl font-black tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-300 via-purple-200 to-pink-300 drop-shadow-[0_0_30px_rgba(236,72,153,0.25)]">
                    {t('menu_board_title')}
                  </span>
                </div>
                <span className="hidden md:inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold bg-white/10 border border-white/10">
                  LIVE MENU
                </span>
              </div>
              <p className="text-white/75 text-sm md:text-base">
                {t('menu_board_subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-2xl px-4 py-2 text-sm font-extrabold bg-white/10 border border-white/12">
              {t('menu_items_count', { count: products.length })}
            </span>
            <span className="rounded-2xl px-4 py-2 text-sm font-extrabold bg-white/10 border border-white/12">
              {t('menu_popular_count', { count: popular.length })}
            </span>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-5 py-3">
            <div className="overflow-hidden rounded-2xl bg-white/5 border border-white/10">
              <div
                ref={marqueeRef}
                className="whitespace-nowrap flex gap-2 py-2 px-2 mb-marquee"
                style={{ width: '200%' }}
              >
                {[...chips, ...chips].map(({ id, label, theme }, idx) => (
                  <button
                    key={`${id}-${idx}`}
                    onClick={() => scrollToCategory(id)}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold border border-white/10 bg-white/10 hover:bg-white/15 transition"
                    style={{ boxShadow: '0 0 20px rgba(255,255,255,0.06)' }}
                  >
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full"
                      style={{ background: `linear-gradient(135deg, ${theme.accentFrom}, ${theme.accentTo})` }}
                    >
                      {theme.icon}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-8">
        <section className="mb-10">
          <div className="rounded-[28px] border border-white/10 bg-white/5 overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-6 items-stretch">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white/10 border border-white/10 text-sm font-extrabold">
                  <span className="text-yellow-300">★</span> POPULAR SPOTLIGHT
                </div>

                <h2 className="mt-4 text-3xl md:text-4xl font-black leading-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-fuchsia-100 to-pink-200">
                    {spotlight
                      ? translateProduct(spotlight.name, spotlight.description ?? '', i18n.language).name
                      : t('popular')}
                  </span>
                </h2>

                <p className="mt-3 text-white/75 text-base md:text-lg mb-clamp-3">
                  {spotlight
                    ? translateProduct(spotlight.name, spotlight.description ?? '', i18n.language).description
                    : t('menu_footer_note')}
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <div className="rounded-2xl px-5 py-3 bg-white/10 border border-white/12 text-lg font-black">
                    {spotlight ? formatMoneyUSD(spotlight.base_price, locale) : ''}
                  </div>
                  <div className="text-white/60 text-sm">
                    {spotlight ? translateCategory(spotlight.category, i18n.language) : ''}
                  </div>
                </div>
              </div>

              <div className="lg:w-[460px]">
                {spotlight ? (
                  <div className="relative rounded-[24px] overflow-hidden border border-white/10 bg-white/5">
                    <img
                      src={productImageDataUri(spotlight, themeForCategory(spotlight.category))}
                      alt={spotlight.name}
                      className="w-full h-[240px] md:h-[300px] object-cover"
                      draggable={false}
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/35 via-transparent to-white/10" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div className="rounded-2xl px-4 py-2 bg-black/35 border border-white/10 backdrop-blur">
                        <div className="text-xs font-extrabold text-white/80">TRY THIS</div>
                        <div className="text-base font-black">
                          {translateProduct(spotlight.name, spotlight.description ?? '', i18n.language).name}
                        </div>
                      </div>
                      <div className="rounded-2xl px-4 py-2 bg-white/10 border border-white/12 backdrop-blur text-sm font-extrabold">
                        ★ POPULAR
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-white/10 bg-white/5 h-[240px] md:h-[300px] flex items-center justify-center text-white/60">
                    {t('loading')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="text-white/75 text-lg">{t('loading')}</div>
        ) : grouped.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-8">
            <div className="text-2xl font-black">{t('menu_no_results_title')}</div>
            <p className="mt-2 text-white/70">{t('menu_no_results_subtitle')}</p>
          </div>
        ) : (
          <div className="space-y-14">
            {grouped.map(([category, items]) => {
              const id = slugify(category);
              const theme = themeForCategory(category);
              const translatedCategory = translateCategory(category, i18n.language);

              return (
                <section key={category} id={`cat-${id}`} className="scroll-mt-44">
                  <div
                    className={`rounded-[30px] border border-white/10 overflow-hidden ${theme.glow}`}
                    style={{ background: `linear-gradient(135deg, ${theme.accentFrom}22, ${theme.accentTo}14)` }}
                  >
                    <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black"
                          style={{ background: `linear-gradient(135deg, ${theme.accentFrom}, ${theme.accentTo})` }}
                        >
                          {theme.icon}
                        </div>
                        <div>
                          <h3 className="text-2xl md:text-3xl font-black tracking-tight">{translatedCategory}</h3>
                          <p className="text-white/75 text-sm md:text-base">
                            {t('menu_category_count', { count: items.length })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 pb-6 md:px-8 md:pb-8 flex flex-wrap gap-2">
                      {items.slice(0, 4).map((p) => {
                        const tt = translateProduct(p.name, p.description ?? '', i18n.language);
                        return (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold border border-white/10 bg-white/10"
                          >
                            <span className="opacity-90">•</span>
                            <span className="mb-clamp-2">{tt.name}</span>
                          </span>
                        );
                      })}
                      {items.length > 4 && (
                        <span className="inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold border border-white/10 bg-white/5 text-white/80">
                          +{items.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {items.map((p) => {
                      const tt = translateProduct(p.name, p.description ?? '', i18n.language);
                      const price = formatMoneyUSD(p.base_price, locale);
                      const imageSrc = productImageDataUri(p, theme);

                      return (
                        <div
                          key={p.id}
                          className="group rounded-[26px] overflow-hidden border border-white/10 bg-white/5 hover:bg-white/7 transition"
                          style={{ boxShadow: '0 0 40px rgba(0,0,0,0.35)' }}
                        >
                          <div className="relative">
                            <img
                              src={imageSrc}
                              alt={tt.name}
                              className="w-full h-[170px] object-cover"
                              draggable={false}
                            />
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-black/35 via-transparent to-white/10" />

                            <div className="absolute top-3 right-3 rounded-full px-4 py-2 bg-black/35 border border-white/10 backdrop-blur text-sm font-black">
                              {price}
                            </div>

                            {p.is_popular && (
                              <div className="absolute top-3 left-3 rounded-full px-4 py-2 bg-yellow-300/20 border border-yellow-200/20 backdrop-blur text-sm font-black">
                                ★ {t('popular')}
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <div className="text-base font-black leading-snug">{tt.name}</div>

                            {tt.description && tt.description.trim().length > 0 ? (
                              <p className="mt-2 text-sm text-white/72 mb-clamp-3">{tt.description}</p>
                            ) : (
                              <p className="mt-2 text-sm text-white/45">
                                {i18n.language === 'es'
                                  ? 'Fresco, sabroso y hecho a pedido.'
                                  : 'Fresh, flavorful, and made to order.'}
                              </p>
                            )}

                            <div className="mt-4 flex items-center justify-between">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold border border-white/10 ${theme.chipBg} ${theme.chipText}`}
                              >
                                <span
                                  className="inline-block w-2.5 h-2.5 rounded-full"
                                  style={{ background: `linear-gradient(135deg, ${theme.accentFrom}, ${theme.accentTo})` }}
                                />
                                {translateCategory(p.category, i18n.language)}
                              </span>

                              <button
                                onClick={() => scrollToCategory(id)}
                                className="text-xs font-extrabold text-white/70 hover:text-white transition"
                                title="Jump to category"
                              >
                                ↟
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <footer className="mt-12 text-center text-white/45 text-sm">
          {t('menu_footer_note')}
        </footer>
      </main>
    </div>
  );
};
