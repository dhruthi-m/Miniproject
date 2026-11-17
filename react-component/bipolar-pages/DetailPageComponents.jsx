import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ReferenceLine, 
  ResponsiveContainer 
} from 'recharts';
import { 
  ArrowLeft, 
  ShieldAlert, 
  Activity, 
  Compass, 
  Brain, 
  Sparkles, 
  BookOpen, 
  Moon, 
  Wind, 
  Heart, 
  Stethoscope, 
  Download, 
  Calendar, 
  RefreshCw,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Smile,
  Users,
  Sun,
  FileText,
  Printer,
  Share2,
  Save,
  MessageSquare
} from 'lucide-react';
import { bipolarDashboardMockData, bipolarInsightsMockData } from '../bipolarInsightsMockData';

// Reusable Page Header Layout
function PageHeader({ title, subtitle }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3.5 border-b border-[#384F6E]/15 pb-4 mb-4 text-left mt-4">
      <button 
        onClick={() => navigate('/')}
        className="p-2.5 bg-[#182235] hover:bg-slate-800 rounded-full text-slate-200 transition-all border border-[#384F6E]/15 shadow-md hover:scale-[1.03] cursor-pointer"
        aria-label="Back to overview"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">{title}</h1>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// 1. Risk Level Page
export function RiskPage({ symptomsCount }) {
  const navigate = useNavigate();
  const today = useMemo(() => new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }), []);

  const risk = useMemo(() => {
    if (symptomsCount >= 11) {
      return {
        level: 'High Risk',
        color: 'text-red-400',
        strokeColor: '#EF4444',
        bg: 'bg-red-500/10',
        border: 'border-red-500/25',
        interpretation: 'Multiple criteria met representing significant manic or hypomanic symptoms. Professional diagnostic check advised.',
        deg: 150,
        severityIdx: 3,
        confidence: 'High (Clinical range)',
        shortExplanation: 'Significant mood elevation, behavioral fluctuations, and elevated activity levels detected.',
        concern: 'High clinical concern',
        iconColor: 'text-red-400',
        badge: 'High Risk'
      };
    }
    if (symptomsCount >= 7) {
      return {
        level: 'Moderate Risk',
        color: 'text-orange-400',
        strokeColor: '#F59E0B',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/25',
        interpretation: 'Moderate frequency of reported behavioral fluctuations and energy spikes matching subthreshold manic criteria.',
        deg: 100,
        severityIdx: 2,
        confidence: 'Moderate (Above threshold)',
        shortExplanation: 'Elevated indicators of rapid-cycling energy shifts and fluctuations reported.',
        concern: 'Moderate clinical concern',
        iconColor: 'text-orange-400',
        badge: 'Moderate Risk'
      };
    }
    if (symptomsCount >= 4) {
      return {
        level: 'Mild Risk',
        color: 'text-cyan-400',
        strokeColor: '#22D3EE',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/25',
        interpretation: 'Subthreshold indicators of mood fluctuations observed. General wellness logging is suggested.',
        deg: 50,
        severityIdx: 1,
        confidence: 'Moderate (Sub-threshold)',
        shortExplanation: 'Mild mood variations and trace impulsivity indicators.',
        concern: 'Low clinical concern',
        iconColor: 'text-cyan-400',
        badge: 'Mild Risk'
      };
    }
    return {
      level: 'Low Risk',
      color: 'text-green-400',
      strokeColor: '#10B981',
      bg: 'bg-green-500/10',
      border: 'border-green-500/25',
      interpretation: 'Mood stability baseline indices remain within typical range.',
      deg: 15,
      severityIdx: 0,
      confidence: 'High (Negative screening)',
      shortExplanation: 'Few or no flags detected; typical mood variation baseline.',
      concern: 'No clinical concern',
      iconColor: 'text-green-400',
      badge: 'Low Risk'
    };
  }, [symptomsCount]);

  return (
    <div className="flex flex-col gap-12 max-w-[1200px] w-full p-6 md:p-10 text-left text-base leading-relaxed mx-auto">
      
      {/* Hero Section */}
      <div className="flex flex-col gap-6 w-full text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#384F6E]/15 pb-6 mb-2">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-3 bg-[#182235]/80 hover:bg-[#202E48] rounded-full text-slate-200 transition-all border border-[#384F6E]/20 shadow-lg hover:scale-105 cursor-pointer flex items-center justify-center"
              aria-label="Back to overview"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/15">MindWave Portal</span>
                <span className={`text-[10px] ${risk.color} font-extrabold uppercase tracking-widest ${risk.bg} px-2 py-0.5 rounded border ${risk.border}`}>{risk.level}</span>
                <span className="text-[10px] text-slate-400 font-bold bg-[#182235] px-2 py-0.5 rounded border border-[#384F6E]/15 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> {today}
                </span>
              </div>
              <h1 className="text-[34px] font-black text-white tracking-wide leading-tight">Overall Risk Assessment</h1>
              <p className="text-[16px] text-slate-400 mt-1 font-normal leading-relaxed">Detailed clinical interpretation of your screening result.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        {/* Risk Level Hero Card (Left, Col-span 5) */}
        <div className="lg:col-span-5 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-7 shadow-2xl flex flex-col justify-between min-h-[320px] hover:border-[#384F6E]/30 transition-all duration-300">
          <div className="flex flex-col gap-4">
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-widest block">Assessment Status</span>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl ${risk.bg} ${risk.color} flex items-center justify-center border ${risk.border} relative overflow-hidden`}>
                <ShieldAlert className="w-8 h-8 relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/5" />
              </div>
              <div>
                <span className="text-[12px] text-slate-500 font-semibold block">CURRENT RISK LEVEL</span>
                <h2 className={`text-3xl font-black ${risk.color} tracking-wide mt-0.5`}>{risk.level}</h2>
              </div>
            </div>
            <p className="text-[15px] text-slate-300 font-normal leading-relaxed mt-2">
              {risk.shortExplanation}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#384F6E]/15 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider">Confidence Index:</span>
            <span className="text-slate-350 font-bold bg-[#1d2b42] px-2.5 py-1 rounded border border-[#384F6E]/20">{risk.confidence}</span>
          </div>
        </div>

        {/* Clinical Summary Card (Right, Col-span 7) */}
        <div className="lg:col-span-7 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-7 shadow-2xl flex flex-col justify-between min-h-[320px] hover:border-[#384F6E]/30 transition-all duration-300">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-2 border-b border-[#384F6E]/15 pb-3">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Clinical Summary Breakdown</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/40">
                <div className="flex items-center gap-2 mb-1">
                  <Smile className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overview</span>
                </div>
                <p className="text-[14px] text-slate-300 leading-relaxed font-normal">
                  Assessment metrics derived from the standard Bipolar screening scale.
                </p>
              </div>
              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/40">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Findings</span>
                </div>
                <p className="text-[14px] text-slate-300 leading-relaxed font-normal">
                  {symptomsCount} indicators flagged out of 16 response dimensions.
                </p>
              </div>
              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/40">
                <div className="flex items-center gap-2 mb-1">
                  <Stethoscope className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Meaning</span>
                </div>
                <p className="text-[14px] text-slate-300 leading-relaxed font-normal">
                  {symptomsCount >= 6 ? 'Exceeds standard clinical thresholds for mood variation review.' : 'Remains within sub-threshold range concern limits.'}
                </p>
              </div>
              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/40">
                <div className="flex items-center gap-2 mb-1">
                  <Compass className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Observation</span>
                </div>
                <p className="text-[14px] text-slate-300 leading-relaxed font-normal">
                  Focus area: Mood stability transitions and energy telemetry.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        {/* Risk Gauge (Col-span 5) */}
        <div className="lg:col-span-5 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-7 shadow-2xl flex flex-col items-center justify-between min-h-[360px] hover:border-[#384F6E]/30 transition-all duration-300">
          <div className="flex items-center gap-2 self-start w-full border-b border-[#384F6E]/15 pb-3">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Risk Gauge Meter</h3>
          </div>

          {/* Semicircle Gauge */}
          <div className="relative w-64 h-32 flex items-end justify-center mt-6">
            <svg className="absolute w-full h-full" viewBox="0 0 100 50">
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#101827" strokeWidth="8" strokeLinecap="round" />
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#riskGradientDetailBipolar)" strokeWidth="8" strokeLinecap="round" />
              <defs>
                <linearGradient id="riskGradientDetailBipolar" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="33%" stopColor="#22D3EE" />
                  <stop offset="66%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
              </defs>
            </svg>

            {/* Animated Needle */}
            <div 
              className="absolute w-1 bg-white h-24 bottom-0 origin-bottom transition-all duration-[1200ms] ease-out shadow-md"
              style={{ transform: `rotate(${risk.deg - 90}deg)` }}
            >
              <div className="w-4.5 h-4.5 rounded-full bg-white absolute -bottom-2 -left-1.75 border-2 border-slate-950 shadow-lg" />
            </div>
          </div>

          <div className="text-center w-full mt-4 flex flex-col items-center">
            <span className="text-[12px] text-slate-500 font-bold uppercase tracking-widest">CURRENT STATUS</span>
            <span className={`text-2xl font-black ${risk.color} uppercase tracking-wider block mt-0.5`}>{risk.level}</span>
            <span className="text-xs text-slate-400 mt-1 font-semibold bg-slate-900/35 px-3 py-1 rounded-full border border-slate-800/40">{risk.concern}</span>
          </div>
        </div>

        {/* Score Breakdown (Col-span 7) */}
        <div className="lg:col-span-7 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-7 shadow-2xl flex flex-col justify-between min-h-[360px] hover:border-[#384F6E]/30 transition-all duration-300">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-2 border-b border-[#384F6E]/15 pb-3">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Score & Analytics Profile</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">TOTAL SCORE</span>
                <span className="text-3xl font-black text-white mt-1">{symptomsCount} <span className="text-sm font-bold text-slate-500">/ 16</span></span>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">YES RESPONSES</span>
                <span className="text-3xl font-black text-cyan-400 mt-1">{symptomsCount}</span>
              </div>
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/40 flex flex-col justify-between col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">NO RESPONSES</span>
                <span className="text-3xl font-black text-slate-400 mt-1">{16 - symptomsCount}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/40">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span>Assessment Completeness</span>
                <span className="text-white">{Math.round((symptomsCount/16)*105) > 100 ? 100 : Math.round((symptomsCount/16)*100)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden shadow-inner p-[1px]">
                <div 
                  className={`h-full rounded-full transition-all duration-[1200ms] ease-out bg-gradient-to-r from-cyan-500 to-purple-500`}
                  style={{ width: `${(symptomsCount/16)*100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider text-right w-full">
            Clinical Threshold Flag: 6 or more Yes answers
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        {/* Risk Factors Card (Col-span 6) */}
        <div className="lg:col-span-6 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-7 shadow-2xl flex flex-col justify-between hover:border-[#384F6E]/30 transition-all duration-300">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-2 border-b border-[#384F6E]/15 pb-3">
              <Compass className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Contributing Risk Factors</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 hover:bg-[#1f2d47]/40 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${symptomsCount >= 7 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15' : 'bg-green-500/10 text-green-400 border border-green-500/15'}`}>
                    {symptomsCount >= 11 ? 'Severe' : symptomsCount >= 7 ? 'Elevated' : 'Low'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Energy Surges</h4>
                <p className="text-[12px] text-slate-400 leading-relaxed">Variations in sleep cycles and activity level spikes.</p>
              </div>

              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 hover:bg-[#1f2d47]/40 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${symptomsCount >= 7 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15' : 'bg-green-500/10 text-green-400 border border-green-500/15'}`}>
                    {symptomsCount >= 11 ? 'Severe' : symptomsCount >= 7 ? 'Elevated' : 'Low'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Mood Shifts</h4>
                <p className="text-[12px] text-slate-400 leading-relaxed">Fluctuations in temperament and speed of thoughts.</p>
              </div>

              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 hover:bg-[#1f2d47]/40 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                    <Wind className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${symptomsCount >= 7 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15' : 'bg-green-500/10 text-green-400 border border-green-500/15'}`}>
                    {symptomsCount >= 7 ? 'Elevated' : 'Low'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Impulsivity</h4>
                <p className="text-[12px] text-slate-400 leading-relaxed">Risk-taking indicators or sudden changes in focus.</p>
              </div>

              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 hover:bg-[#1f2d47]/40 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${symptomsCount >= 11 ? 'bg-red-500/10 text-red-400 border border-red-500/15' : 'bg-green-500/10 text-green-400 border border-green-500/15'}`}>
                    {symptomsCount >= 11 ? 'High' : 'Low'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Behavioral Changes</h4>
                <p className="text-[12px] text-slate-400 leading-relaxed">Fluctuations in socialization profiles or speech patterns.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Interpretation Card (Col-span 6) */}
        <div className="lg:col-span-6 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-7 shadow-2xl flex flex-col justify-between hover:border-[#384F6E]/30 transition-all duration-300">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-2 border-b border-[#384F6E]/15 pb-3">
              <Stethoscope className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Clinical Interpretation Panel</span>
            </div>
            <div className="text-[14px] text-slate-300 leading-relaxed flex flex-col gap-3.5 mt-2">
              <p>
                Your score of <strong className="text-white">{symptomsCount} out of 16</strong> indicates a <strong className={risk.color}>{risk.level}</strong> profile.
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-2 text-slate-450 text-xs sm:text-sm">
                <li><strong className="text-slate-200">What this means:</strong> {risk.interpretation}</li>
                <li><strong className="text-slate-200">Why this result occurred:</strong> Responses capture mood fluctuations, changes in energetic telemetry, or focus variations.</li>
                <li><strong className="text-slate-200">Expected observations:</strong> Short cycles of high productivity followed by normal baseline states, or shifts in sleep patterns.</li>
                <li><strong className="text-slate-200">Clinical significance:</strong> Self-screening helper intended strictly to identify patterns for wellness tracking, not clinical diagnosis.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Severity Scale */}
      <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-7 shadow-2xl w-full hover:border-[#384F6E]/30 transition-all duration-300">
        <div className="flex items-center gap-2 border-b border-[#384F6E]/15 pb-3 mb-6">
          <Activity className="w-5 h-5 text-purple-400" />
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Risk Severity Scale Spectrum</span>
        </div>

        <div className="relative pt-4 pb-6 px-2">
          {/* Scale background track */}
          <div className="absolute top-[38px] left-0 right-0 h-2.5 bg-slate-900 rounded-full shadow-inner" />
          {/* Active track highlight */}
          <div 
            className="absolute top-[38px] left-0 h-2.5 bg-gradient-to-r from-green-500 via-cyan-400 to-orange-500 rounded-full transition-all duration-[1200ms] ease-out" 
            style={{ width: `${(risk.severityIdx / 3) * 100}%` }}
          />

          {/* Step Indicators */}
          <div className="relative flex justify-between items-center w-full z-10">
            {[
              { label: 'Low Risk', range: '0 - 3 Yes', color: 'text-green-400', activeBg: 'bg-green-500 border-green-400 shadow-[0_0_12px_#10B981]' },
              { label: 'Mild Risk', range: '4 - 6 Yes', color: 'text-cyan-400', activeBg: 'bg-cyan-500 border-cyan-400 shadow-[0_0_12px_#22D3EE]' },
              { label: 'Moderate Risk', range: '7 - 10 Yes', color: 'text-orange-400', activeBg: 'bg-orange-500 border-orange-400 shadow-[0_0_12px_#F59E0B]' },
              { label: 'High Risk', range: '11 - 16 Yes', color: 'text-red-400', activeBg: 'bg-red-500 border-red-400 shadow-[0_0_12px_#EF4444]' }
            ].map((step, idx) => {
              const isActive = idx === risk.severityIdx;
              return (
                <div 
                  key={idx} 
                  className={`flex flex-col items-center text-center transition-all duration-505 ${isActive ? 'scale-110 opacity-100' : 'opacity-40 hover:opacity-60 scale-95'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-4 border-slate-950 transition-all ${isActive ? step.activeBg : 'bg-slate-800 border-slate-900'}`} />
                  <span className={`text-xs font-bold mt-2.5 ${isActive ? step.color : 'text-slate-405'}`}>{step.label}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{step.range}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Important Disclaimer */}
      <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/25 rounded-[20px] p-6 shadow-xl w-full flex gap-4 items-start text-left">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/15">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wider">Important Clinical Notice</h4>
          <p className="text-[13px] text-slate-450 leading-relaxed font-normal">
            This screening result is <strong className="text-white">not a medical diagnosis</strong>. It is intended only as an early screening tool. Please consult a qualified mental health professional or general clinician for a complete, structured clinical evaluation.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 w-full border-t border-[#384F6E]/15 pt-6">
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-[#1d2b42] hover:bg-[#253754] text-slate-200 text-sm font-semibold rounded-xl transition-all border border-[#384F6E]/20 shadow-md hover:scale-[1.02] cursor-pointer flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </button>
        
        <button 
          onClick={() => window.print()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-all border border-purple-500 shadow-md hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:scale-[1.02] cursor-pointer flex items-center gap-2 sm:ml-auto"
        >
          <Printer className="w-4 h-4" /> Print Results
        </button>

        <button 
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'MindWave Assessment Result',
                text: `My MindWave screening overall risk status: ${risk.level}`,
                url: window.location.href,
              }).catch(() => {});
            } else {
              alert(`Copied sharing link for: ${risk.level} status`);
            }
          }}
          className="px-6 py-3 bg-[#182235]/80 hover:bg-[#202e48] text-slate-200 text-sm font-semibold rounded-xl transition-all border border-[#384F6E]/20 shadow-md hover:scale-[1.02] cursor-pointer flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" /> Share Report
        </button>
        
        <button 
          onClick={() => alert("Report downloaded successfully (Mock).")}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-sm font-bold rounded-xl transition-all border border-cyan-400 shadow-md hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:scale-[1.02] cursor-pointer flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Download Report
        </button>
      </div>

    </div>
  );
}

// 2. Mood Stability Meter Page
export function StabilityPage({ symptomsCount }) {
  const stability = useMemo(() => {
    if (symptomsCount >= 13) return { level: 'Significant Mood Instability', color: 'text-red-400', bg: 'bg-red-500/10', pct: '90%', barColor: 'from-orange-500 to-red-500', desc: 'Indicates high variations in energy, sleep habits, and rapid cycle behavior changes.' };
    if (symptomsCount >= 10) return { level: 'Moderate Mood Changes', color: 'text-orange-400', bg: 'bg-orange-500/10', pct: '70%', barColor: 'from-cyan-400 to-orange-400', desc: 'Reflects frequent shifts in mood and impulsivity indices.' };
    if (symptomsCount >= 7) return { level: 'Mild Mood Changes', color: 'text-cyan-400', bg: 'bg-cyan-500/10', pct: '50%', barColor: 'from-cyan-400 to-orange-400', desc: 'Slight fluctuations in activity patterns or distraction spikes.' };
    if (symptomsCount >= 4) return { level: 'Mostly Stable', color: 'text-cyan-400', bg: 'bg-cyan-500/10', pct: '30%', barColor: 'from-green-500 to-cyan-400', desc: 'Normal wellness variance with negligible instability indicators.' };
    return { level: 'Very Stable', color: 'text-green-400', bg: 'bg-green-500/10', pct: '10%', barColor: 'from-green-500 to-green-400', desc: 'Minimal behavioral variance. High sleep-routine consistency.' };
  }, [symptomsCount]);

  const { pastScreenings } = bipolarInsightsMockData;

  // Custom tooltips for Recharts
  const formatChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1E293B] border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl flex flex-col gap-1 text-xs text-left">
          <p className="text-slate-400 font-semibold">{data.date}</p>
          <div className="flex justify-between gap-6 mt-1">
            <span className="text-violet-400 font-semibold">Score:</span>
            <span className="font-mono text-white font-bold">{data.symptomCount} / 16</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4 text-left">
      <PageHeader title="Mood Stability Telemetry" subtitle="Longitudinal mood fluctuations graph" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
        
        {/* Stability Meter Left */}
        <div className="lg:col-span-5 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-xl flex flex-col justify-between min-h-[300px]">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">STABILITY DEVIATION</span>
            <h3 className={`text-xl font-bold ${stability.color}`}>{stability.level}</h3>
          </div>

          <div className="relative w-full py-6 flex flex-col gap-2">
            <div className="w-full h-3 rounded-full bg-gradient-to-r from-green-500 via-cyan-400 via-orange-400 to-red-500 relative">
              <div 
                className="absolute w-4.5 h-4.5 -top-0.5 rounded-full bg-white border-2 border-slate-950 shadow-lg transform -translate-x-1/2 transition-all duration-500"
                style={{ left: stability.pct }}
              />
            </div>
            <div className="flex justify-between text-[8px] font-bold text-slate-500 tracking-widest uppercase">
              <span>STABLE</span>
              <span>MED</span>
              <span>HIGH VARIANCE</span>
            </div>
          </div>

          <p className="text-xs text-slate-405 leading-relaxed bg-slate-900/25 p-3 rounded-xl border border-slate-850">
            {stability.desc}
          </p>
        </div>

        {/* Chart Right */}
        <div className="lg:col-span-7 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-xl flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Screening Scores Graph</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Historical assessment tracking</p>
          </div>

          <div className="h-44 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pastScreenings} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 16]} tickCount={5} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip content={formatChartTooltip} />
                <ReferenceLine y={6} stroke="#F59E0B" strokeDasharray="4 4" />
                <Line 
                  type="monotone" 
                  dataKey="symptomCount" 
                  stroke="#3B82F6" 
                  strokeWidth={2.5} 
                  dot={{ fill: '#182235', stroke: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ fill: '#22D3EE', stroke: '#182235', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Stability Tips */}
      <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#384F6E]/15 pb-3 mb-4 flex items-center gap-2">
          <Wind className="w-5 h-5 text-cyan-400" /> Tips to Improve Stability
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-300">
          <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-850">
            <strong>• Strict Sleep Schedule:</strong> Lay down and wake up at the exact same times every day to sync biological clocks.
          </div>
          <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-850">
            <strong>• Limit Stress Buffers:</strong> Introduce meditation or progressive muscle relaxation (PMR) to lower physical hyper-activity cycles.
          </div>
          <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-850">
            <strong>• Track Mood Anchors:</strong> Log daily triggers, sleep duration, and activity volume consistently in a journal.
          </div>
          <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-850">
            <strong>• Regular Meal Times:</strong> Maintain blood sugar stability to prevent energy volatility.
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. Symptoms Identified Page
export function SymptomsPage({ answers }) {
  const detectedSymptomObjects = useMemo(() => {
    const details = [
      { id: 1, name: 'Elevated Mood Episodes', desc: 'Unusual, highly energetic, excited, or "high" mood periods.', impact: 'May lead to over-committing to projects, talking very fast, or hyperactive behavior.' },
      { id: 2, name: 'Reduced Need for Sleep', desc: 'Going for long stretches with minimal sleep (e.g. 3-4 hours) while still feeling fully rested and energetic.', impact: 'Disrupts biological clock synchronization and can trigger mania.' },
      { id: 3, name: 'Racing Thoughts', desc: 'Thoughts flowing so rapidly that speech cannot keep up, causing distraction.', impact: 'Causes concentration breakdowns and makes logical scheduling difficult.' },
      { id: 4, name: 'Confidence Spikes', desc: 'Periods of intense power, confidence, or grandeur exceeding typical baselines.', impact: 'May distort risk calculation boundaries.' },
      { id: 5, name: 'Increased Talkativeness', desc: 'Feeling an intense pressure to keep talking or speaking louder and faster than usual.', impact: 'Causes communication barriers or misunderstandings in social groups.' },
      { id: 6, name: 'Impulsive Behaviour', desc: 'Making sudden decisions without evaluating future consequences.', impact: 'Can result in occupational difficulties, relationship friction, or safety issues.' },
      { id: 7, name: 'Risk Taking / Spending', desc: 'Spurred spending habits or involvement in risky ventures during specific moods.', impact: 'May introduce severe financial stress or somatic health risks.' },
      { id: 8, name: 'Difficulty Concentrating', desc: 'Getting highly distracted by external stimuli or racing thoughts.', impact: 'Directly lowers output at work or school.' },
      { id: 9, name: 'Mood Swings', desc: 'Shifts in mood occurring without immediate logical triggers.', impact: 'Introduces emotional instability in daily lifestyle loops.' },
      { id: 10, name: 'Irritability', desc: 'Feeling unusually touchy, argumentative, or angry for days.', impact: 'Creates relationship conflicts with family, friends, or coworkers.' },
      { id: 11, name: 'Depressive Episodes', desc: 'Sinking into low energy, lack of enjoyment, or feeling extremely down.', impact: 'Lowers daily function, making simple chores or self-care challenging.' },
      { id: 12, name: 'Emotional Instability', desc: 'Struggling to regulate intensity of emotional reactions.', impact: 'Can lead to sudden outbursts or feeling out of control.' }
    ];

    const results = [];
    answers.forEach((ans) => {
      if (ans.symptom === true) {
        const item = details.find(d => d.id === ans.id);
        if (item) results.push({ ...item, severity: ans.distress });
      }
    });

    // Fallback default symptoms list if empty
    if (results.length === 0) {
      return [
        { id: 1, name: 'Elevated Mood Episodes', desc: 'Periods of high energy and elevated mood.', impact: 'Disrupts regular schedules.', severity: 3 },
        { id: 2, name: 'Reduced Need for Sleep', desc: 'Going with little sleep while feeling rested.', impact: 'Can trigger mania cycle.', severity: 2 }
      ];
    }
    return results;
  }, [answers]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4 text-left text-xs">
      <PageHeader title="Symptom Classification" subtitle="Detailed breakdown of reported indicators" />
      
      <div className="flex flex-col gap-4">
        {detectedSymptomObjects.map((sym, idx) => (
          <div key={idx} className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-5 shadow-xl hover:border-[#384F6E]/30 transition-all duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/50 pb-3 mb-3">
              <h3 className="text-base font-bold text-white tracking-wide">{sym.name}</h3>
              <div className="flex gap-2">
                <span className="bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-400/20 px-3 py-1 rounded-lg">
                  Severity: {sym.severity} / 5
                </span>
                <span className="bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20 px-3 py-1 rounded-lg">
                  {sym.severity >= 4 ? 'Severe Impact' : sym.severity >= 2 ? 'Moderate' : 'Mild'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 leading-relaxed">
              <div>
                <strong className="text-slate-400 uppercase tracking-wider block text-[10px] mb-1">Symptom Description</strong>
                <p className="text-slate-305 font-medium">{sym.desc}</p>
              </div>
              <div>
                <strong className="text-slate-400 uppercase tracking-wider block text-[10px] mb-1">Possible Daily Impact</strong>
                <p className="text-slate-350 font-normal">{sym.impact}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 4. Mood Insights Page
export function InsightsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4 text-left">
      <PageHeader title="Mood Insights Report" subtitle="Psychological patterns and clinical observations" />
      
      <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-xl flex flex-col gap-5 text-xs leading-relaxed text-slate-300">
        
        {/* Obs summary */}
        <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-850">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" /> Behavioral Observations
          </h3>
          <p className="text-slate-300 font-normal">
            Assessment scores indicate a cyclic fluctuation pattern, characterized by periods of elevated goal-directed activity, reduced requirement for sleep, and race-like thought acceleration. These behavioral spikes are often offset by periods of low motivation, fatigue, or irritability, which are characteristic profiles of mood episode variations.
          </p>
        </div>

        {/* Mood patterns */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 border-b border-slate-800/50 pb-2">Mood Cycling Patterns</h3>
          <p className="text-slate-355">
            Fluctuation spikes appear linked to circadian rhythm disruptions. Logged sleep quality metrics indicate that sleep durations below 5 hours frequently precede high-energy, irritable, or distractible states. These triggers can cause cascading emotional instability.
          </p>
        </div>

        {/* Clinical interpretation */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 border-b border-slate-800/50 pb-2">Clinical Interpretation</h3>
          <p className="text-slate-355">
            A cluster of 6 or more symptoms in Bipolar screening represents elevated probability of hypomanic or manic episodes. This can influence impulse thresholds, financial decisions, and interpersonal communications. Seeking a clinical diagnostic interview is recommended to evaluate these trends.
          </p>
        </div>

        {/* Recommendations */}
        <div className="bg-purple-900/10 border border-purple-500/20 p-5 rounded-2xl flex gap-3.5 items-start">
          <Stethoscope className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Clinical Guidance</h4>
            <p className="text-slate-300 font-normal">
              Establish healthy sleep schedules, utilize pacing checklists during energetic bursts, and share these longitudinal screening charts with a licensed psychiatrist or cognitive-behavioral therapist.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// 5. Personalized Recommendations Page
export function RecommendationsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4 text-left">
      <PageHeader title="Wellness Recommendations" subtitle="Lifestyle, routines, and tracking strategies" />
      
      <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-xl flex flex-col gap-6">
        
        {/* Lifestyle Changes */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#384F6E]/15 pb-2.5 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-cyan-400" /> Lifestyle Adjustments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-850">
              <strong>• Limit Stimulants:</strong> Cut caffeine, sugar spikes, and screen stimulants late in the evening to stabilize neural pacing.
            </div>
            <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-850">
              <strong>• Low-Impact Exercise:</strong> Standardize 20-30 minute walks or gentle swims to regulate excessive kinetic energy.
            </div>
          </div>
        </div>

        {/* Daily Checklist */}
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#384F6E]/15 pb-2.5 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" /> Daily Routine Checklist
          </h3>
          <div className="flex flex-col gap-2.5 text-xs text-slate-300 font-medium leading-relaxed">
            <div className="flex items-center gap-2.5 bg-slate-900/25 p-2.5 rounded-xl border border-slate-850">
              <CheckCircle className="w-4 h-4 text-[#22C55E]" /> Set a consistent wake-up time (including weekends).
            </div>
            <div className="flex items-center gap-2.5 bg-slate-900/25 p-2.5 rounded-xl border border-slate-850">
              <CheckCircle className="w-4 h-4 text-[#22C55E]" /> Track mood anchors and sleep durations in a daily journal.
            </div>
            <div className="flex items-center gap-2.5 bg-slate-900/25 p-2.5 rounded-xl border border-slate-850">
              <CheckCircle className="w-4 h-4 text-[#22C55E]" /> Take a 20-minute morning walk for sun-telemetry grounding.
            </div>
            <div className="flex items-center gap-2.5 bg-slate-900/25 p-2.5 rounded-xl border border-slate-850">
              <CheckCircle className="w-4 h-4 text-[#22C55E]" /> Avoid starting major new projects during high-energy periods.
            </div>
          </div>
        </div>

        {/* Mood Tracking advice */}
        <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-850 text-xs text-slate-305 leading-relaxed">
          <strong>Psychological Note:</strong> Mood tracking helps link behavioral shifts with internal thoughts. Recognize early symptoms (like sleep duration dropping) to take preventative rest breaks before manic phases emerge.
        </div>

      </div>
    </div>
  );
}

// 6. Sleep Guidelines Page
export function SleepPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4 text-left">
      <PageHeader title="Sleep Hygiene Protocols" subtitle="Restoration guidelines for mood stabilization" />
      
      <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-xl flex flex-col gap-5 text-xs leading-relaxed text-slate-300">
        
        {/* Habit Card */}
        <div className="bg-slate-900/30 p-4.5 rounded-xl border border-slate-850 flex items-start gap-4">
          <Moon className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Sleep Pacing Routine</h3>
            <p className="text-slate-305 leading-relaxed font-normal">
              Sleep consistency is the most vital clinical buffer against manic cycles. Establish a rigid, screen-free routine 1 hour before bed to support natural circadian regulation.
            </p>
          </div>
        </div>

        {/* Detailed checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Bedtime Checklist</h4>
            <ul className="flex flex-col gap-2.5 text-slate-300 font-medium">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#22C55E]" /> Sleep 7–9 hours nightly</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#22C55E]" /> Keep a fixed bedtime hour</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#22C55E]" /> Turn off screens 1 hour prior</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#22C55E]" /> Limit stimulants after 3 PM</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#22C55E]" /> Sleep in a dark, silent room</li>
            </ul>
          </div>

          <div className="bg-slate-900/30 p-4.5 rounded-xl border border-slate-850 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-1.5">Screen-time Recommendation</h4>
              <p className="text-slate-400 font-normal">
                Blue light blocks melatonin synthesis, triggering neural hyperactivity. Replace screens with reading, listening to white noise, or progressive muscle relaxation before attempting sleep.
              </p>
            </div>
            <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mt-3">
              Aim for a consistent sleep buffer
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// 7. Stress Management Page
export function StressPage() {
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingText, setBreathingText] = useState('Inhale');

  // Breathing Regulator cycles
  useEffect(() => {
    let interval;
    if (breathingActive) {
      setBreathingText('Inhale');
      let count = 0;
      interval = setInterval(() => {
        count = (count + 1) % 3;
        if (count === 0) setBreathingText('Inhale');
        else if (count === 1) setBreathingText('Hold');
        else setBreathingText('Exhale');
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [breathingActive]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4 text-left">
      <PageHeader title="Stress Management & Grounding" subtitle="Visual relaxation regulators and grounding routines" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
        
        {/* Breathing widget Left */}
        <div className="lg:col-span-5 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-xl flex flex-col justify-between min-h-[300px] text-center">
          <div>
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Visual Lung Regulator</h3>
            <p className="text-[10px] text-slate-400 mt-1">Slow breath cycle down to calm autonomic hyper-arousal</p>
          </div>

          <div className="my-2 flex items-center justify-center h-28">
            {breathingActive ? (
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-blue-500/10 border-2 border-blue-400 flex items-center justify-center text-xs font-bold text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse">
                  {breathingText}
                </div>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                <Wind className="w-6 h-6" />
              </div>
            )}
          </div>

          <button 
            onClick={() => setBreathingActive(!breathingActive)}
            className={`w-full py-2.5 text-xs font-bold rounded-full transition-all cursor-pointer hover:scale-[1.03] duration-200 ${
              breathingActive 
                ? 'bg-slate-900 border border-slate-800 text-slate-350' 
                : 'bg-green-500 hover:bg-green-400 text-white'
            }`}
          >
            {breathingActive ? 'Stop Breath regulator' : 'Start Exercises →'}
          </button>
        </div>

        {/* Stress management text Right */}
        <div className="lg:col-span-7 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-xl flex flex-col justify-between min-h-[300px] text-left text-xs leading-relaxed text-slate-300">
          <div>
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Grounding Routines</h3>
            <p className="text-[10px] text-slate-400 mt-1">Somatic checks to quiet racing cycles</p>
          </div>

          <div className="flex flex-col gap-3 my-3">
            <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-850">
              <strong>• 5-4-3-2-1 Sensory Grounding:</strong> Focus on 5 visual items, 4 textures, 3 distinct sounds, 2 scents, and 1 taste to pull thoughts back to the present.
            </div>
            <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-850">
              <strong>• Paced Breathing (4-7-8):</strong> Inhale 4s, hold 7s, exhale 8s to trigger parasympathetic calming.
            </div>
            <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-850">
              <strong>• Yoga & Somatic Stretches:</strong> Release somatic stress locks in neck and shoulders.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// 8. Daily Wellness Habits Page
export function WellnessPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4 text-left text-xs">
      <PageHeader title="Daily Wellness & Self-Care" subtitle="Checklists and schedules for daily structure" />
      
      <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#384F6E]/15 pb-2.5 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-cyan-400" /> Self-Care Routine Checklist
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: 'Morning Walk', desc: 'Step outside within 30 minutes of waking for solar synchronization.', icon: <Sun className="w-5 h-5 text-yellow-400" /> },
            { title: 'Hydration', desc: 'Aim for 2.5 liters of clean water spread evenly across the day.', icon: <Wind className="w-5 h-5 text-cyan-400" /> },
            { title: 'Healthy meals', desc: 'Stable blood sugar avoids sudden fatigue-induced mood swings.', icon: <Egg className="w-5 h-5 text-orange-400" /> },
            { title: 'Social interaction', desc: 'Schedule brief checks with family or close friends to prevent withdrawal.', icon: <Users className="w-5 h-5 text-purple-400" /> },
            { title: 'Reading & Hobbies', desc: 'Unwind with calming hobbies that limit energetic stimulus.', icon: <BookOpen className="w-5 h-5 text-cyan-400" /> },
            { title: 'Mood journal', desc: 'Note feelings, sleep anomalies, and triggers at the end of the day.', icon: <FileText className="w-5 h-5 text-cyan-400" /> }
          ].map((hab, idx) => (
            <div key={idx} className="flex gap-3 bg-slate-900/30 p-3.5 rounded-xl border border-slate-850 items-start">
              <div className="p-2 bg-slate-950 rounded-lg flex-shrink-0">
                {hab.icon}
              </div>
              <div>
                <h4 className="font-bold text-slate-200 leading-tight">{hab.title}</h4>
                <p className="text-[11px] text-slate-450 mt-1 leading-normal">{hab.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 9. When to Seek Help Page
export function SeekHelpPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4 text-left text-xs">
      <PageHeader title="Seeking Professional Guidance" subtitle="Warning indicators and counseling references" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch">
        
        {/* Warning signs Left */}
        <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 border-b border-slate-800/50 pb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" /> Warning Indicators
            </h3>
            <p className="text-slate-400 leading-relaxed">
              If you observe the following symptoms, we recommend consulting a psychiatrist or visiting a therapist:
            </p>
            <ul className="flex flex-col gap-2.5 text-slate-300 font-semibold list-disc pl-4 mt-3 leading-relaxed">
              <li>Frequent, extreme swings in mood</li>
              <li>Inability to carry out daily tasks</li>
              <li>Struggling to sleep for multiple days</li>
              <li>High-risk or impulsive behaviors</li>
              <li>Feelings of despair or self-harm</li>
              <li>Auditory or sensory alterations</li>
            </ul>
          </div>
          <button 
            onClick={() => navigate('/specialists')}
            className="w-full mt-4 h-[44px] rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Stethoscope className="w-4.5 h-4.5" /> Consult Psychiatrist
          </button>
        </div>

        {/* Emergency Info Right */}
        <div className="bg-red-500/5 border border-red-500/15 rounded-[20px] p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-2 border-b border-red-500/10 pb-2">
               Emergency Warning Signs
            </h3>
            <p className="text-slate-300 leading-relaxed">
              If you or a loved one are experiencing thoughts of suicide, self-harm, severe depressive episodes, or hallucinations, seek immediate clinical attention.
            </p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-xl border border-red-500/10 mt-3">
            <span className="text-[10px] text-red-400 font-bold block uppercase tracking-wider mb-1">CRISIS SUPPORT INFORMATION</span>
            <p className="text-[11px] text-slate-400 leading-normal">
              Call or text <strong className="text-white">988</strong> to connect with the Crisis Lifeline immediately. Help is confidential, free, and available 24/7.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// 10. Educational Resources Page
export function ResourcesPage() {
  const articles = [
    { title: 'Understanding Bipolar Disorder', desc: 'An overview of cycles, moods, triggers, and daily management.', link: '#edu-intro' },
    { title: 'Types of Bipolar Disorder', desc: 'Differences between Bipolar I, Bipolar II, and Cyclothymia.', link: '#edu-types' },
    { title: 'Mood Episodes Demystified', desc: 'Understanding symptoms of mania, hypomania, and clinical depression.', link: '#edu-episodes' },
    { title: 'Medication Awareness Guidelines', desc: 'A primer on mood stabilizers, antipsychotics, and side-effects.', link: '#edu-meds' },
    { title: 'Therapeutic and Counseling Options', desc: 'CBT and Interpersonal Social Rhythm Therapy (IPSRT) details.', link: '#edu-therapy' },
    { title: 'Caregiver and Family Support Support', desc: 'Guidelines for friends, relatives, and circles supporting patients.', link: '#edu-family' }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4 text-left text-xs">
      <PageHeader title="Educational Resources" subtitle="Learn about symptoms, management, and therapies" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {articles.map((art, idx) => (
          <a 
            key={idx}
            href={art.link}
            className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-5 shadow-xl hover:border-[#384F6E]/30 transition-all duration-300 flex flex-col justify-between h-[155px] group text-left"
          >
            <div>
              <h4 className="font-bold text-white text-sm group-hover:text-[#3b82f6] transition-colors">{art.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{art.desc}</p>
            </div>
            <div className="text-[10px] font-bold text-[#3B82F6] mt-2 block uppercase tracking-wider">
              Read Article →
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// 11. Download Report Page
export function DownloadPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4 text-left text-xs">
      <PageHeader title="Save and Share Results" subtitle="Download or export assessment details" />
      
      <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-xl flex flex-col gap-5 text-center items-center">
        <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
          <Download className="w-8 h-8" />
        </div>
        
        <div>
          <h3 className="text-base font-bold text-white">Save Assessment Report</h3>
          <p className="text-slate-405 mt-1.5 max-w-md mx-auto leading-relaxed">
            Download your screening metrics (scores, stability indicators, identified symptoms list) as a clinical PDF report to share with a physician.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3.5 mt-2">
          <button 
            onClick={() => alert("Compiling screening report PDF. Download starting shortly...")}
            className="h-[42px] px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center gap-1.5 hover:scale-[1.02] cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download PDF Report
          </button>
          <button 
            onClick={() => window.print()}
            className="h-[42px] px-5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-200 font-bold transition-all flex items-center gap-1.5 hover:scale-[1.02] cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Results
          </button>
          <button 
            onClick={() => alert("Report URL copied securely to clipboard!")}
            className="h-[42px] px-5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-200 font-bold transition-all flex items-center gap-1.5 hover:scale-[1.02] cursor-pointer"
          >
            <Share2 className="w-4 h-4" /> Share Results
          </button>
        </div>
      </div>
    </div>
  );
}

// 12. Assessment History Page
export function HistoryPage() {
  const { pastScreenings } = bipolarInsightsMockData;

  // Custom tooltips for Recharts
  const formatChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1E293B] border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl flex flex-col gap-1 text-xs text-left">
          <p className="text-slate-400 font-semibold">{data.date}</p>
          <div className="flex justify-between gap-6 mt-1">
            <span className="text-violet-400 font-semibold">Symptom Count:</span>
            <span className="font-mono text-white font-bold">{data.symptomCount} / 16</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-cyan-400 font-semibold">Distress Score:</span>
            <span className="font-mono text-white font-bold">{data.distressScore}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4 text-left text-xs">
      <PageHeader title="Assessment History" subtitle="Monitor changes in your results over time" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
        
        {/* Trend Graph Left */}
        <div className="lg:col-span-7 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-xl min-h-[300px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Screening Trend</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Symptom trends mapped historically</p>
          </div>
          
          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pastScreenings} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 16]} tickCount={5} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip content={formatChartTooltip} />
                <ReferenceLine y={6} stroke="#F59E0B" strokeDasharray="4 4" />
                <Line 
                  type="monotone" 
                  dataKey="symptomCount" 
                  stroke="#8B5CF6" 
                  strokeWidth={2.5} 
                  dot={{ fill: '#182235', stroke: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  activeDot={{ fill: '#22D3EE', stroke: '#182235', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Past Records Right */}
        <div className="lg:col-span-5 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-xl min-h-[300px] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Previous Entries</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Assessment records database</p>
          </div>
          
          <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 my-3 pr-1">
            {pastScreenings.map((rec, idx) => (
              <div key={idx} className="bg-slate-900/30 p-3 rounded-xl border border-slate-850 flex justify-between items-center">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-slate-200">{rec.date}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Distress index: {rec.distressScore}</span>
                </div>
                <span className="text-xs font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2.5 py-1 rounded-lg">
                  {rec.symptomCount} / 16 Yes
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800/80 pt-2.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider text-center">
            Assessment counts: {pastScreenings.length} completed
          </div>
        </div>

      </div>
    </div>
  );
}

// 13. Retake Assessment Page
export function RetakePage({ onRetake }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4 text-left text-xs">
      <PageHeader title="Retake Assessment" subtitle="Refresh your diagnostic indicators" />
      
      <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-xl flex flex-col gap-5 text-center items-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center animate-spin-slow">
          <RefreshCw className="w-8 h-8" />
        </div>
        
        <div>
          <h3 className="text-base font-bold text-white">Reset & Start New Assessment</h3>
          <p className="text-slate-405 mt-1.5 max-w-md mx-auto leading-relaxed">
            By initiating a retake, your current quiz answers will be reset to clear new entries. Your historical records will remain saved under your progress timeline.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3.5 mt-2">
          <button 
            onClick={onRetake}
            className="h-[42px] px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all flex items-center gap-1.5 hover:scale-[1.02] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Start New Assessment
          </button>
          <button 
            onClick={() => navigate('/')}
            className="h-[42px] px-5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-205 font-bold transition-all flex items-center gap-1.5 hover:scale-[1.02] cursor-pointer"
          >
            <Compass className="w-4 h-4" /> Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// 14. Severity Index Page
export function SeverityPage({ answers }) {
  const totalSeverity = useMemo(() => {
    return answers.reduce((sum, ans) => {
      if (ans.symptom === true && ans.distress !== null) {
        return sum + ans.distress;
      }
      return sum;
    }, 0);
  }, [answers]);

  const severityLevel = useMemo(() => {
    if (totalSeverity >= 35) return { label: 'Severe Distress', color: 'text-red-400', bg: 'bg-red-500/10' };
    if (totalSeverity >= 18) return { label: 'Moderate Distress', color: 'text-orange-400', bg: 'bg-orange-500/10' };
    if (totalSeverity >= 5) return { label: 'Mild Distress', color: 'text-cyan-400', bg: 'bg-cyan-500/10' };
    return { label: 'Low/No Distress', color: 'text-green-400', bg: 'bg-green-500/10' };
  }, [totalSeverity]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full py-4 text-left text-xs">
      <PageHeader title="Clinical Severity Index" subtitle="Assessment of reported symptoms' distress scores" />
      
      <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-xl flex flex-col gap-5 leading-relaxed">
        
        {/* Severity Banner */}
        <div className="flex items-center gap-3 bg-slate-900/30 p-4 rounded-xl border border-slate-850">
          <div className={`w-12 h-12 rounded-xl ${severityLevel.bg} ${severityLevel.color} flex items-center justify-center`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">DISTRESS SCORE CLASSIFICATION</span>
            <h2 className={`text-2xl font-black ${severityLevel.color}`}>{severityLevel.label}</h2>
          </div>
        </div>

        {/* Score Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Distress Severity</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{totalSeverity}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-405 font-bold">80 Max Points</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden mt-4 shadow-inner">
              <div 
                className={`h-full rounded-full ${totalSeverity >= 35 ? 'bg-red-500' : totalSeverity >= 18 ? 'bg-orange-500' : totalSeverity >= 5 ? 'bg-cyan-400' : 'bg-green-500'}`}
                style={{ width: `${(totalSeverity/80)*100}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-505 font-bold uppercase tracking-wider mt-2.5">
              SEVERITY PERCENTAGE: {Math.round((totalSeverity/80)*100)}%
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Score Interpretation</h4>
              <p className="text-slate-300 font-normal leading-relaxed">
                The severity index aggregates the distress (0-5) scored on each active symptom. Higher scores suggest that reported mood shifts significantly disturb sleep, concentration, or emotional control.
              </p>
            </div>
          </div>
        </div>

        {/* Ranges Explanation */}
        <div className="border-t border-[#384F6E]/15 pt-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Distress Severity Ranges</h3>
          <div className="flex flex-col gap-2 font-semibold">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/20 border border-slate-850">
              <span className="text-green-400">0 - 15: Low/No Distress</span>
              <span className="text-slate-500 text-[10px]">Minimal disturbance to daily functionality</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/20 border border-slate-850">
              <span className="text-cyan-400">16 - 35: Mild Distress</span>
              <span className="text-slate-500 text-[10px]">Intermittent disturbance in sleep and pacing</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/20 border border-slate-850">
              <span className="text-orange-400">36 - 55: Moderate Distress</span>
              <span className="text-slate-500 text-[10px]">Noticeable impact on mood regulation and social relations</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/20 border border-slate-850">
              <span className="text-red-400">56 - 80: Severe Distress</span>
              <span className="text-slate-500 text-[10px]">Severe impairment requiring professional medical attention</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

