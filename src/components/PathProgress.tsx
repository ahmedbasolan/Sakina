import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SpiritualPath } from '../types';
import { Colors } from '../theme/DesignSystem';

interface PathProgressProps {
  path: SpiritualPath;
  completedDays: number[];
  accentColor: string;
}

/**
 * Progress-through-a-path indicator, shared by PathDetailScreen and
 * PathCompletionCelebration so the two don't drift into separate
 * implementations. Short paths (no `phases`) get a row of per-day dots;
 * long, phase-tiered paths (e.g. the 90-day path) get one labeled bar per
 * phase instead — a 90-dot row wraps into several rows of indistinguishable
 * dots and stops being a readable at-a-glance signal.
 */
export function PathProgress({ path, completedDays, accentColor }: PathProgressProps) {
  if (path.phases) {
    return (
      <View style={styles.phaseBarsContainer}>
        {path.phases.map((phase) => {
          const phaseDays = phase.endDay - phase.startDay + 1;
          // Count days actually inside this phase's range, not an offset
          // from a running total — that breaks if a phase isn't contiguous.
          const doneInPhase = completedDays.filter(
            (d) => d >= phase.startDay && d <= phase.endDay,
          ).length;
          const pct = doneInPhase / phaseDays;
          return (
            <View key={phase.label} style={styles.phaseBarRow}>
              <Text style={styles.phaseBarLabel} numberOfLines={1}>
                {phase.label.split(' — ')[0]}
              </Text>
              <View style={styles.phaseBarTrack}>
                <View
                  style={[
                    styles.phaseBarFill,
                    { flex: Math.max(pct, 0.001), backgroundColor: accentColor },
                  ]}
                />
                <View style={{ flex: Math.max(1 - pct, 0.001) }} />
              </View>
              <Text style={[styles.phaseBarCount, { color: accentColor }]}>
                {doneInPhase}/{phaseDays}
              </Text>
            </View>
          );
        })}
      </View>
    );
  }

  const total = path.duration;
  const nextDay = completedDays.length + 1;
  const days = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <View style={styles.dotRow}>
      {days.map((day) => {
        const done = completedDays.includes(day);
        const isNext = !done && day === nextDay;
        return (
          <View
            key={day}
            style={[
              styles.dot,
              {
                backgroundColor: done
                  ? accentColor
                  : isNext
                    ? `${accentColor}55`
                    : 'rgba(255,255,255,0.1)',
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  phaseBarsContainer: {
    gap: 10,
    width: '100%',
  },
  phaseBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phaseBarLabel: {
    fontSize: 11,
    color: `${Colors.text.primary}AD`,
    fontWeight: '600',
    letterSpacing: 0.5,
    width: 90,
  },
  phaseBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  phaseBarFill: {
    borderRadius: 2.5,
  },
  phaseBarCount: {
    fontSize: 11,
    fontWeight: '700',
    width: 34,
    textAlign: 'right',
  },
});
