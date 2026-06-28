import React from 'react';
import Svg, { Path, Circle, Polyline, Line, Rect, Polygon } from 'react-native-svg';

export interface IconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  style?: any;
}

const BaseIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, style, children }: IconProps & { children: React.ReactNode }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </Svg>
);

export const DownloadIcon = (p: IconProps) => <BaseIcon {...p}><Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><Polyline points="7 10 12 15 17 10" /><Line x1="12" x2="12" y1="15" y2="3" /></BaseIcon>;
export const SmartphoneIcon = (p: IconProps) => <BaseIcon {...p}><Rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><Path d="M12 18h.01" /></BaseIcon>;
export const PaletteIcon = (p: IconProps) => <BaseIcon {...p}><Circle cx="13.5" cy="6.5" r=".5" fill={p.color || "currentColor"} /><Circle cx="17.5" cy="10.5" r=".5" fill={p.color || "currentColor"} /><Circle cx="8.5" cy="7.5" r=".5" fill={p.color || "currentColor"} /><Circle cx="6.5" cy="12.5" r=".5" fill={p.color || "currentColor"} /><Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.53-.21-1.04-.59-1.41-.38-.38-.59-.88-.59-1.41 0-1.1.9-2 2-2h1.17c3.31 0 6-2.69 6-6 0-5.52-4.48-10-10-10z" /></BaseIcon>;
export const ImageIcon = (p: IconProps) => <BaseIcon {...p}><Rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><Circle cx="9" cy="9" r="2" /><Path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></BaseIcon>;
export const TypeIcon = (p: IconProps) => <BaseIcon {...p}><Polyline points="4 7 4 4 20 4 20 7" /><Line x1="9" x2="15" y1="20" y2="20" /><Line x1="12" x2="12" y1="4" y2="20" /></BaseIcon>;
export const GridIcon = (p: IconProps) => <BaseIcon {...p}><Rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><Line x1="3" x2="21" y1="9" y2="9" /><Line x1="3" x2="21" y1="15" y2="15" /><Line x1="9" x2="9" y1="3" y2="21" /><Line x1="15" x2="15" y1="3" y2="21" /></BaseIcon>;
export const XIcon = (p: IconProps) => <BaseIcon {...p}><Line x1="18" x2="6" y1="6" y2="18" /><Line x1="6" x2="18" y1="6" y2="18" /></BaseIcon>;
export const ChevronRightIcon = (p: IconProps) => <BaseIcon {...p}><Polyline points="9 18 15 12 9 6" /></BaseIcon>;
export const CheckIcon = (p: IconProps) => <BaseIcon {...p}><Polyline points="20 6 9 17 4 12" /></BaseIcon>;
export const RefreshCwIcon = (p: IconProps) => <BaseIcon {...p}><Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><Path d="M3 3v5h5" /></BaseIcon>;
export const PlusIcon = (p: IconProps) => <BaseIcon {...p}><Line x1="12" x2="12" y1="5" y2="19" /><Line x1="5" x2="19" y1="12" y2="12" /></BaseIcon>;
export const ArrowRightIcon = (p: IconProps) => <BaseIcon {...p}><Path d="M5 12h14" /><Path d="m12 5 7 7-7 7" /></BaseIcon>;
export const SkipForwardIcon = (p: IconProps) => <BaseIcon {...p}><Polygon points="5 4 15 12 5 20 5 4" /><Line x1="19" x2="19" y1="5" y2="19" /></BaseIcon>;
export const CheckCircle2Icon = (p: IconProps) => <BaseIcon {...p}><Circle cx="12" cy="12" r="10" /><Path d="m9 12 2 2 4-4" /></BaseIcon>;
export const CircleIcon = (p: IconProps) => <BaseIcon {...p}><Circle cx="12" cy="12" r="10" /></BaseIcon>;
export const PlusCircleIcon = (p: IconProps) => <BaseIcon {...p}><Circle cx="12" cy="12" r="10" /><Path d="M8 12h8" /><Path d="M12 8v8" /></BaseIcon>;
export const QuoteIcon = (p: IconProps) => <BaseIcon {...p}><Path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1.5l-1.5 8h3l1.5-8V5a2 2 0 0 0-2-2z" /><Path d="M6 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1.5l-1.5 8h3l1.5-8V5a2 2 0 0 0-2-2z" /></BaseIcon>;
export const TargetIcon = (p: IconProps) => <BaseIcon {...p}><Circle cx="12" cy="12" r="10" /><Circle cx="12" cy="12" r="6" /><Circle cx="12" cy="12" r="2" /></BaseIcon>;
export const RepeatIcon = (p: IconProps) => <BaseIcon {...p}><Path d="m17 2 4 4-4 4" /><Path d="M3 11v-1a4 4 0 0 1 4-4h14" /><Path d="m7 22-4-4 4-4" /><Path d="M21 13v1a4 4 0 0 1-4 4H3" /></BaseIcon>;
export const MoreVerticalIcon = (p: IconProps) => <BaseIcon {...p}><Circle cx="12" cy="12" r="1" /><Circle cx="12" cy="5" r="1" /><Circle cx="12" cy="19" r="1" /></BaseIcon>;
export const CalendarDaysIcon = (p: IconProps) => <BaseIcon {...p}><Rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><Line x1="16" x2="16" y1="2" y2="6" /><Line x1="8" x2="8" y1="2" y2="6" /><Line x1="3" x2="21" y1="10" y2="10" /><Path d="M8 14h.01" /><Path d="M12 14h.01" /><Path d="M16 14h.01" /><Path d="M8 18h.01" /><Path d="M12 18h.01" /><Path d="M16 18h.01" /></BaseIcon>;
export const ChevronLeftIcon = (p: IconProps) => <BaseIcon {...p}><Polyline points="15 18 9 12 15 6" /></BaseIcon>;
export const ClockIcon = (p: IconProps) => <BaseIcon {...p}><Circle cx="12" cy="12" r="10" /><Polyline points="12 6 12 12 16 14" /></BaseIcon>;
export const LogOutIcon = (p: IconProps) => <BaseIcon {...p}><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><Polyline points="16 17 21 12 16 7" /><Line x1="21" x2="9" y1="12" y2="12" /></BaseIcon>;
export const Trash2Icon = (p: IconProps) => <BaseIcon {...p}><Path d="M3 6h18" /><Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><Line x1="10" x2="10" y1="11" y2="17" /><Line x1="14" x2="14" y1="11" y2="17" /></BaseIcon>;
export const StarIcon = (p: IconProps) => <BaseIcon {...p}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></BaseIcon>;
export const FlameIcon = (p: IconProps) => <BaseIcon {...p}><Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></BaseIcon>;
export const CalendarIcon = (p: IconProps) => <BaseIcon {...p}><Rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><Line x1="16" x2="16" y1="2" y2="6" /><Line x1="8" x2="8" y1="2" y2="6" /><Line x1="3" x2="21" y1="10" y2="10" /></BaseIcon>;
export const CloseEyeIcon = (p: IconProps) => <BaseIcon {...p}><Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><Line x1="1" y1="1" x2="23" y2="23" /></BaseIcon>;
export const OpenEyeIcon = (p: IconProps) => <BaseIcon {...p}><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /></BaseIcon>;
