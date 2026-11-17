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
  AlertTriangle,
  Smile,
  Users,
  Sun,
  FileText,
  Printer,
  Share2,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Plus,
  Play,
  RotateCcw,
  Clock,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { schizophreniaDashboardMockData } from '../schizophreniaInsightsMockData';

// Premium Reusable Page Header Layout
function PageHeader({ title, subtitle }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#384F6E]/15 pb-6 mb-8 text-left w-full mt-4">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')}
          className="p-3 bg-[#182235]/80 hover:bg-[#202E48] rounded-full text-slate-200 transition-all border border-[#384F6E]/20 shadow-lg hover:scale-105 cursor-pointer flex items-center justify-center"
          aria-label="Back to overview"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <div className="text-[11px] text-purple-400 font-extrabold uppercase tracking-widest">MindWave Assessment Portal</div>
          <h1 className="text-3xl font-black text-white tracking-wide mt-1">{title}</h1>
          <p className="text-[15px] text-slate-400 mt-1 font-normal leading-relaxed">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

// 1. Overall Risk Level Page
export function RiskPage({ symptomsCount }) {
  const navigate = useNavigate();
  const today = useMemo(() => new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }), []);

  const risk = useMemo(() => {
    if (symptomsCount >= 10) {
      return {
        level: 'High Risk',
        color: 'text-red-400',
        strokeColor: '#EF4444',
        bg: 'bg-red-500/10',
        border: 'border-red-500/25',
        interpretation: 'Critical subthreshold psychotic experiences detected. Immediate clinical consultation is recommended.',
        deg: 150,
        severityIdx: 3,
        confidence: 'High (Clinical range)',
        shortExplanation: 'Multiple significant perceptual or belief alterations reported.',
        concern: 'High clinical concern',
        iconColor: 'text-red-400',
        badge: 'High Risk'
      };
    }
    if (symptomsCount >= 6) {
      return {
        level: 'Moderate Risk',
        color: 'text-orange-400',
        strokeColor: '#F59E0B',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/25',
        interpretation: 'Elevated risk matching early clinical screening thresholds. Professional follow-up advised.',
        deg: 100,
        severityIdx: 2,
        confidence: 'Moderate (Above threshold)',
        shortExplanation: 'Moderate frequency of reported perceptual variations.',
        concern: 'Moderate clinical concern',
        iconColor: 'text-orange-400',
        badge: 'Moderate Risk'
      };
    }
    if (symptomsCount >= 3) {
      return {
        level: 'Mild Risk',
        color: 'text-cyan-400',
        strokeColor: '#22D3EE',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/25',
        interpretation: 'Minor perceptual variations noted; trace environmental stress triggers.',
        deg: 50,
        severityIdx: 1,
        confidence: 'Moderate (Sub-threshold)',
        shortExplanation: 'Trace variations that could be related to stress or fatigue.',
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
      interpretation: 'Perceptual indices remain within typical baselines.',
      deg: 15,
      severityIdx: 0,
      confidence: 'High (Negative screening)',
      shortExplanation: 'Few or no perceptual variations reported. Typical baseline.',
      concern: 'No clinical concern',
      iconColor: 'text-green-400',
      badge: 'Low Risk'
    };
  }, [symptomsCount]);

  return (
    <div className="flex flex-col gap-12 max-w-[1200px] w-full p-6 md:p-10 text-left text-base leading-relaxed">
      
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
                  Assessment metrics derived from the standard PQ-16 clinical scale.
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
                  {symptomsCount >= 6 ? 'Meets initial clinical threshold for subthreshold psychosis.' : 'Does not exceed primary thresholds of subthreshold concern.'}
                </p>
              </div>
              <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/40">
                <div className="flex items-center gap-2 mb-1">
                  <Compass className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Observation</span>
                </div>
                <p className="text-[14px] text-slate-300 leading-relaxed font-normal">
                  Focus area: Sensory shifts and cognitive-emotional changes.
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
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#riskGradientDetail)" strokeWidth="8" strokeLinecap="round" />
              <defs>
                <linearGradient id="riskGradientDetail" x1="0%" y1="0%" x2="100%" y2="0%">
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
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${symptomsCount >= 6 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15' : 'bg-green-500/10 text-green-400 border border-green-500/15'}`}>
                    {symptomsCount >= 10 ? 'Severe' : symptomsCount >= 6 ? 'Elevated' : 'Low'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Sensory Changes</h4>
                <p className="text-[12px] text-slate-400 leading-relaxed">Minor alterations in sensory perception threshold levels.</p>
              </div>

              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 hover:bg-[#1f2d47]/40 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${symptomsCount >= 6 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15' : 'bg-green-500/10 text-green-400 border border-green-500/15'}`}>
                    {symptomsCount >= 10 ? 'Severe' : symptomsCount >= 6 ? 'Elevated' : 'Low'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Perceptual Shifts</h4>
                <p className="text-[12px] text-slate-400 leading-relaxed">Fleeting auditory or visual variations matching screening profiles.</p>
              </div>

              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 hover:bg-[#1f2d47]/40 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                    <Wind className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${symptomsCount >= 6 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/15' : 'bg-green-500/10 text-green-400 border border-green-500/15'}`}>
                    {symptomsCount >= 6 ? 'Elevated' : 'Low'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Stress Vulnerability</h4>
                <p className="text-[12px] text-slate-400 leading-relaxed">Environmental stressors triggering sub-clinical responses.</p>
              </div>

              <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 hover:bg-[#1f2d47]/40 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${symptomsCount >= 10 ? 'bg-red-500/10 text-red-400 border border-red-500/15' : 'bg-green-500/10 text-green-400 border border-green-500/15'}`}>
                    {symptomsCount >= 10 ? 'High' : 'Low'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Cognitive-Emotional</h4>
                <p className="text-[12px] text-slate-400 leading-relaxed">Subtle adjustments in focus, socialization, or emotion baseline.</p>
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
                <li><strong className="text-slate-200">Why this result occurred:</strong> Responses capture early-phase subthreshold vulnerabilities related to environmental stress and sensory processing.</li>
                <li><strong className="text-slate-200">Expected observations:</strong> Minor sleep variations, occasional sensory fluctuations, or trace stress indices.</li>
                <li><strong className="text-slate-200">Clinical significance:</strong> Self-screening scale intended strictly to identify patterns for wellness tracking, not clinical diagnosis.</li>
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
              { label: 'Low Risk', range: '0 - 2 Yes', color: 'text-green-400', activeBg: 'bg-green-500 border-green-400 shadow-[0_0_12px_#10B981]' },
              { label: 'Mild Risk', range: '3 - 5 Yes', color: 'text-cyan-400', activeBg: 'bg-cyan-500 border-cyan-400 shadow-[0_0_12px_#22D3EE]' },
              { label: 'Moderate Risk', range: '6 - 9 Yes', color: 'text-orange-400', activeBg: 'bg-orange-500 border-orange-400 shadow-[0_0_12px_#F59E0B]' },
              { label: 'High Risk', range: '10 - 16 Yes', color: 'text-red-400', activeBg: 'bg-red-500 border-red-400 shadow-[0_0_12px_#EF4444]' }
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

// 2. Screening Score Page
export function ScorePage({ symptomsCount, answers }) {
  const scorePercentage = Math.round((symptomsCount / 16) * 100);
  
  return (
    <div className="flex flex-col gap-8 max-w-[1200px] w-full p-6 md:p-10 text-left text-base leading-relaxed">
      <PageHeader title="Screening Score Profile" subtitle="Detailed question responses data breakdown" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full mb-4">
        
        {/* Circle Progress Left */}
        <div className="lg:col-span-4 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 shadow-2xl flex flex-col items-center justify-between min-h-[340px] h-auto">
          <div className="flex items-center gap-3 self-start">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white tracking-wider">Score Completion</h3>
          </div>
          
          <div className="relative w-44 h-44 flex items-center justify-center mt-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="88" cy="88" r="72" fill="none" stroke="#1E293B" strokeWidth="8" />
              <circle 
                cx="88" 
                cy="88" 
                r="72" 
                fill="none" 
                stroke="#8B5CF6" 
                strokeWidth="8" 
                strokeDasharray={452.4}
                strokeDashoffset={452.4 - (452.4 * scorePercentage) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">{symptomsCount}</span>
              <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-widest">/ 16 Score</span>
            </div>
          </div>

          <span className="text-slate-400 text-sm font-semibold mt-4">Completed screening metrics</span>
        </div>

        {/* Responses Grid Right */}
        <div className="lg:col-span-8 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 shadow-2xl flex flex-col justify-between min-h-[340px] h-auto">
          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4 tracking-wide">Question Responses Breakdown</h2>
            <div className="max-h-56 overflow-y-auto pr-2 flex flex-col gap-2.5">
              {answers.map((ans, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-900/30 p-3.5 rounded-xl border border-slate-850">
                  <span className="text-slate-200 font-semibold text-[15px] truncate max-w-lg">Indicator item flagged (ID: {ans.id})</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    ans.symptom === true 
                      ? 'bg-red-500/10 border border-red-500/25 text-red-400' 
                      : 'bg-green-500/10 border border-green-500/25 text-green-400'
                  }`}>
                    {ans.symptom === true ? 'Yes' : 'No'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// 3. Reality Contact Meter (Stability) Page
export function StabilityPage({ symptomsCount }) {
  const stability = useMemo(() => {
    if (symptomsCount >= 13) return { level: 'Significant Perceptual Shift', color: 'text-red-400', pct: '90%', desc: 'Reflects frequent variations in sensory interpretation, perceptual shifts, or racing cycles.' };
    if (symptomsCount >= 10) return { level: 'Moderate Reality Deviation', color: 'text-orange-400', pct: '70%', desc: 'Reflects mild distress caused by auditory anomalies or cognitive disorganization.' };
    if (symptomsCount >= 6) return { level: 'Mild Reality Deviation', color: 'text-cyan-400', pct: '50%', desc: 'Slight distractions or visual changes under stressful conditions.' };
    if (symptomsCount >= 3) return { level: 'Mostly Anchored', color: 'text-cyan-400', pct: '30%', desc: 'Sensory grounding is well-aligned with minimal deviations logged.' };
    return { level: 'High Reality Anchoring', color: 'text-green-400', pct: '10%', desc: 'Sensory processing matches typical baselines with absolute stability.' };
  }, [symptomsCount]);

  const { trendHistory } = schizophreniaDashboardMockData;

  const formatChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1E293B] border border-slate-700/80 p-4 rounded-xl shadow-2xl flex flex-col gap-1 text-[13px] text-left">
          <p className="text-slate-400 font-semibold">{data.date}</p>
          <div className="flex justify-between gap-6 mt-1">
            <span className="text-purple-400 font-semibold">Score:</span>
            <span className="font-mono text-white font-bold">{data.score} / 16</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] w-full p-6 md:p-10 text-left text-base leading-relaxed">
      <PageHeader title="Reality Contact Telemetry" subtitle="Somatic grounding and anchoring stability tracking" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        
        {/* Reality Meter Left */}
        <div className="lg:col-span-5 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 shadow-2xl flex flex-col justify-between min-h-[350px] h-auto">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Reality Anchor Index</span>
            </div>
            <h3 className={`text-2xl font-black ${stability.color} tracking-wide`}>{stability.level}</h3>
          </div>

          <div className="relative w-full py-8 flex flex-col gap-3">
            <div className="w-full h-3.5 rounded-full bg-gradient-to-r from-green-500 via-cyan-400 via-orange-400 to-red-500 relative">
              <div 
                className="absolute w-5 h-5 -top-0.5 rounded-full bg-white border-2 border-slate-950 shadow-lg transform -translate-x-1/2 transition-all duration-700"
                style={{ left: stability.pct }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-bold text-slate-500 tracking-widest uppercase">
              <span>Anchored</span>
              <span>Deviation</span>
              <span>Perceptual Shift</span>
            </div>
          </div>

          <p className="text-[15px] text-slate-350 leading-relaxed bg-slate-900/35 p-4 rounded-xl border border-slate-850">
            {stability.desc}
          </p>
        </div>

        {/* Chart Right */}
        <div className="lg:col-span-7 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 shadow-2xl flex flex-col justify-between min-h-[350px] h-auto">
          <div>
            <h2 className="text-2xl font-bold text-purple-400 tracking-wide">Screening Trend Analysis</h2>
            <p className="text-sm text-slate-400 mt-1">Historical assessment stability tracking</p>
          </div>

          <div className="h-48 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 16]} tickCount={5} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <ChartTooltip content={formatChartTooltip} />
                <ReferenceLine y={6} stroke="#F59E0B" strokeDasharray="4 4" />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3B82F6" 
                  strokeWidth={3} 
                  dot={{ fill: '#182235', stroke: '#3B82F6', strokeWidth: 2, r: 5 }}
                  activeDot={{ fill: '#22D3EE', stroke: '#182235', strokeWidth: 2, r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

// 4. Symptoms Identified Page
export function SymptomsPage({ answers }) {
  const [expandedSymId, setExpandedSymId] = useState(null);

  const detectedSymptomObjects = useMemo(() => {
    const details = [
      { id: 1, name: 'Anhedonia / Enjoyment Shifts', desc: 'Uninterested in hobbies or social activities that were once highly engaging.', impact: 'May lead to isolation, withdrawal from friends, or flattened affect.' },
      { id: 2, name: 'Perceptual Alterations (Déjà Vu)', desc: 'Frequent feeling that fresh events have been lived through previously.', impact: 'Disorients spatial awareness and timeline continuity.' },
      { id: 3, name: 'Somatic Perceptual Anomalies', desc: 'Experiencing unusual smells or tastes that others do not notice.', impact: 'Can induce anxiety or paranoia regarding nutritional contents.' },
      { id: 4, name: 'Auditory Indicators', desc: 'Hearing clicks, hissing, clapping, or ringing in ears without somatic reasons.', impact: 'Creates mild disorientation and cognitive distractions.' },
      { id: 5, name: 'Cognitive Disorganization', desc: 'Struggling to separate real events from imaginary constructs.', impact: 'Lowers daily task confidence and introduces anxiety.' },
      { id: 6, name: 'Visual Distortions', desc: 'Noticing visual shifts or facial changes in mirrors or in other people.', impact: 'Disrupts social cues and personal self-recognition loops.' },
      { id: 7, name: 'Social Anxiety / Avoidance', desc: 'Intense panic or discomfort when encountering new people.', impact: 'Directly limits occupational tasks or educational collaboration.' },
      { id: 8, name: 'Visual Processing Alterations', desc: 'Seeing shapes, flashes, or images that others apparently cannot perceive.', impact: 'Lowers confidence in navigation and safety settings.' },
      { id: 9, name: 'Auditory Thought Reflection', desc: 'Experiencing internal thoughts as extremely loud or sounding like speech.', impact: 'Causes concentration barriers and sensory overstimulation.' },
      { id: 10, name: 'Idea Reference Patterns', desc: 'Observing special or hidden meanings in shop windows, signs, or ads.', impact: 'Can initiate patterns of hyper-vigilance.' },
      { id: 11, name: 'Passivity / Control Variations', desc: 'Feeling that thoughts are being inserted, blockaded, or controlled by an external source.', impact: 'Increases feelings of vulnerability and distress.' },
      { id: 12, name: 'Sensory Overload', desc: 'Getting highly distracted or over-alert to faint background sounds.', impact: 'Causes extreme sensory fatigue and limits focus.' },
      { id: 13, name: 'Auditory Vocals', desc: 'Hearing voices whispering or speaking, even when no one is close.', impact: 'Introduces significant cognitive distress.' },
      { id: 14, name: 'Persecutory Indicators', desc: 'Feeling that others are actively planning against or targeting you.', impact: 'Causes social isolation and high protective vigilance.' },
      { id: 15, name: 'Somatic Presence Anomalies', desc: 'Sensing a close presence or force, despite no one being visible.', impact: 'Triggers safety panic and night anxiety.' },
      { id: 16, name: 'Somatoform Alterations', desc: 'Feeling that body structures have changed or are not functioning properly.', impact: 'Leads to somatic hyper-fixation.' }
    ];

    const results = [];
    answers.forEach((ans) => {
      if (ans.symptom === true) {
        const item = details.find(d => d.id === ans.id);
        if (item) results.push({ ...item, severity: ans.distress });
      }
    });

    if (results.length === 0) {
      return [
        { id: 1, name: 'Anhedonia / Enjoyment Shifts', desc: 'Decreased interest in social activities.', impact: 'Leads to social isolation.', severity: 3 },
        { id: 12, name: 'Sensory Overload', desc: 'Hypersensitivity to faint background sounds.', impact: 'Causes sensory fatigue.', severity: 2 }
      ];
    }
    return results;
  }, [answers]);

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] w-full p-6 md:p-10 text-left text-base leading-relaxed">
      <PageHeader title="Identified Symptoms Mapped" subtitle="Expand cards to explore details of detected indicators" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {detectedSymptomObjects.map((sym) => {
          const isExpanded = expandedSymId === sym.id;
          return (
            <div 
              key={sym.id} 
              className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-2xl hover:border-[#384F6E]/30 transition-all duration-300 flex flex-col justify-between h-auto cursor-pointer"
              onClick={() => setExpandedSymId(isExpanded ? null : sym.id)}
            >
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-slate-800/40 pb-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-lg font-semibold text-white truncate max-w-[200px] sm:max-w-xs">{sym.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-400/25 px-2.5 py-1 rounded-lg text-[10px]">
                      Distress: {sym.severity}
                    </span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>
                
                {isExpanded ? (
                  <div className="mt-2 text-slate-300 leading-relaxed text-[15px] font-normal flex flex-col gap-3.5" onClick={(e) => e.stopPropagation()}>
                    <p><strong>Clinical Profile:</strong> {sym.desc}</p>
                    <p><strong>Daily Impact:</strong> {sym.impact}</p>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm mt-1">Click to expand clinical descriptions and severity details.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 5. Cognitive Insights Page
export function InsightsPage({ answers = [], symptomsCount = 0, severityScore = 0 }) {
  const [activePhase, setActivePhase] = useState(0);

  const phases = useMemo(() => {
    const activePhases = [];
    
    // Cluster 1: Perceptual / Somatic (Q3, Q4, Q6, Q8)
    const perceptualAns = answers.filter(a => [3, 4, 6, 8].includes(a.id) && a.symptom === true);
    if (perceptualAns.length > 0) {
      const totalDistress = perceptualAns.reduce((acc, a) => acc + (a.distress || 0), 0);
      const avgDistressPct = Math.round((totalDistress / (perceptualAns.length * 5)) * 100);
      activePhases.push({
        title: 'Perceptual & Somatic Shifts',
        num: activePhases.length + 1,
        dotClass: 'bg-cyan-400',
        borderClass: 'border-cyan-400/30',
        glowClass: 'shadow-[0_0_15px_rgba(34,211,238,0.12)]',
        desc: `Flagged ${perceptualAns.length} indicator(s): unusual noises, sensory shifts, or visual shadow cues.`,
        clinicalInsights: `You reported ${perceptualAns.length} perceptual indicator(s) (such as subtle background noises, light shifts, or tactile variations). These indicate sensory integration load under stress rather than established clinical hallucinations.`,
        impacts: [
          { label: 'Sensory Processing Load', pct: `${Math.min(95, 35 + avgDistressPct)}%`, color: 'bg-cyan-400' },
          { label: 'Attention Focus Retention', pct: `${Math.max(15, 100 - avgDistressPct)}%`, color: 'bg-cyan-400' }
        ],
        interventions: 'Introduce sensory grounding such as splashing cold water on your face, holding a textured object, or focusing on 5 physical items in your room.'
      });
    }

    // Cluster 2: Cognitive Disorganization (Q5, Q9, Q11, Q12)
    const cogAns = answers.filter(a => [5, 9, 11, 12].includes(a.id) && a.symptom === true);
    if (cogAns.length > 0) {
      const totalDistress = cogAns.reduce((acc, a) => acc + (a.distress || 0), 0);
      const avgDistressPct = Math.round((totalDistress / (cogAns.length * 5)) * 100);
      activePhases.push({
        title: 'Cognitive & Thought Focus Shifts',
        num: activePhases.length + 1,
        dotClass: 'bg-purple-400',
        borderClass: 'border-purple-500/30',
        glowClass: 'shadow-[0_0_15px_rgba(139,92,246,0.12)]',
        desc: `Flagged ${cogAns.length} indicator(s): thought speed, concentration blocks, or dream/reality blurs.`,
        clinicalInsights: `You flagged ${cogAns.length} cognitive focus indicators (such as racing thoughts, speech flow blocks, or difficulty separating vivid dreams). Thought organization can fluctuate with cognitive strain.`,
        impacts: [
          { label: 'Task Organization Focus', pct: `${Math.max(20, 100 - avgDistressPct)}%`, color: 'bg-purple-400' },
          { label: 'Cognitive Fatigue Accumulation', pct: `${Math.min(90, 40 + avgDistressPct)}%`, color: 'bg-purple-400' }
        ],
        interventions: 'Structure daily tasks into written step-by-step lists, break big goals into 15-minute chunks, and narrate your steps aloud.'
      });
    }

    // Cluster 3: Paranoia & Social Threat Cues (Q7, Q10, Q14, Q15)
    const paranoiaAns = answers.filter(a => [7, 10, 14, 15].includes(a.id) && a.symptom === true);
    if (paranoiaAns.length > 0) {
      const totalDistress = paranoiaAns.reduce((acc, a) => acc + (a.distress || 0), 0);
      const avgDistressPct = Math.round((totalDistress / (paranoiaAns.length * 5)) * 100);
      activePhases.push({
        title: 'Social & Environment Alertness',
        num: activePhases.length + 1,
        dotClass: 'bg-red-400',
        borderClass: 'border-red-500/30',
        glowClass: 'shadow-[0_0_15px_rgba(239,68,68,0.12)]',
        desc: `Flagged ${paranoiaAns.length} indicator(s): heightened suspiciousness, intent tracking, or feeling targeted.`,
        clinicalInsights: `You identified ${paranoiaAns.length} indicators of heightened social alertness or mistrust. Environmental hyper-vigilance often arises when body stress systems remain activated.`,
        impacts: [
          { label: 'Hyper-vigilance Arousal', pct: `${Math.min(95, 50 + avgDistressPct)}%`, color: 'bg-red-400' },
          { label: 'Social Engagement Comfort', pct: `${Math.max(15, 90 - avgDistressPct)}%`, color: 'bg-red-400' }
        ],
        interventions: 'Practice safe grounding spaces, verify security anchors with a trusted confidant, and take quiet breaks in low-stimulus settings.'
      });
    }

    // Cluster 4: Bodily & Identity Changes (Q1, Q2, Q16)
    const bodyAns = answers.filter(a => [1, 2, 16].includes(a.id) && a.symptom === true);
    if (bodyAns.length > 0) {
      const totalDistress = bodyAns.reduce((acc, a) => acc + (a.distress || 0), 0);
      const avgDistressPct = Math.round((totalDistress / (bodyAns.length * 5)) * 100);
      activePhases.push({
        title: 'Somatic & Bodily Perception',
        num: activePhases.length + 1,
        dotClass: 'bg-orange-400',
        borderClass: 'border-orange-500/30',
        glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.12)]',
        desc: `Flagged ${bodyAns.length} indicator(s): body structural shifts, unfamiliarity, or motivation changes.`,
        clinicalInsights: `You noted ${bodyAns.length} somatic/bodily indicator(s) (such as feeling body changes or déjà vu). These experiences represent mild shifts in bodily self-awareness.`,
        impacts: [
          { label: 'Body Grounding Anchoring', pct: `${Math.max(25, 100 - avgDistressPct)}%`, color: 'bg-orange-400' },
          { label: 'Somatic Sensitivity Index', pct: `${Math.min(85, 30 + avgDistressPct)}%`, color: 'bg-orange-400' }
        ],
        interventions: 'Engage in light physical stretching, barefoot walking on safe surfaces, or somatic deep breathing to reinforce physical boundaries.'
      });
    }

    // Baseline fallback if 0 symptoms
    if (activePhases.length === 0) {
      activePhases.push({
        title: 'Healthy Baseline Phase',
        num: 1,
        dotClass: 'bg-green-400',
        borderClass: 'border-green-500/30',
        glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.12)]',
        desc: 'No clinical indicators flagged in your recent screening.',
        clinicalInsights: 'Your responses indicate high reality contact with minimal to no reported perceptual anomalies or cognitive disorganization.',
        impacts: [
          { label: 'Reality Contact Anchoring', pct: '95%', color: 'bg-green-400' },
          { label: 'Cognitive Organization Stability', pct: '90%', color: 'bg-green-400' }
        ],
        interventions: 'Continue standard healthy routines: regular sleep schedules, physical movement, and balanced social interactions.'
      });
    }

    return activePhases;
  }, [answers]);

  const currentPhaseIndex = Math.min(activePhase, phases.length - 1);
  const currentPhase = phases[currentPhaseIndex] || phases[0];

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] w-full p-6 md:p-10 text-left text-base leading-relaxed">
      <PageHeader title="Cognitive Insights Timeline" subtitle="Development and connections between clinical indicators" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        
        {/* Left Column: Timeline Step Cards */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white tracking-wide">Developmental Phases</h3>
            </div>
            <p className="text-sm text-slate-400 leading-normal">
              Select a stage to explore dynamic clinical telemetry, daily function tracking, and cognitive coping options.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {phases.map((ph, idx) => {
              const isActive = currentPhaseIndex === idx;
              return (
                <div 
                  key={idx} 
                  onClick={() => setActivePhase(idx)}
                  className={`border rounded-[20px] p-5 cursor-pointer transition-all duration-300 flex items-start gap-4 ${
                    isActive 
                      ? `bg-[#182235]/80 ${ph.borderClass} ${ph.glowClass} border-l-4 scale-[1.02] opacity-100` 
                      : 'bg-[#182235]/40 border-slate-850 opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${ph.dotClass} text-slate-950 font-black flex items-center justify-center flex-shrink-0 text-sm`}>
                    {ph.num}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white leading-snug">{ph.title}</h4>
                    <p className="text-[13px] text-slate-400 mt-1 leading-normal">{ph.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dynamic Deep Diagnostic Interpretation */}
        <div className="lg:col-span-7 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 shadow-2xl flex flex-col justify-between min-h-[480px] h-auto">
          
          <div>
            <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
              <h3 className="text-xl font-bold text-white tracking-wide">Phase {currentPhase.num}: {currentPhase.title}</h3>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold bg-slate-900/50 border border-slate-800 ${currentPhase.dotClass.replace('bg-', 'text-')}`}>
                Clinical Mapped Data
              </span>
            </div>

            <div className="flex flex-col gap-4 text-[15px] text-slate-300">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Diagnostic Explanation</h4>
                <p className="leading-relaxed font-sans">{currentPhase.clinicalInsights}</p>
              </div>

              {/* Cognitive Telemetry stats */}
              <div className="mt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estimated Function Retention</h4>
                <div className="flex flex-col gap-3">
                  {currentPhase.impacts.map((imp, impIdx) => (
                    <div key={impIdx} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-350">
                        <span>{imp.label}</span>
                        <span>{imp.pct}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full ${imp.color}`} style={{ width: imp.pct }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/35 p-5 border border-slate-850 rounded-xl mt-6">
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-purple-400" /> Grounding Intervention
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">{currentPhase.interventions}</p>
          </div>

        </div>

      </div>
    </div>
  );
}

// 6. Grounding Recommendations Page
export function RecommendationsPage({ answers = [] }) {
  const dynamicItems = useMemo(() => {
    const allPool = [
      { id: 1, text: 'Introduce 5-4-3-2-1 sensory grounding exercises daily', cat: 'Grounding', triggerIds: [3, 4, 6, 8] },
      { id: 2, text: 'Maintain a quiet evening wind-down routine for sensory calm', cat: 'Environment', triggerIds: [13, 4] },
      { id: 3, text: 'Keep a structured daily routine to reduce cognitive stress', cat: 'Routine', triggerIds: [7, 10, 14, 15] },
      { id: 4, text: 'Break complex tasks into written single-step checklists', cat: 'Cognitive', triggerIds: [5, 9, 11, 12] },
      { id: 5, text: 'Commit to 15-20 minutes of gentle somatic stretching or walking', cat: 'Somatic', triggerIds: [1, 2, 16] },
      { id: 6, text: 'Log daily perceptual variations and distress scores in a journal', cat: 'Tracking', triggerIds: [] },
      { id: 7, text: 'Limit high-intensity screen stimuli 1 hour before sleep', cat: 'Sleep', triggerIds: [] },
      { id: 8, text: 'Schedule a regular check-in with a trusted friend or advisor', cat: 'Support', triggerIds: [7, 10] },
      { id: 9, text: 'Practice 4-7-8 deep breathing during moments of tension', cat: 'Stress', triggerIds: [4, 7, 13] },
      { id: 10, text: 'Consult a qualified specialist for professional evaluation', cat: 'Clinical', triggerIds: [13, 14, 10, 6] }
    ];

    const flaggedIds = answers.filter(a => a.symptom === true).map(a => a.id);

    const scored = allPool.map(item => {
      let score = 0;
      if (item.triggerIds.length === 0) {
        score = 1;
      } else {
        const matches = item.triggerIds.filter(id => flaggedIds.includes(id));
        score = matches.length * 3;
      }
      return { ...item, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map(item => ({
      id: item.id,
      text: item.text,
      cat: item.cat,
      checked: false
    }));
  }, [answers]);

  const [items, setItems] = useState(dynamicItems);

  useEffect(() => {
    setItems(dynamicItems);
  }, [dynamicItems]);

  const checkedCount = items.filter(i => i.checked).length;
  const progressPct = Math.round((checkedCount / items.length) * 100);

  const toggleItem = (id) => {
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] w-full p-6 md:p-10 text-left text-base leading-relaxed">
      <PageHeader title="Grounding Recommendations" subtitle="Interactive self-care wellness checklist" />
      
      <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 shadow-2xl flex flex-col gap-8 w-full">
        
        {/* Progress header */}
        <div className="flex flex-col gap-3 bg-slate-900/35 p-6 rounded-xl border border-slate-850">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 tracking-wider">
            <span>RECOMMENDATIONS RESOLVED</span>
            <span>{checkedCount} / {items.length} ({progressPct}%)</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden mt-1 shadow-inner">
            <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Checklist */}
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div 
              key={item.id} 
              onClick={() => toggleItem(item.id)}
              className={`flex items-center gap-4 p-4.5 rounded-xl border cursor-pointer transition-all ${
                item.checked 
                  ? 'bg-cyan-500/5 border-cyan-400/35 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.03)]' 
                  : 'bg-[#182235]/40 border-slate-850 hover:border-slate-700 text-slate-200'
              }`}
            >
              <div className={`w-5.5 h-5.5 rounded border flex items-center justify-center transition-all ${
                item.checked ? 'bg-cyan-400 border-cyan-400 text-slate-950' : 'border-slate-600'
              }`}>
                {item.checked && <CheckCircle className="w-4 h-4" />}
              </div>
              <div className="flex-1 flex justify-between items-center">
                <span className="font-semibold text-[15px] sm:text-base">{item.text}</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{item.cat}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// 7. Sleep Guidelines Page
export function SleepPage() {
  return (
    <div className="flex flex-col gap-8 max-w-[1200px] w-full p-6 md:p-10 text-left text-base leading-relaxed">
      <PageHeader title="Sleep Hygiene Guidelines" subtitle="Restoration schedules for sensory and brain stability" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        
        {/* Sleep Score Gauge Left */}
        <div className="lg:col-span-5 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 shadow-2xl flex flex-col items-center justify-between min-h-[350px] h-auto">
          <div className="flex items-center gap-3 self-start">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white tracking-wider">Sleep Metric</h3>
          </div>
          
          <div className="relative w-44 h-44 flex items-center justify-center mt-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="88" cy="88" r="72" fill="none" stroke="#1E293B" strokeWidth="8" />
              <circle cx="88" cy="88" r="72" fill="none" stroke="#06B6D4" strokeWidth="8" strokeDasharray="452.4" strokeDashoffset="113" strokeLinecap="round" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white">75</span>
              <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-widest">Sleep Index</span>
            </div>
          </div>

          <span className="text-xs text-slate-505 font-bold uppercase tracking-widest">Consistency rating: High</span>
        </div>

        {/* Timeline Right */}
        <div className="lg:col-span-7 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 shadow-2xl flex flex-col justify-between min-h-[350px] h-auto">
          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4 tracking-wide">Sleep Wind-down Timeline</h2>
            <div className="flex flex-col gap-4 font-semibold text-slate-200">
              <div className="flex items-center gap-4 bg-slate-900/35 p-4 rounded-xl border border-slate-850">
                <span className="text-purple-400 font-mono text-base flex-shrink-0 w-20">9:00 PM</span>
                <span className="text-[15px] sm:text-base">Shut down all blue-light screen devices.</span>
              </div>
              <div className="flex items-center gap-4 bg-slate-900/35 p-4 rounded-xl border border-slate-850">
                <span className="text-purple-400 font-mono text-base flex-shrink-0 w-20">9:30 PM</span>
                <span className="text-[15px] sm:text-base">Dim room lights; complete breathing grounding exercises.</span>
              </div>
              <div className="flex items-center gap-4 bg-slate-900/35 p-4 rounded-xl border border-slate-850">
                <span className="text-purple-400 font-mono text-base flex-shrink-0 w-20">10:00 PM</span>
                <span className="text-[15px] sm:text-base">Bedtime schedule; room should be kept dark & cool.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// 8. Stress Management Page
export function StressPage({ answers = [], severityScore = 0 }) {
  const [expandedAct, setExpandedAct] = useState(null);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingText, setBreathingText] = useState('Inhale');

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

  const activities = useMemo(() => {
    const flaggedIds = answers.filter(a => a.symptom === true).map(a => a.id);
    const hasAuditory = flaggedIds.includes(4) || flaggedIds.includes(13);
    const hasPerceptual = flaggedIds.includes(3) || flaggedIds.includes(6) || flaggedIds.includes(8);
    const hasCog = flaggedIds.includes(5) || flaggedIds.includes(9) || flaggedIds.includes(11) || flaggedIds.includes(12);
    const hasParanoia = flaggedIds.includes(7) || flaggedIds.includes(10) || flaggedIds.includes(14);
    const hasSomatic = flaggedIds.includes(2) || flaggedIds.includes(16) || flaggedIds.includes(1);

    const pool = [
      {
        id: 'breath',
        title: 'Deep Paced Breathing (4-4-4)',
        duration: '5 Mins',
        diff: 'Easy',
        priority: (hasAuditory || hasParanoia) ? 10 : 4,
        benefit: 'Lowers autonomic heart acceleration and calms nervous system arousal.',
        desc: 'Focusing on rhythmic slow breaths (Inhale 4s -> Hold 4s -> Exhale 4s) helps reduce auditory hyper-awareness and anxiety.'
      },
      {
        id: 'sensory',
        title: '5-4-3-2-1 Sensory Grounding Routine',
        duration: '7 Mins',
        diff: 'Easy',
        priority: hasPerceptual ? 10 : 5,
        benefit: 'Anchors perception to tangible physical surroundings.',
        desc: 'Identify 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste to shift attention away from perceptual anomalies.'
      },
      {
        id: 'cognitive',
        title: 'Cognitive Task Structuring',
        duration: '10 Mins',
        diff: 'Medium',
        priority: hasCog ? 10 : 3,
        benefit: 'Reduces working memory overload and mental disorganization.',
        desc: 'Break daily activities into written sequential steps and narrate actions aloud to preserve focus.'
      },
      {
        id: 'yoga',
        title: 'Somatic Yoga Stretches',
        duration: '15 Mins',
        diff: 'Medium',
        priority: hasSomatic ? 10 : 3,
        benefit: 'Releases somatic muscle stress in neck and shoulders.',
        desc: 'Gentle stretching targets physical tension and improves bodily self-awareness.'
      },
      {
        id: 'journal',
        title: 'Grounding Thought Journaling',
        duration: '10 Mins',
        diff: 'Easy',
        priority: hasParanoia ? 9 : 2,
        benefit: 'Identifies cognitive trigger patterns and tests worrying assumptions.',
        desc: 'Logging observations clears thoughts and tracks perceptual deviations systematically.'
      },
      {
        id: 'coldwater',
        title: 'Cold Water Somatic Reset',
        duration: '2 Mins',
        diff: 'Easy',
        priority: severityScore > 20 ? 9 : 1,
        benefit: 'Triggers the dive reflex to rapidly drop high distress arousal.',
        desc: 'Splash cool water on your face or hold an ice cube wrapped in cloth for 30 seconds to anchor your body sensory system.'
      }
    ];

    pool.sort((a, b) => b.priority - a.priority);
    return pool;
  }, [answers, severityScore]);

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] w-full p-6 md:p-10 text-left text-base leading-relaxed">
      <PageHeader title="Stress Management & Grounding" subtitle="Routines and somatic exercises to manage daily triggers" />
      
      <div className="flex flex-col gap-5 w-full">
        {activities.map((act) => {
          const isExpanded = expandedAct === act.id;
          return (
            <div 
              key={act.id} 
              className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-6 shadow-2xl hover:border-[#384F6E]/30 transition-all duration-300 cursor-pointer"
              onClick={() => setExpandedAct(isExpanded ? null : act.id)}
            >
              <div className="flex justify-between items-center border-b border-slate-800/40 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0">
                    <Wind className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{act.title}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="text-slate-400">{act.duration}</span>
                  <span className="text-purple-400">•</span>
                  <span className="text-[#3B82F6]">{act.diff}</span>
                </div>
              </div>
              
              {isExpanded ? (
                <div className="mt-4 flex flex-col gap-4 text-slate-300 leading-relaxed text-[15px] font-normal" onClick={(e) => e.stopPropagation()}>
                  <p>{act.desc}</p>
                  <p><strong>Benefit:</strong> {act.benefit}</p>
                  
                  {act.id === 'breath' && (
                    <div className="mt-3 bg-slate-950/40 border border-slate-850 p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex flex-col gap-1 text-left">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Breathing Pacing Circle:</span>
                        <span className="text-sm font-semibold">Inhale (4s) → Hold (4s) → Exhale (4s)</span>
                      </div>
                      <button 
                        onClick={() => setBreathingActive(!breathingActive)}
                        className={`h-[44px] px-6 text-sm font-bold rounded-full transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          breathingActive 
                            ? 'bg-slate-900 border border-slate-800 text-slate-300' 
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black hover:scale-105'
                        }`}
                      >
                        {breathingActive ? `Pacing: ${breathingText}` : 'Start Exercise'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-sm mt-2">Click to view exercise steps, durations, and clinical grounding benefits.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 9. Daily Wellness Page
export function WellnessPage() {
  const [hydrationCount, setHydrationCount] = useState(2);
  const [habitsCompleted, setHabitsCompleted] = useState([
    { id: 'sun', label: 'Morning sun exposure', done: false },
    { id: 'walk', label: 'Grounding walk', done: false },
    { id: 'journal', label: 'Somatic logs entry', done: false }
  ]);

  const toggleHabit = (id) => {
    setHabitsCompleted(habitsCompleted.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] w-full p-6 md:p-10 text-left text-base leading-relaxed">
      <PageHeader title="Daily Wellness Tracking" subtitle="Log daily habits and fluid tracking variables" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch w-full">
        
        {/* Hydration tracker Card */}
        <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 shadow-2xl flex flex-col justify-between min-h-[250px] h-auto">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg tracking-wide">Hydration Tracker</h3>
            </div>
            <p className="text-sm text-slate-400">Track fluid intake targets (recommended: 8 cups)</p>
          </div>
          
          <div className="my-6 flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">{hydrationCount}</span>
            <span className="text-slate-500 text-lg">/</span>
            <span className="text-slate-400 font-bold text-lg">8 cups</span>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setHydrationCount(Math.min(hydrationCount + 1, 12))}
              className="h-[46px] px-6 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl cursor-pointer transition-all hover:scale-105"
            >
              Add cup +
            </button>
            <button 
              onClick={() => setHydrationCount(0)}
              className="h-[46px] px-6 border border-slate-700 bg-slate-900/60 text-slate-305 font-bold rounded-xl cursor-pointer transition-all hover:bg-slate-800"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Grounding habits Right */}
        <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 shadow-2xl flex flex-col justify-between min-h-[250px] h-auto">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-lg tracking-wide">Grounding Daily Habits</h3>
            </div>
            <p className="text-sm text-slate-400">Click items to toggle daily checklist goals</p>
          </div>
          
          <div className="flex flex-col gap-3 my-4">
            {habitsCompleted.map((h) => (
              <div 
                key={h.id} 
                onClick={() => toggleHabit(h.id)}
                className={`p-3.5 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${
                  h.done ? 'bg-cyan-500/5 border-cyan-400/35 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.02)]' : 'bg-slate-900/20 border-slate-850 text-slate-300'
                }`}
              >
                <span className="font-semibold text-[15px]">{h.label}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{h.done ? 'Completed' : 'Pending'}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// 10. When to Seek Help Page
export function SeekHelpPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-8 max-w-[1200px] w-full p-6 md:p-10 text-left text-base leading-relaxed">
      <PageHeader title="Seeking Professional Guidance" subtitle="Warning indicators and immediate crisis support options" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch w-full">
        
        {/* Warning signs Left */}
        <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 shadow-2xl flex flex-col justify-between min-h-[350px] h-auto">
          <div>
            <div className="flex items-center gap-3 mb-4 border-b border-slate-800/50 pb-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold text-white tracking-wider">Warning Indicators</h3>
            </div>
            <p className="text-slate-400 leading-relaxed font-normal text-sm mb-4">
              Seek a comprehensive clinical consultation if you experience:
            </p>
            <ul className="flex flex-col gap-3 text-slate-200 font-semibold list-disc pl-5 leading-relaxed text-[15px]">
              <li>Frequent, persistent auditory whispers or voices</li>
              <li>Struggling to separate real events from dreams</li>
              <li>Persistent, intense feelings of paranoia</li>
              <li>Severe disruption to work, school, or sleep</li>
              <li>Feeling disconnected from your physical body</li>
              <li>Severe cognitive confusion or thought blocks</li>
            </ul>
          </div>
          <button 
            onClick={() => navigate('/specialists')}
            className="w-full mt-6 h-[48px] rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all hover:scale-105"
          >
            <Stethoscope className="w-5 h-5" /> Consult Specialists
          </button>
        </div>

        {/* Emergency Info Right */}
        <div className="bg-red-500/5 border border-red-500/15 rounded-[20px] p-8 shadow-2xl flex flex-col justify-between min-h-[350px] h-auto">
          <div>
            <div className="flex items-center gap-3 mb-4 border-b border-red-500/10 pb-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-red-400 tracking-wider">Crisis Support</h3>
            </div>
            <p className="text-slate-300 leading-relaxed font-normal text-[15px] sm:text-base">
              If you or a loved one are experiencing thoughts of suicide, self-harm, severe reality deviation, or hallucinations, seek immediate clinical attention.
            </p>
          </div>
          <div className="bg-slate-950/60 p-5 rounded-xl border border-red-500/10 mt-6">
            <span className="text-[11px] text-red-400 font-bold block uppercase tracking-widest mb-1.5">CRISIS SUPPORT INFO</span>
            <p className="text-sm text-slate-400 leading-relaxed">
              Call or text <strong className="text-white">988</strong> to connect with the Crisis Lifeline. Assistance is confidential, free, and available 24/7.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// 11. Educational Resources Page
export function ResourcesPage() {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    { q: 'What is a prodromal phase in schizophrenia?', a: 'The prodromal phase represents early, subthreshold shifts in sensory processing, cognitive disorganization, or social withdrawal occurring before full clinical symptoms emerge.' },
    { q: 'What is CBTp counseling?', a: 'Cognitive Behavioral Therapy for Psychosis (CBTp) is a specialized therapy designed to establish coping mechanisms, examine perceptual anomalies, and lower anxiety levels.' },
    { q: 'How can caregivers offer support?', a: 'Caregivers can establish calm, low-stress daily routines, limit sensory overload conditions in the home, and encourage tracking checklists.' }
  ];

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] w-full p-6 md:p-10 text-left text-base leading-relaxed">
      <PageHeader title="Clinical Educational Center" subtitle="Learn about prodromal phases, therapy modes, and clinical FAQs" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        
        {/* Early Care Left */}
        <div className="lg:col-span-5 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 shadow-2xl flex flex-col justify-between min-h-[320px] h-auto">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white tracking-wider">Early Psychosis Clinics</h3>
            </div>
            <p className="text-slate-300 leading-relaxed font-normal text-[15px] sm:text-base">
              EPI clinics provide early consultation and therapies to lower symptom severity and support cognitive wellness patterns.
            </p>
          </div>
          <div className="bg-slate-900/35 p-5 border border-slate-850 rounded-xl mt-4">
            <h4 className="font-bold text-purple-400 uppercase tracking-widest text-[11px] mb-1.5">EPI Directory Info</h4>
            <p className="text-slate-350 leading-relaxed text-sm">
              EPI programs focus on stabilization, recovery-driven psychotherapy, and cognitive exercises.
            </p>
          </div>
        </div>

        {/* FAQs Accordion Right */}
        <div className="lg:col-span-7 bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 shadow-2xl min-h-[320px] h-auto flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold text-purple-400 mb-4 tracking-wide font-sans">Clinical FAQs</h2>
            <div className="flex flex-col gap-3">
              {faqs.map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <div 
                    key={idx} 
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="p-4 bg-slate-900/35 border border-slate-850 hover:border-slate-700 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="flex justify-between items-center font-bold text-slate-200 text-left text-[15px]">
                      <span>{faq.q}</span>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-550 flex-shrink-0 ml-4" /> : <ChevronDown className="w-5 h-5 text-slate-555 flex-shrink-0 ml-4" />}
                    </div>
                    {isExpanded && (
                      <p className="mt-3 text-slate-350 leading-relaxed font-normal text-sm border-t border-slate-800/40 pt-3">{faq.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// 12. Download Report Page
// 12. Download Report Page
export function DownloadPage({ answers = [], symptomsCount = 0, severityScore = 0, patientName = "Patient", dateString = "" }) {
  return (
    <div className="flex flex-col gap-8 max-w-[1200px] w-full p-6 md:p-10 text-left text-base leading-relaxed">
      <PageHeader title="Save and Share Results" subtitle="Download or export assessment logs details" />
      
      <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 md:p-10 shadow-2xl flex flex-col gap-6 text-center items-center w-full">
        <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center shadow-lg">
          <Download className="w-8 h-8" />
        </div>
        
        <div className="max-w-xl">
          <h3 className="text-2xl font-bold text-white mb-2">Save Assessment Report</h3>
          <p className="text-slate-400 leading-relaxed text-[15px] sm:text-base">
            Download your PQ-16 screening report (symptom counts, reality contact graphs, distress severity indexes) as a clinical PDF to share with a healthcare practitioner.
          </p>
        </div>

        {/* Personalized Report Preview Card */}
        <div className="w-full max-w-lg bg-slate-900/50 border border-slate-850 p-6 rounded-2xl text-left flex flex-col gap-3 my-2">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Clinical Telemetry Snapshot</span>
            <span className="text-xs text-slate-450">{dateString || 'Today'}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <span className="text-[11px] text-slate-500 font-bold block uppercase">PATIENT</span>
              <span className="text-base font-bold text-white">{patientName}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold block uppercase">PQ-16 SCORE</span>
              <span className="text-base font-bold text-cyan-400">{symptomsCount} / 16 Yes</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold block uppercase">DISTRESS POINTS</span>
              <span className="text-base font-bold text-orange-400">{severityScore} / 80 Pts</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-bold block uppercase">RISK CLASSIFICATION</span>
              <span className={`text-base font-bold ${symptomsCount >= 10 ? 'text-red-400' : symptomsCount >= 6 ? 'text-orange-400' : 'text-green-400'}`}>
                {symptomsCount >= 10 ? 'High Risk' : symptomsCount >= 6 ? 'Moderate Risk' : 'Low Risk'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-2 w-full sm:w-auto">
          <button 
            onClick={() => alert(`Compiling PQ-16 screening report PDF for ${patientName}... Download starting shortly.`)}
            className="h-[48px] px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center justify-center gap-2 hover:scale-105 cursor-pointer shadow-lg w-full sm:w-auto"
          >
            <Download className="w-5 h-5" /> Download PDF Report
          </button>
          <button 
            onClick={() => window.print()}
            className="h-[48px] px-6 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-200 font-bold transition-all flex items-center justify-center gap-2 hover:scale-105 cursor-pointer hover:bg-slate-800 w-full sm:w-auto"
          >
            <Printer className="w-5 h-5" /> Print Results
          </button>
          <button 
            onClick={() => alert("Report URL copied securely to clipboard!")}
            className="h-[48px] px-6 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-200 font-bold transition-all flex items-center justify-center gap-2 hover:scale-105 cursor-pointer hover:bg-slate-800 w-full sm:w-auto"
          >
            <Share2 className="w-5 h-5" /> Share Results
          </button>
        </div>
      </div>
    </div>
  );
}

// 13. Assessment History Page
export function HistoryPage({ answers = [], symptomsCount = 0, severityScore = 0 }) {
  const [historyRecords, setHistoryRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');

  useEffect(() => {
    try {
      const storedHist = localStorage.getItem('mindwave_schiz_history');
      if (storedHist) {
        const parsed = JSON.parse(storedHist);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistoryRecords(parsed);
          return;
        }
      }
    } catch (e) {
      console.error("Error loading history", e);
    }

    // Fallback: build entry from current session
    const currentDate = localStorage.getItem('mindwave_schiz_date') || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    setHistoryRecords([
      { date: currentDate, score: symptomsCount, distressScore: severityScore }
    ]);
  }, [symptomsCount, severityScore]);

  const filteredHistory = useMemo(() => {
    return historyRecords.filter((rec) => {
      const matchesSearch = rec.date.toLowerCase().includes(searchQuery.toLowerCase());
      
      const riskLevel = rec.score >= 10 ? 'High' : rec.score >= 6 ? 'Moderate' : 'Low';
      const matchesFilter = filterRisk === 'All' || riskLevel === filterRisk;
      
      return matchesSearch && matchesFilter;
    });
  }, [historyRecords, searchQuery, filterRisk]);

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] w-full p-6 md:p-10 text-left text-base leading-relaxed">
      <PageHeader title="Assessment History Profile" subtitle="Database of all previously logged screening entries" />
      
      <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 shadow-2xl flex flex-col gap-6 w-full">
        
        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row gap-5 items-center justify-between border-b border-slate-800/50 pb-5 w-full">
          <div className="relative w-full sm:max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Search className="w-4.5 h-4.5" />
            </span>
            <input 
              type="text" 
              placeholder="Search record date..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[44px] pl-11 pr-4 bg-slate-950 border border-slate-850 hover:border-slate-700 text-white rounded-xl text-sm outline-none focus:border-purple-500 transition-all font-semibold"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1">
            {['All', 'High', 'Moderate', 'Low'].map((r) => (
              <button 
                key={r}
                onClick={() => setFilterRisk(r)}
                className={`px-4.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex-shrink-0 ${
                  filterRisk === r 
                    ? 'bg-purple-600 text-white shadow-lg scale-105' 
                    : 'bg-slate-900 border border-slate-850 text-slate-350 hover:bg-slate-800'
                }`}
              >
                {r} Risk
              </button>
            ))}
          </div>
        </div>

        {/* Database List */}
        <div className="max-h-64 overflow-y-auto pr-2 flex flex-col gap-3">
          {filteredHistory.length === 0 ? (
            <span className="text-slate-400 italic py-6 block text-center text-sm font-semibold">No assessments match search queries.</span>
          ) : (
            filteredHistory.map((rec, idx) => (
              <div key={idx} className="bg-slate-900/30 p-4.5 rounded-xl border border-slate-850 flex justify-between items-center gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-200 text-base">{rec.date}</span>
                  <span className="text-xs text-slate-500 font-mono">Distress score accumulated: {rec.distressScore}</span>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <span className={`px-3 py-1.5 rounded-lg font-bold text-[10px] tracking-widest uppercase border ${
                    rec.score >= 10 ? 'bg-red-500/10 text-red-400 border-red-500/20' : rec.score >= 6 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
                  }`}>
                    {rec.score >= 10 ? 'High' : rec.score >= 6 ? 'Moderate' : 'Low'} Risk
                  </span>
                  <span className="text-xs font-bold text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/25 px-3 py-1.5 rounded-lg">
                    {rec.score} / 16 Yes
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

// 13. Retake Assessment Page
export function RetakePage({ onRetake }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-8 max-w-[1200px] w-full p-6 md:p-10 text-left text-base leading-relaxed">
      <PageHeader title="Retake Assessment" subtitle="Refresh your clinical reality indicator profiles" />
      
      <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-10 shadow-2xl flex flex-col gap-6 text-center items-center w-full">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center animate-spin-slow shadow-lg">
          <RefreshCw className="w-8 h-8" />
        </div>
        
        <div className="max-w-xl">
          <h3 className="text-2xl font-bold text-white mb-2">Reset & Start New Screening</h3>
          <p className="text-slate-400 leading-relaxed text-[15px] sm:text-base">
            By initiating a retake, your current quiz answers will be reset to clear new entries. Your historical records will remain saved under your progress timeline logs database.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-4 w-full sm:w-auto">
          <button 
            onClick={onRetake}
            className="h-[48px] px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all flex items-center justify-center gap-2 hover:scale-105 cursor-pointer shadow-lg w-full sm:w-auto"
          >
            <RefreshCw className="w-5 h-5" /> Start New Assessment
          </button>
          <button 
            onClick={() => navigate('/')}
            className="h-[48px] px-6 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-200 font-bold transition-all flex items-center justify-center gap-2 hover:scale-105 cursor-pointer hover:bg-slate-800 w-full sm:w-auto"
          >
            <Compass className="w-5 h-5" /> Return to Dashboard
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

  const activeSymptomsCount = useMemo(() => {
    return answers.filter(ans => ans.symptom === true).length;
  }, [answers]);

  const averageSeverity = useMemo(() => {
    if (activeSymptomsCount === 0) return 0;
    return (totalSeverity / activeSymptomsCount).toFixed(1);
  }, [totalSeverity, activeSymptomsCount]);

  const severityLevel = useMemo(() => {
    if (totalSeverity >= 56) return { id: 'severe', label: 'Severe Distress', color: 'text-red-400', strokeColor: '#EF4444', bg: 'bg-red-500/10', border: 'border-red-500/35 shadow-[0_0_20px_rgba(239,68,68,0.18)]' };
    if (totalSeverity >= 36) return { id: 'moderate', label: 'Moderate Distress', color: 'text-orange-400', strokeColor: '#F59E0B', bg: 'bg-orange-500/10', border: 'border-orange-500/35 shadow-[0_0_20px_rgba(245,158,11,0.18)]' };
    if (totalSeverity >= 16) return { id: 'mild', label: 'Mild Distress', color: 'text-cyan-400', strokeColor: '#22D3EE', bg: 'bg-cyan-500/10', border: 'border-cyan-400/35 shadow-[0_0_20px_rgba(34,211,238,0.18)]' };
    return { id: 'low', label: 'Low/No Distress', color: 'text-green-400', strokeColor: '#10B981', bg: 'bg-green-500/10', border: 'border-green-500/35 shadow-[0_0_20px_rgba(16,185,129,0.18)]' };
  }, [totalSeverity]);

  const scorePercentage = Math.round((totalSeverity / 80) * 100);

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] w-full p-6 md:p-10 text-left text-sm sm:text-base leading-relaxed">
      <PageHeader title="Clinical Severity Index" subtitle="Assessment of reported symptoms' distress scores" />
      
      <div className="bg-[#182235]/65 border border-[#384F6E]/15 rounded-[20px] p-8 shadow-2xl flex flex-col gap-8 w-full">
        
        {/* Severity Banner */}
        <div className={`flex items-center gap-4 bg-slate-900/40 p-6 rounded-2xl border transition-all duration-300 ${severityLevel.border}`}>
          <div className={`w-14 h-14 rounded-xl ${severityLevel.bg} ${severityLevel.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block">DISTRESS SCORE CLASSIFICATION</span>
            <h2 className={`text-2xl sm:text-3xl font-black ${severityLevel.color} tracking-wide mt-0.5`}>{severityLevel.label}</h2>
          </div>
        </div>

        {/* 3-Column Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
          
          {/* Column 1: SVG Circular Gauge */}
          <div className="lg:col-span-4 bg-slate-900/30 border border-slate-850 p-6 rounded-2xl flex flex-col items-center justify-center min-h-[285px] h-auto">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-5 block">Distress Points Gauge</span>
            
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="64" fill="none" stroke="#1E293B" strokeWidth="8" />
                <circle 
                  cx="80" 
                  cy="80" 
                  r="64" 
                  fill="none" 
                  stroke={severityLevel.strokeColor} 
                  strokeWidth="8" 
                  strokeDasharray="402.1" 
                  strokeDashoffset={402.1 - (402.1 * scorePercentage) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">{totalSeverity}</span>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">/ 80 Points</span>
              </div>
            </div>
            
            <span className="text-[11px] text-slate-450 font-bold uppercase tracking-wider mt-4">
              SEVERITY PERCENTAGE: {scorePercentage}%
            </span>
          </div>

          {/* Column 2: Score Interpretation */}
          <div className="lg:col-span-5 bg-slate-900/30 border border-slate-855 p-6 rounded-2xl flex flex-col justify-between min-h-[285px] h-auto">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Score Interpretation</h4>
              </div>
              <ul className="flex flex-col gap-2.5 text-slate-300 font-medium text-[15px] list-disc pl-4">
                <li>Aggregates the self-reported distress intensity rating (0-5) scaled for each positive screening indicator.</li>
                <li>Elevated scores suggest perceptual anomalies are actively creating cognitive or sensory friction in daily environments.</li>
                <li>Routinely used to differentiate trace subthreshold experiences from distressing clinical indicators.</li>
              </ul>
            </div>
            <div className="text-[11px] text-purple-400 font-bold uppercase tracking-widest mt-4">
              Calculated dynamically from clinical responses
            </div>
          </div>

          {/* Column 3: Telemetry Statistics */}
          <div className="lg:col-span-3 bg-slate-900/30 border border-slate-855 p-6 rounded-2xl flex flex-col justify-between min-h-[285px] h-auto text-left">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Telemetry Stats</h4>
              </div>
              <div className="flex flex-col gap-4.5">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block uppercase tracking-widest">Active Symptoms</span>
                  <span className="text-2xl font-extrabold text-white">{activeSymptomsCount} / 16</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block uppercase tracking-widest">Average Intensity</span>
                  <span className="text-2xl font-extrabold text-white">{averageSeverity} / 5.0</span>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 italic mt-4 leading-none">
              Distress score per positive symptom.
            </div>
          </div>

        </div>

        {/* Ranges Explanation */}
        <div className="border-t border-[#384F6E]/15 pt-6 w-full">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Distress Severity Ranges</h3>
          <div className="flex flex-col gap-3 font-semibold text-xs sm:text-sm">
            {[
              { id: 'low', range: '0 - 15', label: 'Low/No Distress', desc: 'Minimal disturbance to daily functionality.', color: 'text-green-400', border: 'border-green-500/30 bg-green-500/5' },
              { id: 'mild', range: '16 - 35', label: 'Mild Distress', desc: 'Intermittent distraction in sleep and pacing.', color: 'text-cyan-400', border: 'border-cyan-400/30 bg-cyan-500/5' },
              { id: 'moderate', range: '36 - 55', label: 'Moderate Distress', desc: 'Noticeable impact on reality anchoring and social loops.', color: 'text-orange-400', border: 'border-orange-500/30 bg-orange-500/5' },
              { id: 'severe', range: '56 - 80', label: 'Severe Distress', desc: 'Severe impairment requiring professional medical attention.', color: 'text-red-400', border: 'border-red-500/30 bg-red-500/5' }
            ].map((r) => {
              const isActive = severityLevel.id === r.id;
              return (
                <div 
                  key={r.id} 
                  className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4.5 rounded-xl border transition-all duration-300 ${
                    isActive 
                      ? `${r.border} shadow-[0_0_15px_rgba(255,255,255,0.02)] scale-[1.01] opacity-100` 
                      : 'border-slate-850 bg-slate-900/10 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-black ${isActive ? r.color : 'text-slate-450'}`}>{r.range}</span>
                    <span className="text-slate-500">•</span>
                    <span className={`font-extrabold ${isActive ? r.color : 'text-slate-300'}`}>{r.label}</span>
                  </div>
                  <span className="text-slate-405 text-xs font-normal mt-1 sm:mt-0">{r.desc}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
