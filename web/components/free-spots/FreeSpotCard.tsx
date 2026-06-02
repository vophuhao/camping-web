/* eslint-disable @next/next/no-img-element */
'use client';

import { Heart, Eye, MapPin, User } from 'lucide-react';
import Link from 'next/link';
import type { FreeSpot } from '@/lib/free-spot-api';
import TerrainBadge from './TerrainBadge';

interface Props {
  spot: FreeSpot;
  highlighted?: boolean;
  onHover?: (id: string | null) => void;
}

export default function FreeSpotCard({ spot, highlighted, onHover }: Props) {
  const thumb = spot.images?.[0];
  const lat = spot.location?.coordinates?.[1];
  const lng = spot.location?.coordinates?.[0];

  return (
    <Link href={`/free-spots/${spot._id}`} legacyBehavior>
      <a
        className="free-spot-card"
        data-highlighted={highlighted}
        onMouseEnter={() => onHover?.(spot._id)}
        onMouseLeave={() => onHover?.(null)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--card)',
          border: highlighted
            ? '2px solid #10b981'
            : '1px solid var(--border)',
          boxShadow: highlighted
            ? '0 0 0 3px #10b98133'
            : '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        {/* Thumbnail */}
        <div style={{ position: 'relative', height: 180, background: '#e5e7eb', flexShrink: 0 }}>
          {thumb ? (
            <img
              src={thumb}
              alt={spot.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 40,
                color: '#9ca3af',
              }}
            >
              🏕️
            </div>
          )}
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <TerrainBadge terrain={spot.terrain} size="sm" />
          </div>
          {spot.isVerified && (
            <div
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: '#10b981',
                color: '#fff',
                borderRadius: 99,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              ✓ Xác minh
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.3,
              color: 'var(--foreground)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {spot.title}
          </h3>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: 'var(--muted-foreground)',
            }}
          >
            <MapPin size={12} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {spot.address}, {spot.city}
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--muted-foreground)',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flex: 1,
            }}
          >
            {spot.description}
          </p>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 8,
              borderTop: '1px solid var(--border)',
            }}
          >
            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {spot.author?.avatarUrl ? (
                <img
                  src={spot.author.avatarUrl}
                  alt={spot.author.username}
                  style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={12} color="#fff" />
                </div>
              )}
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 500 }}>
                {spot.author?.username}
              </span>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 12,
                  color: '#ef4444',
                }}
              >
                <Heart size={12} fill="#ef4444" />
                {spot.likeCount ?? 0}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 12,
                  color: 'var(--muted-foreground)',
                }}
              >
                <Eye size={12} />
                {spot.viewCount ?? 0}
              </span>
            </div>
          </div>
        </div>
      </a>
    </Link>
  );
}
