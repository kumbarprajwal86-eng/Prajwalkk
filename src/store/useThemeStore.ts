import { create } from 'zustand';

export type AppTheme = 
  | 'avone'
  | 'wolmart'
  | 'vegist'
  | 'dark' 
  | 'antigravity' 
  | 'cyberpunk' 
  | 'emerald' 
  | 'midnight' 
  | 'obsidian' 
  | 'amethyst'
  | 'tokyo-neon'
  | 'nordic-frost'
  | 'crimson-velvet'
  | 'rose-pastel'
  | 'solarized-light' 
  | 'light';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  description: string;
  badge: string;
  bgGradient: string;
  accentColor: string;
  previewBg: string;
  previewCard: string;
  previewAccent: string;
  iconName: 'sparkles' | 'zap' | 'terminal' | 'compass' | 'moon' | 'sun-medium' | 'moon-star' | 'sun';
  isFuturistic?: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'avone',
    name: 'Avone Minimalist Studio',
    description: 'Sleek fashion-studio luxury aesthetic with rose-gold highlights, warm champagne dark canvas, and luxury card borders',
    badge: 'Luxury Studio',
    bgGradient: 'from-[#E8A598] to-[#E0A96D]',
    accentColor: '#E8A598',
    previewBg: '#0F0E13',
    previewCard: '#181620',
    previewAccent: '#E0A96D',
    iconName: 'sparkles',
    isFuturistic: true,
  },
  {
    id: 'wolmart',
    name: 'Wolmart Marketplace',
    description: 'Energetic multi-vendor video marketplace with royal cobalt blue, bright amber gold, and high-density store cards',
    badge: 'Marketplace',
    bgGradient: 'from-[#3A86FF] to-[#FFB703]',
    accentColor: '#3A86FF',
    previewBg: '#0B132B',
    previewCard: '#1C2541',
    previewAccent: '#FFB703',
    iconName: 'zap',
    isFuturistic: true,
  },
  {
    id: 'vegist',
    name: 'Vegist Organic Fresh',
    description: 'Vibrant eco-fresh organic theme with botanical dark canvas, lush leaf green & neon mint highlights',
    badge: 'Eco Organic',
    bgGradient: 'from-[#10B981] to-[#84CC16]',
    accentColor: '#10B981',
    previewBg: '#071711',
    previewCard: '#0E291E',
    previewAccent: '#84CC16',
    iconName: 'compass',
    isFuturistic: true,
  },
  {
    id: 'antigravity',
    name: 'Antigravity Cosmic',
    description: 'Zero-gravity futuristic deep space with neon cyan & electric violet glow',
    badge: 'Futuristic AI Choice',
    bgGradient: 'from-[#00F2FE] to-[#7F00FF]',
    accentColor: '#00F2FE',
    previewBg: '#060913',
    previewCard: '#0D1424',
    previewAccent: '#00F2FE',
    iconName: 'sparkles',
    isFuturistic: true,
  },
  {
    id: 'tokyo-neon',
    name: 'Tokyo Cyber Night',
    description: 'Shibuya midnight dark mode with electric cyan & hot pink laser lighting',
    badge: 'High Contrast',
    bgGradient: 'from-[#00F0FF] to-[#FF0055]',
    accentColor: '#00F0FF',
    previewBg: '#0A0E17',
    previewCard: '#121929',
    previewAccent: '#00F0FF',
    iconName: 'zap',
    isFuturistic: true,
  },
  {
    id: 'amethyst',
    name: 'Amethyst Sunset',
    description: 'Royal deep violet canvas with glowing magenta sunset & lavender aura',
    badge: 'Vibrant Glow',
    bgGradient: 'from-[#9D4EDD] to-[#FF007F]',
    accentColor: '#C77DFF',
    previewBg: '#140824',
    previewCard: '#211038',
    previewAccent: '#FF007F',
    iconName: 'sparkles',
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Ice Frost',
    description: 'Arctic glacier deep navy canvas with iceberg blue & frosted mint accents',
    badge: 'Cool Minimal',
    bgGradient: 'from-[#00B4D8] to-[#90E0EF]',
    accentColor: '#00B4D8',
    previewBg: '#0A192F',
    previewCard: '#112240',
    previewAccent: '#64FFDA',
    iconName: 'compass',
  },
  {
    id: 'crimson-velvet',
    name: 'Crimson Velvet',
    description: 'Rich dark mahogany canvas with ruby red glow & warm gold highlights',
    badge: 'Luxury Dark',
    bgGradient: 'from-[#E63946] to-[#9B2226]',
    accentColor: '#E63946',
    previewBg: '#1A080C',
    previewCard: '#2A0E14',
    previewAccent: '#E63946',
    iconName: 'moon',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Pitch-black cyberpunk canvas with laser cyan, hot pink & neon glow',
    badge: 'Cyberpunk',
    bgGradient: 'from-[#FF007A] to-[#00F0FF]',
    accentColor: '#FF007A',
    previewBg: '#08080C',
    previewCard: '#10101A',
    previewAccent: '#FF007A',
    iconName: 'zap',
    isFuturistic: true,
  },
  {
    id: 'emerald',
    name: 'Matrix Emerald',
    description: 'Dark terminal matrix aesthetic with glowing mint & emerald glass',
    badge: 'Cyber Tech',
    bgGradient: 'from-[#10B981] to-[#00FF88]',
    accentColor: '#10B981',
    previewBg: '#040D08',
    previewCard: '#081A12',
    previewAccent: '#10B981',
    iconName: 'terminal',
  },
  {
    id: 'midnight',
    name: 'Midnight Sapphire',
    description: 'Deep ocean sapphire canvas with royal indigo & electric blue highlights',
    badge: 'Deep Ocean',
    bgGradient: 'from-[#3A86FF] to-[#38BDF8]',
    accentColor: '#38BDF8',
    previewBg: '#0A1128',
    previewCard: '#101B3D',
    previewAccent: '#38BDF8',
    iconName: 'compass',
  },
  {
    id: 'obsidian',
    name: 'Pure Obsidian OLED',
    description: 'Ultra dark true OLED black canvas with silver white & ruby red accents',
    badge: 'OLED Battery Saver',
    bgGradient: 'from-[#EF4444] to-[#991B1B]',
    accentColor: '#EF4444',
    previewBg: '#000000',
    previewCard: '#0A0A0A',
    previewAccent: '#EF4444',
    iconName: 'moon',
  },
  {
    id: 'rose-pastel',
    name: 'Rose Quartz Pastel',
    description: 'Soft aesthetic pastel blush pink canvas with warm lavender & cream contrast',
    badge: 'Pastel Light',
    bgGradient: 'from-[#FFB7B2] to-[#E2F0CB]',
    accentColor: '#E63946',
    previewBg: '#FFF0F5',
    previewCard: '#F8E1E7',
    previewAccent: '#D8B4F8',
    iconName: 'sun',
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    description: 'Warm cream retro developer palette with solarized blue, teal & golden yellow',
    badge: 'Developer Classic',
    bgGradient: 'from-[#B58900] to-[#268BD2]',
    accentColor: '#268BD2',
    previewBg: '#FDF6E3',
    previewCard: '#EEE8D5',
    previewAccent: '#268BD2',
    iconName: 'sun-medium',
  },
  {
    id: 'dark',
    name: 'Dark Twilight',
    description: 'VIEWPOINT signature twilight dark glassmorphism default canvas',
    badge: 'Classic Dark',
    bgGradient: 'from-[#818CF8] to-[#FF4D6D]',
    accentColor: '#818CF8',
    previewBg: '#0D1117',
    previewCard: '#161B26',
    previewAccent: '#818CF8',
    iconName: 'moon-star',
  },
  {
    id: 'light',
    name: 'Clean Sunlight',
    description: 'Crisp, high-readability bright minimalist daylight experience',
    badge: 'Light Mode',
    bgGradient: 'from-[#3B82F6] to-[#60A5FA]',
    accentColor: '#2563EB',
    previewBg: '#F8FAFC',
    previewCard: '#FFFFFF',
    previewAccent: '#2563EB',
    iconName: 'sun',
  },
];

export const applyThemeToDocument = (theme: AppTheme) => {
  if (typeof document === 'undefined') return;
  const allThemes: AppTheme[] = [
    'avone', 'wolmart', 'vegist',
    'dark', 'antigravity', 'cyberpunk', 'emerald', 'midnight', 'obsidian',
    'amethyst', 'tokyo-neon', 'nordic-frost', 'crimson-velvet', 'rose-pastel',
    'solarized-light', 'light'
  ];
  allThemes.forEach((t) => document.documentElement.classList.remove(t));
  document.documentElement.classList.add(theme);
  document.documentElement.setAttribute('data-theme', theme);
};

interface ThemeState {
  theme: AppTheme;
  ambientGlow: boolean;
  glassOpacity: 'high' | 'medium' | 'minimal';
  theaterMode: boolean;
  autoPlay: boolean;
  historyPaused: boolean;
  playbackSpeed: number;
  quality: string;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;
  toggleAmbientGlow: () => void;
  setGlassOpacity: (opacity: 'high' | 'medium' | 'minimal') => void;
  toggleTheaterMode: () => void;
  toggleAutoPlay: () => void;
  toggleHistoryPaused: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setQuality: (quality: string) => void;
}

const initialTheme = (localStorage.getItem('viewpoint_theme') as AppTheme) || 'dark';
const initialGlow = localStorage.getItem('viewpoint_ambient_glow') !== 'false';
const initialGlass = (localStorage.getItem('viewpoint_glass') as 'high' | 'medium' | 'minimal') || 'high';

applyThemeToDocument(initialTheme);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initialTheme,
  ambientGlow: initialGlow,
  glassOpacity: initialGlass,
  theaterMode: false,
  autoPlay: true,
  historyPaused: false,
  playbackSpeed: 1,
  quality: '2160p 4K UHD',

  toggleTheme: () => set((state) => {
    const next: AppTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('viewpoint_theme', next);
    applyThemeToDocument(next);
    return { theme: next };
  }),

  setTheme: (theme) => set(() => {
    localStorage.setItem('viewpoint_theme', theme);
    applyThemeToDocument(theme);
    return { theme };
  }),

  toggleAmbientGlow: () => set((state) => {
    const next = !state.ambientGlow;
    localStorage.setItem('viewpoint_ambient_glow', String(next));
    return { ambientGlow: next };
  }),

  setGlassOpacity: (glassOpacity) => set(() => {
    localStorage.setItem('viewpoint_glass', glassOpacity);
    return { glassOpacity };
  }),

  toggleTheaterMode: () => set((state) => ({ theaterMode: !state.theaterMode })),
  toggleAutoPlay: () => set((state) => ({ autoPlay: !state.autoPlay })),
  toggleHistoryPaused: () => set((state) => ({ historyPaused: !state.historyPaused })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setQuality: (quality) => set({ quality }),
}));

