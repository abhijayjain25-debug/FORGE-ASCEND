import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { useAppTheme } from '../contexts/ThemeContext';

export const Progress: React.FC = () => {
  const {
    profile,
    weightLogs,
    logWeight,
    progressPhotos,
    savePhotos
  } = useApp();

  const { theme } = useAppTheme();

  const [weightInput, setWeightInput] = useState('');
  const [sliderPercentage, setSliderPercentage] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  // Slider Drag Handlers
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPercentage(pct);
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  useEffect(() => {
    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  if (!profile) return null;

  // Weight details
  const startWeight = weightLogs.length > 0 ? weightLogs[0].weight : profile.current_weight;
  const currentWeight = profile.current_weight;
  const targetWeight = profile.goal_weight;
  const totalForged = Math.max(0, startWeight - currentWeight);

  const milestones = [
    { label: 'Start', weight: startWeight },
    { label: 'Phase 1', weight: Math.round(startWeight - totalForged * 0.3) },
    { label: 'Phase 2', weight: Math.round(startWeight - totalForged * 0.6) },
    { label: 'Current', weight: currentWeight, active: true },
    { label: 'Target', weight: targetWeight, isTarget: true }
  ];

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightInput);
    if (!w) return;
    await logWeight(w);
    setWeightInput('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        await savePhotos({ front_url: base64Url });
      }
    };
    reader.readAsDataURL(file);
  };


  // Before / After images from progressPhotos or default pre-seeded links from Stitch
  const beforeUrl = progressPhotos.length > 0 && progressPhotos[0].front_url 
    ? progressPhotos[0].front_url 
    : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbYSCh_O8OW_zDFYgix1jSxQjXSKKA4M9XhTRyuxYjai83j5eB6-LHLDJTUpihDSMPvfQiKqxj3BTzTMgCF3B8Iwy3juW1gcdUnt2iJkYzeWpIrSKGJRRwlA21urJ7_IEa-8uXsI5uZfTml7KQJs0raaUfNZdU3Bs2sXKFoHLwKZ1pbzUw-hNjU3E9odVBCLVy7jYEj5spJ1coM1jNKz2g-yjCjb6390no0N8m1297QxhuruJBGvr_kReVU-9iB8UfSvr_bw-x9EL_';
    
  const afterUrl = progressPhotos.length > 1 && progressPhotos[progressPhotos.length - 1].front_url 
    ? progressPhotos[progressPhotos.length - 1].front_url 
    : 'https://lh3.googleusercontent.com/aida-public/AB6AXuDVclNmVHMSKnOAJekSGfulS4BuS7dFhjj65mj12yOIcnz8gWxLsDu5rVOo2S-NCHvq14zrAXdPffLZFWqHef0kajGtwQ7854T4EbGf-6HuP1AmsfwVTQWXIr9JR-Ea_ANXTdiBynppOi0IU9TtkBElsBzIlOLCIQul20YA-m2mftiNBXCHl6DehcHeE6sBcXJ2tR8BcfpBfwcmPIXLz8gdBebTmHn3d1rVFQeEfFEBP8UkLplyLXLFemIy6a4c0qums0pdCv90sv6a';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-8"
    >
      {/* 1. HEADER */}
      <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-6 relative ${
        theme === 'FORGE' ? 'border-outline-variant/30' : 'border-white/10'
      }`}>
        {theme === 'FORGE' && (
          <div className="absolute bottom-0 left-0 w-1/4 h-[1px] bg-primary glow-line"></div>
        )}
        <div>
          <p className="font-label text-xs text-primary/70 mb-2 uppercase tracking-widest">
            {theme === 'FORGE' ? 'THE DESCENT' : 'TRANSFORMATION CHRONICLE'}
          </p>
          <h1 className="font-headline text-4xl md:text-5xl leading-none text-on-background uppercase tracking-tight font-black">
            Progress Chronicle
          </h1>
        </div>
      </div>

      {/* 2. TIMELINE HERO */}
      <section className={`p-8 rounded-xl ${
        theme === 'FORGE' ? 'bg-surface-container-low forge-shadow card-rim' : 'hud-glass'
      }`}>
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-label text-xs text-primary tracking-widest mb-2 uppercase">Mass Reduction</h2>
            <h3 className="font-headline text-2xl text-on-surface m-0 font-bold">Chronology</h3>
          </div>
          <div className="text-right">
            <span className="font-headline text-3xl font-extrabold text-primary block">
              {totalForged.toFixed(1)}kg
            </span>
            <span className="font-body text-xs text-on-surface-variant">Total Forged</span>
          </div>
        </div>

        {/* Animated timeline bar */}
        <div className="relative pt-8 pb-4">
          <div className={`absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 rounded-full overflow-hidden ${
            theme === 'FORGE' ? 'bg-surface-container-high' : 'bg-white/10'
          }`}>
            <div 
              className="h-full progress-gradient rounded-full shadow-lg transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min(100, Math.max(10, (totalForged / (startWeight - targetWeight)) * 100))}%` }}
            ></div>
          </div>

          <div className="relative flex justify-between items-center z-10">
            {milestones.map((m, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3">
                {m.active ? (
                  <div className="w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                ) : m.isTarget ? (
                  <div className="w-4 h-4 rounded-full bg-tertiary shadow-lg"></div>
                ) : (
                  <div className={`w-3.5 h-3.5 rounded-full shadow-md ${
                    theme === 'FORGE' ? 'bg-primary/80' : 'bg-primary/50'
                  }`}></div>
                )}
                <span className={`font-label text-[10px] font-bold ${
                  m.active || m.isTarget ? 'text-primary' : 'text-on-surface-variant'
                }`}>
                  {m.weight}kg
                </span>
                <span className="font-label text-[8px] text-on-surface-variant/60 uppercase tracking-widest hidden sm:block">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. LOG WEIGHT & COMPARISON GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LOG WEIGHT INPUT */}
        <div className={`lg:col-span-1 p-6 rounded-xl flex flex-col gap-6 ${
          theme === 'FORGE' ? 'bg-surface-container-low forge-shadow card-rim' : 'hud-glass'
        }`}>
          <h3 className="font-headline text-lg text-on-surface uppercase tracking-wider font-semibold">
            Log Weight
          </h3>
          <form onSubmit={handleWeightSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">
                Current Weight (kg)
              </label>
              <input 
                type="number"
                step="0.1"
                required
                placeholder="e.g. 85.4"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-full p-3 bg-background border border-outline-variant/40 rounded text-on-surface focus:border-primary focus:ring-0"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-primary text-background font-label text-xs uppercase tracking-widest py-3 rounded font-bold hover:opacity-90 transition-opacity"
            >
              LOG ENTRY
            </button>
          </form>

          {/* LOG PROGRESS PHOTO */}
          <div className={`mt-2 pt-4 border-t ${theme === 'FORGE' ? 'border-outline-variant/30' : 'border-white/10'}`}>
            <h4 className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest mb-3">
              UPLOAD PROGRESS PHOTO
            </h4>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className={`w-full text-xs text-on-surface-variant cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:transition-colors ${
                theme === 'FORGE' 
                  ? 'file:bg-[#f59e0b]/20 file:text-[#f59e0b] hover:file:bg-[#f59e0b]/30' 
                  : 'file:bg-primary/20 file:text-primary hover:file:bg-primary/30'
              }`}
            />
          </div>

          {/* History */}
          <div className="mt-2 pt-4 border-t border-outline-variant/10">
            <h4 className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest mb-3">
              RECENT ENTRIES
            </h4>
            <ul className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
              {weightLogs.slice().reverse().map((log, idx) => (
                <li key={idx} className="flex justify-between text-xs font-body py-2 border-b border-outline-variant/10 text-on-surface-variant">
                  <span>{log.log_date}</span>
                  <span className="font-label font-bold text-on-surface">{log.weight} kg</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* COMPARISON SLIDER */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="font-headline text-lg text-on-surface uppercase tracking-wider font-semibold">
            Visual Progress Slider
          </h3>
          
          <div 
            ref={containerRef}
            className={`rounded-xl overflow-hidden relative select-none cursor-ew-resize border ${
              theme === 'FORGE' ? 'border-outline-variant/30' : 'border-white/10'
            }`} 
            style={{ height: '450px' }}
            onTouchStart={handleMouseDown}
            onMouseDown={handleMouseDown}
          >
            {/* After Image (Background) */}
            <img 
              src={afterUrl} 
              alt="After" 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
            
            {/* Before Image (Overlay with clip-path) */}
            <img 
              src={beforeUrl} 
              alt="Before" 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none border-r border-primary"
              style={{ clipPath: `inset(0 ${100 - sliderPercentage}% 0 0)` }}
            />

            {/* Slider Handle */}
            <div 
              className="slider-handle" 
              style={{ left: `${sliderPercentage}%` }}
            ></div>

            {/* Labels overlay */}
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur px-3 py-1.5 rounded font-label text-[10px] uppercase tracking-widest text-on-surface border border-outline-variant/30">
              DAY 01
            </div>
            <div className="absolute top-4 right-4 bg-background/80 backdrop-blur px-3 py-1.5 rounded font-label text-[10px] uppercase tracking-widest text-primary border border-primary/40">
              CURRENT
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
