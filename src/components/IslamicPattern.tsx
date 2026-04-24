/**
 * IslamicPattern — Geometric 8-pointed star tiling overlay.
 * Pre-computed at module level for performance. Uses SVG <Pattern>
 * for native tiling — only one Path element regardless of screen size.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, {
  Defs,
  Path,
  Rect,
  Pattern,
} from 'react-native-svg';
import { Colors } from '../theme/DesignSystem';

// ── Pre-computed tile geometry (runs once at import) ────────────────────────

const CELL = 40; // tile unit size
const CX = CELL / 2;
const CY = CELL / 2;
const OUTER_R = CELL * 0.40; // 8-pointed star outer radius
const INNER_R = CELL * 0.22; // inner radius

/**
 * 8-pointed star: 16-point polygon alternating outer/inner radii.
 * Same maths as CelestialScreen's fivePointStar, but 8 points.
 */
function buildStarPath(cx: number, cy: number, outerR: number, innerR: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI * 2 * i) / 16 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(' ') + ' Z';
}

// Single 8-pointed star centered in the tile cell
const STAR_D = buildStarPath(CX, CY, OUTER_R, INNER_R);

// Small connecting diamonds at tile edges to create the interlocking effect
const EDGE_SIZE = CELL * 0.10;
const EDGE_DIAMONDS = [
  // Top edge center
  `M ${CX} 0 L ${CX + EDGE_SIZE} ${EDGE_SIZE} L ${CX} ${EDGE_SIZE * 2} L ${CX - EDGE_SIZE} ${EDGE_SIZE} Z`,
  // Bottom edge center
  `M ${CX} ${CELL} L ${CX + EDGE_SIZE} ${CELL - EDGE_SIZE} L ${CX} ${CELL - EDGE_SIZE * 2} L ${CX - EDGE_SIZE} ${CELL - EDGE_SIZE} Z`,
  // Left edge center
  `M 0 ${CY} L ${EDGE_SIZE} ${CY - EDGE_SIZE} L ${EDGE_SIZE * 2} ${CY} L ${EDGE_SIZE} ${CY + EDGE_SIZE} Z`,
  // Right edge center
  `M ${CELL} ${CY} L ${CELL - EDGE_SIZE} ${CY - EDGE_SIZE} L ${CELL - EDGE_SIZE * 2} ${CY} L ${CELL - EDGE_SIZE} ${CY + EDGE_SIZE} Z`,
].join(' ');

const TILE_D = STAR_D + ' ' + EDGE_DIAMONDS;

// ── Component ───────────────────────────────────────────────────────────────

interface IslamicPatternProps {
  opacity?: number;
  color?: string;
}

function IslamicPatternInner({
  opacity = 0.04,
  color = Colors.accent.secondary,
}: IslamicPatternProps) {
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <Pattern
          id="islamicTile"
          width={CELL}
          height={CELL}
          patternUnits="userSpaceOnUse"
        >
          <Path d={TILE_D} fill={color} fillRule="evenodd" />
        </Pattern>
      </Defs>
      <Rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#islamicTile)"
        opacity={opacity}
      />
    </Svg>
  );
}

export const IslamicPattern = React.memo(IslamicPatternInner);
