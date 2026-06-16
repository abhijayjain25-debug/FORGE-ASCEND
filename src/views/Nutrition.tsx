import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { useAppTheme } from '../contexts/ThemeContext';

// Inline modal component to replace browser prompt()
const InlineModal: React.FC<{
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  theme: string;
}> = ({ title, open, onClose, onSubmit, fields, theme }) => {
  const [values, setValues] = useState<Record<string, string>>({});
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center cinematic-backdrop" 
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`p-6 w-full max-w-xs mx-4 border ${
              theme === 'FORGE' ? 'bg-[#0a0c0e] border-[#1e293b]' : 'ascend-card'
            }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-sm font-bold text-primary uppercase tracking-widest mb-5">{title}</h3>
        <div className="flex flex-col gap-3">
          {fields.map(f => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="font-label text-[8px] text-on-surface-variant tracking-widest uppercase">{f.label}</label>
              <input
                type={f.type || 'number'}
                placeholder={f.placeholder}
                value={values[f.key] || ''}
                onChange={(e) => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                className={`p-3 bg-background border text-sm text-on-surface focus:outline-none focus:border-primary transition-colors ${
                  theme === 'FORGE' ? 'border-[#1e293b]' : 'border-white/10 rounded-lg'
                }`}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => { onSubmit(values); setValues({}); }}
            className="flex-1 bg-primary text-background font-label text-xs font-bold uppercase tracking-widest py-3 press-scale hover:opacity-90 transition-opacity"
            style={{ borderRadius: theme === 'FORGE' ? '0' : '10px' }}
          >
            ADD
          </button>
          <button
            onClick={() => { onClose(); setValues({}); }}
            className="flex-1 border border-outline text-on-surface-variant font-label text-xs uppercase tracking-widest py-3 press-scale hover:bg-white/5 transition-colors"
            style={{ borderRadius: theme === 'FORGE' ? '0' : '10px' }}
          >
            CANCEL
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const Nutrition: React.FC = () => {
  const { nutritionLogs, addNutritionItem, addSteps, addWater } = useApp();
  const { theme } = useAppTheme();

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayNut = nutritionLogs.find(l => l.log_date === todayStr) || {
    log_date: todayStr, calories: 0, protein: 0, water_ml: 0, steps: 0, sleep_hours: 0
  };

  const QUICK_ADD_ITEMS = [
    { name: 'Milk (250ml)', calories: 150, protein: 8, waterMl: 240, icon: 'local_drink' },
    { name: 'Paneer (100g)', calories: 320, protein: 18, waterMl: 0, icon: 'egg_alt' },
    { name: 'Soya Chunks (50g)', calories: 170, protein: 26, waterMl: 0, icon: 'grain' },
    { name: 'Oats (50g)', calories: 190, protein: 6, waterMl: 0, icon: 'breakfast_dining' },
    { name: 'Banana (1)', calories: 105, protein: 1.3, waterMl: 0, icon: 'nutrition' },
    { name: 'Curd (200g)', calories: 120, protein: 10, waterMl: 160, icon: 'icecream' }
  ];

  const goals = { calories: 2500, protein: 180, water: 3000, steps: 10000 };
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const getOffset = (val: number, max: number) => circumference - (Math.min(100, (val / max) * 100) / 100) * circumference;

  const handleQuickAdd = async (item: typeof QUICK_ADD_ITEMS[0]) => {
    await addNutritionItem({ name: item.name, calories: item.calories, protein: item.protein, waterMl: item.waterMl });
  };

  // Ring configurations with unique gradients per metric
  const rings = [
    { label: 'CALORIES', value: todayNut.calories, max: goals.calories, unit: 'kcal', icon: 'local_fire_department', gradient: ['#b45309', '#f59e0b'], id: 'calRing', onClick: undefined },
    { label: 'PROTEIN', value: todayNut.protein, max: goals.protein, unit: 'g', icon: 'restaurant', gradient: ['#047857', '#10b981'], id: 'proRing', onClick: undefined },
    { label: 'WATER', value: todayNut.water_ml, max: goals.water, unit: 'ml', icon: 'water_drop', gradient: ['#0369a1', '#22d3ee'], id: 'watRing', onClick: () => setShowWaterModal(true) },
    { label: 'STEPS', value: todayNut.steps, max: goals.steps, unit: '', icon: 'directions_walk', gradient: ['#7c3aed', '#c084fc'], id: 'stpRing', onClick: () => setShowStepsModal(true) },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-8 relative"
    >
      {/* HEADER */}
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 ${
        theme === 'FORGE' ? 'border-[#1e293b]' : 'border-white/[0.06]'
      }`}>
        <motion.div variants={itemVariants}>
          <p className="font-label text-[10px] text-primary/60 tracking-[0.3em] uppercase mb-2">
            {theme === 'FORGE' ? 'FUEL MASTERY' : 'NOURISHMENT'}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-on-background uppercase tracking-tight">
            Nutrition & Stats
          </h1>
        </motion.div>
      </div>

      {/* RINGS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {rings.map((r) => {
          const displayVal = r.unit === 'ml' ? `${(r.value / 1000).toFixed(1)}L` : r.unit === '' ? `${(r.value / 1000).toFixed(1)}k` : r.value;
          const displayMax = r.unit === 'ml' ? `${r.max / 1000}L` : r.unit === '' ? `${r.max / 1000}k` : `${r.max}${r.unit}`;
          return (
            <motion.div
              variants={itemVariants}
              key={r.id}
              onClick={r.onClick}
              className={`p-6 flex flex-col items-center justify-center hover-lift press-scale ${
                r.onClick ? 'cursor-pointer' : ''
              } ${
                theme === 'FORGE' ? 'forge-panel' : 'ascend-card'
              }`}
            >
              <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id={r.id} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={r.gradient[0]} />
                      <stop offset="100%" stopColor={r.gradient[1]} />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-white/[0.04]" />
                  <circle
                    cx="50" cy="50" r={radius} fill="none" stroke={`url(#${r.id})`}
                    strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={getOffset(r.value, r.max)}
                    strokeLinecap="round" className="progress-ring-animated"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-lg font-bold text-on-surface">{displayVal}</span>
                  <span className="font-label text-[7px] text-on-surface-variant tracking-widest">/{displayMax}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm" style={{ color: r.gradient[1] }}>{r.icon}</span>
                <span className="font-label text-[9px] tracking-widest uppercase font-bold" style={{ color: r.gradient[1] }}>{r.label}</span>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* QUICK ADD */}
      <motion.section variants={itemVariants}>
        <div className={`flex items-center justify-between mb-5 pb-2 border-b ${
          theme === 'FORGE' ? 'border-[#1e293b]' : 'border-white/[0.06]'
        }`}>
          <h3 className="font-display text-base font-bold text-on-surface uppercase tracking-wider">Quick Add</h3>
          <button onClick={() => setShowCustomModal(true)} className="text-primary hover:opacity-80 transition-opacity press-scale">
            <span className="material-symbols-outlined">add_circle</span>
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {QUICK_ADD_ITEMS.map((item, idx) => (
            <motion.button
              variants={itemVariants}
              key={idx}
              onClick={() => handleQuickAdd(item)}
              className={`p-4 flex flex-col items-center gap-2.5 hover-lift press-scale transition-all group ${
                theme === 'FORGE' ? 'forge-panel' : 'ascend-card'
              }`}
            >
              <div className={`w-10 h-10 flex items-center justify-center border transition-colors ${
                theme === 'FORGE'
                  ? 'border-[#1e293b] group-hover:border-[#f59e0b] text-[#64748b] group-hover:text-[#f59e0b] bg-[#141719]'
                  : 'border-white/10 group-hover:border-primary text-[#8b8fa4] group-hover:text-primary bg-white/[0.03] rounded-lg'
              }`}>
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
              </div>
              <span className="font-label text-[9px] tracking-wider text-on-surface uppercase font-bold">{item.name.split(' ')[0]}</span>
              <span className="font-body text-[8px] text-on-surface-variant/60">+{item.protein}g Pro</span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* TODAY'S LOG */}
      <motion.section variants={itemVariants} className={`p-6 ${theme === 'FORGE' ? 'forge-panel' : 'ascend-card'}`}>
        <h3 className={`font-display text-sm font-bold text-on-surface uppercase tracking-wider mb-4 pb-3 border-b ${
          theme === 'FORGE' ? 'border-[#1e293b]' : 'border-white/[0.06]'
        }`}>Today's Log</h3>
        {todayNut.calories > 0 || todayNut.protein > 0 || todayNut.water_ml > 0 ? (
          <div className="flex flex-col gap-3">
            {[
              { icon: 'dining', label: 'Logged Nutrition', val: `${todayNut.calories} kcal  ·  ${todayNut.protein}g Protein`, show: true },
              { icon: 'water_drop', label: 'Hydration', val: `${todayNut.water_ml} ml`, show: todayNut.water_ml > 0 },
              { icon: 'directions_walk', label: 'Activity', val: `${todayNut.steps.toLocaleString()} steps`, show: todayNut.steps > 0 },
            ].filter(r => r.show).map(r => (
              <div key={r.label} className={`flex justify-between items-center p-4 border ${
                theme === 'FORGE' ? 'bg-[#141719] border-[#1e293b]' : 'bg-white/[0.03] border-white/[0.06] rounded-xl'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-lg">{r.icon}</span>
                  <span className="font-body text-xs text-on-surface">{r.label}</span>
                </div>
                <span className="font-label text-xs text-primary font-bold">{r.val}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/20 mb-3">receipt_long</span>
            <p className="font-body text-xs text-on-surface-variant/40">Empty log. Add your first entry above.</p>
          </div>
        )}
      </motion.section>

      {/* MODALS */}
      <InlineModal
        title="Custom Entry" open={showCustomModal} theme={theme}
        onClose={() => setShowCustomModal(false)}
        fields={[
          { key: 'cal', label: 'Calories', placeholder: '250' },
          { key: 'pro', label: 'Protein (g)', placeholder: '20' },
        ]}
        onSubmit={async (v) => {
          await addNutritionItem({ name: 'Custom', calories: parseInt(v.cal) || 0, protein: parseInt(v.pro) || 0, waterMl: 0 });
          setShowCustomModal(false);
        }}
      />
      <InlineModal
        title="Add Water" open={showWaterModal} theme={theme}
        onClose={() => setShowWaterModal(false)}
        fields={[{ key: 'ml', label: 'Amount (ml)', placeholder: '500' }]}
        onSubmit={async (v) => { await addWater(parseInt(v.ml) || 0); setShowWaterModal(false); }}
      />
      <InlineModal
        title="Log Steps" open={showStepsModal} theme={theme}
        onClose={() => setShowStepsModal(false)}
        fields={[{ key: 'steps', label: 'Steps walked', placeholder: '2000' }]}
        onSubmit={async (v) => { await addSteps(parseInt(v.steps) || 0); setShowStepsModal(false); }}
      />
    </motion.div>
  );
};
