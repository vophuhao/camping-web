import React from 'react';

export type Terrain =
  | 'mountain'
  | 'beach'
  | 'forest'
  | 'river'
  | 'lake'
  | 'field'
  | 'other';

const TERRAIN_CONFIG: Record<
  Terrain,
  { label: string; emoji: string; color: string; bg: string }
> = {
  mountain: { label: 'Núi', emoji: '🏔️', color: '#6b7280', bg: '#f3f4f6' },
  beach:    { label: 'Biển', emoji: '🏖️', color: '#0ea5e9', bg: '#e0f2fe' },
  forest:   { label: 'Rừng', emoji: '🌲', color: '#16a34a', bg: '#dcfce7' },
  river:    { label: 'Sông', emoji: '🏞️', color: '#2563eb', bg: '#dbeafe' },
  lake:     { label: 'Hồ',   emoji: '💧', color: '#0891b2', bg: '#cffafe' },
  field:    { label: 'Đồng', emoji: '🌾', color: '#ca8a04', bg: '#fef9c3' },
  other:    { label: 'Khác', emoji: '📍', color: '#9333ea', bg: '#f3e8ff' },
};

export default function TerrainBadge({
  terrain,
  size = 'sm',
}: {
  terrain: Terrain;
  size?: 'sm' | 'md';
}) {
  const cfg = TERRAIN_CONFIG[terrain] ?? TERRAIN_CONFIG.other;
  const padding = size === 'sm' ? '2px 8px' : '4px 12px';
  const fontSize = size === 'sm' ? '11px' : '13px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding,
        borderRadius: 99,
        fontSize,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}33`,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.emoji} {cfg.label}
    </span>
  );
}
