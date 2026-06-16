import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAppTheme } from '../contexts/ThemeContext';
import type { Achievement } from '../services/db';

// Rarity system
const getRarity = (xpReward: number): { label: string; color: string; bgGlow: string } => {
  if (xpReward >= 200) return { label: 'LEGENDARY', color: '#f59e0b', bgGlow: 'rgba(245, 158, 11, 0.12)' };
  if (xpReward >= 100) return { label: 'EPIC', color: '#a855f7', bgGlow: 'rgba(168, 85, 247, 0.10)' };
  if (xpReward >= 50) return { label: 'RARE', color: '#3b82f6', bgGlow: 'rgba(59, 130, 246, 0.08)' };
  return { label: 'COMMON', color: '#64748b', bgGlow: 'transparent' };
};

export const Achievements: React.FC = () => {
  const { achievements, profile, workoutSessions } = useApp();
  const { theme } = useAppTheme();
  const [selectedBadge, setSelectedBadge] = useState<Achievement | null>(null);

  const getProgressInfo = (id: string) => {
    if (!profile) return { current: 0, target: 1, percentage: 0 };
    switch (id) {
      case 'streak_30':
        return { current: profile.streak, target: 30, percentage: Math.min(100, (profile.streak / 30) * 100) };
      case 'squat_100': {
        let maxSquat = 0;
        workoutSessions.forEach(s => {
          s.sets.forEach(set => {
            if (set.completed && set.exercise_name.toLowerCase().includes('squat')) {
              maxSquat = Math.max(maxSquat, set.weight);
            }
          });
        });
        return { current: maxSquat, target: 100, percentage: Math.min(100, (maxSquat / 100) * 100) };
      }
      default:
        return { current: 0, target: 1, percentage: 0 };
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* HEADER */}
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 ${
        theme === 'FORGE' ? 'border-[#1e293b]' : 'border-white/[0.06]'
      }`}>
        <div className="animate-fade-in-up">
          <p className="font-label text-[10px] text-primary/60 tracking-[0.3em] uppercase mb-2">
            {theme === 'FORGE' ? 'TROPHY ROOM' : 'HALL OF RECORDS'}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-on-background uppercase tracking-tight">
            Trophy Room
          </h1>
        </div>
        <div className="flex items-center gap-3 animate-fade-in-up stagger-1">
          <div className={`px-4 py-2.5 border ${theme === 'FORGE' ? 'border-[#1e293b] bg-[#0a0c0e]' : 'bg-white/[0.04] border-white/[0.08] rounded-xl'}`}>
            <span className="font-display text-lg font-bold text-primary">{unlockedCount}</span>
            <span className="font-label text-[8px] text-on-surface-variant tracking-widest ml-1.5">/ {achievements.length} UNLOCKED</span>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {achievements.map((a, i) => {
          const rarity = getRarity(a.xp_reward);
          const progress = getProgressInfo(a.id);
          return (
            <button
              key={a.id}
              onClick={() => a.unlocked && setSelectedBadge(a)}
              className={`p-5 flex flex-col items-center gap-3 border transition-all text-center relative overflow-hidden hover-lift press-scale animate-fade-in-up ${
                a.unlocked
                  ? theme === 'FORGE'
                    ? 'forge-panel cursor-pointer'
                    : 'ascend-card cursor-pointer'
                  : theme === 'FORGE'
                    ? 'bg-[#0a0c0e] border-[#1e293b]/50 opacity-50 cursor-default'
                    : 'bg-[#0c0816]/30 border-white/[0.04] opacity-50 cursor-default'
              }`}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              {/* Rarity glow (unlocked only) */}
              {a.unlocked && (
                <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 30%, ${rarity.bgGlow}, transparent 70%)` }} />
              )}

              {/* Icon */}
              <div className={`w-14 h-14 flex items-center justify-center relative z-10 ${
                a.unlocked
                  ? 'text-background'
                  : 'text-on-surface-variant/30'
              }`}
                style={a.unlocked ? {
                  background: `linear-gradient(135deg, ${rarity.color}dd, ${rarity.color}88)`,
                  borderRadius: theme === 'FORGE' ? '4px' : '50%',
                  boxShadow: `0 4px 16px ${rarity.color}33`
                } : {
                  background: theme === 'FORGE' ? '#141719' : 'rgba(255,255,255,0.03)',
                  borderRadius: theme === 'FORGE' ? '4px' : '50%',
                  border: `1px solid ${theme === 'FORGE' ? '#1e293b' : 'rgba(255,255,255,0.06)'}`
                }}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {a.unlocked ? a.icon : 'lock'}
                </span>
              </div>

              {/* Name */}
              <h3 className={`font-label text-[11px] font-bold uppercase tracking-wider relative z-10 leading-tight ${
                a.unlocked ? 'text-on-surface' : 'text-on-surface-variant/40'
              }`}>
                {a.unlocked ? a.name : '???'}
              </h3>

              {/* Rarity Tag */}
              <span className="font-label text-[7px] uppercase font-bold tracking-[0.2em] relative z-10"
                style={{ color: a.unlocked ? rarity.color : 'var(--color-on-surface-variant)' }}
              >
                {a.unlocked ? rarity.label : 'LOCKED'}
              </span>

              {/* Progress bar for locked trackable items */}
              {!a.unlocked && (a.id === 'streak_30' || a.id === 'squat_100') && (
                <div className="w-full relative z-10">
                  <div className={`w-full h-1 overflow-hidden ${theme === 'FORGE' ? 'bg-[#141719]' : 'bg-white/[0.06] rounded-full'}`}>
                    <div className="h-full bg-on-surface-variant/30 transition-all" style={{ width: `${progress.percentage}%` }} />
                  </div>
                  <span className="font-label text-[7px] text-on-surface-variant/30 mt-1 block">{progress.current}/{progress.target}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* DETAIL MODAL */}
      {selectedBadge && (() => {
        const rarity = getRarity(selectedBadge.xp_reward);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center cinematic-backdrop animate-fade-in" onClick={() => setSelectedBadge(null)}>
            <div
              className={`p-8 max-w-sm w-full mx-4 relative border animate-scale-in ${
                theme === 'FORGE' ? 'bg-[#0a0c0e] border-[#1e293b]' : 'ascend-card'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="absolute top-4 right-4 text-on-surface-variant/40 hover:text-on-surface press-scale" onClick={() => setSelectedBadge(null)}>
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 flex items-center justify-center mb-5 text-background"
                  style={{
                    background: `linear-gradient(135deg, ${rarity.color}dd, ${rarity.color}88)`,
                    borderRadius: theme === 'FORGE' ? '6px' : '50%',
                    boxShadow: `0 8px 30px ${rarity.color}44`
                  }}
                >
                  <span className="material-symbols-outlined text-[36px]">{selectedBadge.icon}</span>
                </div>
                <span className="font-label text-[8px] uppercase font-bold tracking-[0.3em] mb-2" style={{ color: rarity.color }}>{rarity.label}</span>
                <h2 className="font-display text-xl text-on-surface mb-1 font-bold uppercase tracking-wider">{selectedBadge.name}</h2>
                <p className="font-body text-xs text-on-surface-variant/60 mb-6 leading-relaxed">{selectedBadge.description}</p>
                <div className={`w-full p-4 flex justify-between items-center border ${
                  theme === 'FORGE' ? 'bg-[#141719] border-[#1e293b]' : 'bg-white/[0.03] border-white/[0.06] rounded-xl'
                }`}>
                  <span className="font-label text-[9px] text-on-surface-variant tracking-widest">REWARD</span>
                  <span className="font-display text-lg font-bold" style={{ color: rarity.color }}>+{selectedBadge.xp_reward} XP</span>
                </div>
                {selectedBadge.unlocked_at && (
                  <span className="font-label text-[8px] text-on-surface-variant/30 tracking-widest mt-4">UNLOCKED {selectedBadge.unlocked_at}</span>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
