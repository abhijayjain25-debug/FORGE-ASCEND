import type { UserProfile, WeightLog, WorkoutSession } from '../services/db';

export interface LevelInfo {
  level: number;
  title: string;
  currentXp: number;
  xpNeededForNext: number;
  progressPercentage: number;
}

// XP thresholds for Level system
export function getXpForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level === 1) return 100;
  if (level === 2) return 250;
  if (level === 3) return 500;
  if (level === 4) return 850;
  if (level === 5) return 1300;
  
  // Custom progressive scaling for higher levels
  let xp = 1300;
  for (let l = 6; l <= level; l++) {
    xp += 500 + (l - 5) * 150;
  }
  return xp;
}

export function getLevelInfo(totalXp: number, theme: 'FORGE' | 'ASCEND' = 'FORGE'): LevelInfo {
  let level = 0;
  while (totalXp >= getXpForLevel(level + 1)) {
    level++;
  }

  const xpAtCurrentLevel = getXpForLevel(level);
  const xpAtNextLevel = getXpForLevel(level + 1);
  const currentLevelXpProgress = totalXp - xpAtCurrentLevel;
  const xpDifference = xpAtNextLevel - xpAtCurrentLevel;
  const percentage = Math.min(100, Math.max(0, (currentLevelXpProgress / xpDifference) * 100));

  // Dynamic titles depending on active path
  let title: string;
  if (theme === 'FORGE') {
    if (level >= 50) title = 'Apex Operator';
    else if (level >= 30) title = 'Vanguard';
    else if (level >= 20) title = 'Commander';
    else if (level >= 10) title = 'Special Ops';
    else if (level >= 5) title = 'Operator';
    else if (level >= 1) title = 'Initiate';
    else title = 'Recruit';
  } else {
    if (level >= 50) title = 'Ascended';
    else if (level >= 30) title = 'Master';
    else if (level >= 20) title = 'Sage';
    else if (level >= 10) title = 'Disciple';
    else if (level >= 5) title = 'Scholar';
    else if (level >= 1) title = 'Seeker';
    else title = 'Vessel';
  }

  return {
    level,
    title,
    currentXp: totalXp,
    xpNeededForNext: xpAtNextLevel,
    progressPercentage: percentage,
  };
}

export interface PlayerAttributes {
  strength: number;     // max 100
  discipline: number;   // max 100
  consistency: number;  // max 100
  endurance: number;    // max 100
  agility: number;      // max 100
}

export function calculatePlayerAttributes(
  profile: UserProfile,
  sessions: WorkoutSession[],
  weightLogs: WeightLog[],
  questHistoryRate: number // percent of quests completed (0-100)
): PlayerAttributes {
  
  // 1. STRENGTH (Based on logged weights)
  // Max weights logged in exercise sets. Defaults if none:
  let benchMax = 42.5; // starting default
  let squatMax = 60.0; // starting default
  let overheadMax = 30.0; // starting default

  sessions.forEach(s => {
    s.sets.forEach(set => {
      if (set.completed) {
        const name = set.exercise_name.toLowerCase();
        if (name.includes('bench')) {
          benchMax = Math.max(benchMax, set.weight);
        } else if (name.includes('squat')) {
          squatMax = Math.max(squatMax, set.weight);
        } else if (name.includes('overhead') || name.includes('shoulder press') || name.includes('db press')) {
          overheadMax = Math.max(overheadMax, set.weight);
        }
      }
    });
  });

  // Scale calculations (Bench max 140kg, Squat max 200kg, Press max 90kg)
  const benchScore = Math.min(30, (benchMax / 140) * 30);
  const squatScore = Math.min(40, (squatMax / 200) * 40);
  const pressScore = Math.min(30, (overheadMax / 90) * 30);
  const strength = Math.round(15 + benchScore + squatScore + pressScore);

  // 2. DISCIPLINE (Based on Streak & quest completion)
  const streakBonus = Math.min(40, profile.streak * 2);
  const questBonus = Math.min(60, (questHistoryRate / 100) * 60);
  const discipline = Math.round(Math.min(100, Math.max(10, streakBonus + questBonus)));

  // 3. CONSISTENCY (Based on last 30 days active days)
  // Mock fallback to a decent value if no history exists, otherwise analyze sessions
  let consistency = 75; // Default Lvl 7/10
  if (sessions.length > 0) {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const activeDays = new Set(
      sessions
        .filter(s => new Date(s.completed_at).getTime() >= thirtyDaysAgo)
        .map(s => s.completed_at.split('T')[0])
    ).size;
    consistency = Math.round(Math.min(100, (activeDays / 12) * 100)); // target: 12 workouts in 30 days
  }

  // 4. ENDURANCE (Workout duration and step logs)
  // Let's assume average steps logged is around 8000
  const endurance = Math.round(Math.min(100, 30 + (profile.streak * 1.5) + (sessions.length * 2)));

  // 5. AGILITY (Based on weight loss & active steps)
  let weightLoss = 0;
  if (weightLogs.length > 1) {
    const initial = weightLogs[0].weight;
    const current = weightLogs[weightLogs.length - 1].weight;
    weightLoss = Math.max(0, initial - current); // Target loss
  }
  const agility = Math.round(Math.min(100, 40 + (weightLoss * 2) + (profile.streak * 0.5)));

  return {
    strength: Math.min(100, Math.max(10, strength)),
    discipline,
    consistency: Math.min(100, Math.max(10, consistency)),
    endurance: Math.min(100, Math.max(10, endurance)),
    agility: Math.min(100, Math.max(10, agility)),
  };
}
