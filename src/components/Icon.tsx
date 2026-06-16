import type { ComponentType, SVGProps } from 'react';
import {
  ArrowUpRight,
  Camera,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clapperboard,
  Clock,
  Coffee,
  Compass,
  Dumbbell,
  Globe,
  Image as ImageIcon,
  KeyRound,
  Landmark,
  List,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Music,
  Phone,
  Quote,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Trees,
  Utensils,
  Waypoints,
  Wine,
  X,
} from 'lucide-react';

/**
 * Central registry mapping semantic names to a single, consistent SF
 * Symbol-style line-icon set (lucide). Using one source keeps stroke weight,
 * corner radii, and optical sizing uniform across the whole app — the hallmark
 * of a polished iOS interface.
 */
const REGISTRY = {
  // App categories
  restaurant: Utensils,
  cafe: Coffee,
  bar: Wine,
  park: Trees,
  museum: Landmark,
  movie_theater: Clapperboard,
  shopping_mall: ShoppingBag,
  tourist_attraction: Camera,
  night_club: Music,
  gym: Dumbbell,

  // Interface
  brand: Waypoints,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  locate: LocateFixed,
  star: Star,
  close: X,
  directions: ArrowUpRight,
  phone: Phone,
  globe: Globe,
  list: List,
  map: MapIcon,
  mapFilled: MapIcon,
  pin: MapPin,
  search: Search,
  clock: Clock,
  radius: SlidersHorizontal,
  photo: ImageIcon,
  quote: Quote,
  compass: Compass,
  key: KeyRound,
} satisfies Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

export type IconName = keyof typeof REGISTRY;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'ref'> {
  name: IconName;
  /** Pixel size (width = height). iOS optical sizes: 16 / 18 / 20 / 22 / 28. */
  size?: number;
  /** Stroke weight. iOS line glyphs read well around 1.6–2. */
  strokeWidth?: number;
  /** Fill the glyph (used for active stars, filled tab icons). */
  filled?: boolean;
}

/** A single, uniformly-styled icon. */
export function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
  filled = false,
  ...rest
}: IconProps) {
  const Glyph = REGISTRY[name];
  return (
    <Glyph
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      fill={filled ? 'currentColor' : 'none'}
      aria-hidden="true"
      focusable="false"
      {...rest}
    />
  );
}
