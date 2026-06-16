import React, { useState } from 'react';
import { SwotDecision, SwotItem } from '../types';
import { ShieldAlert, Sparkles, Scale, AlertCircle, BadgeCheck, Zap, HelpCircle, HeartPulse, ShieldCheck, ArrowRight } from 'lucide-react';

interface SwotViewProps {
  data: SwotDecision;
  onChange: (updatedData: SwotDecision) => void;
  status: 'pending' | 'resolved';
  chosenOption?: string;
  onResolve: (chosenOption: string) => void;
}

export default function SwotView({
  data,
  onChange,
  status,
  chosenOption,
  onResolve,
}: SwotViewProps) {
  const [impactFilter, setImpactFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Filter items
  const filterList = (items: SwotItem[]) => {
    if (impactFilter === 'all') return items;
    return items.filter(it => it.impact === impactFilter);
  };

  const getImpactBadge = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high':
        return <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border border-rose-100">High Impact</span>;
      case 'medium':
        return <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-100">Med Impact</span>;
      case 'low':
        return <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border border-slate-200">Low Impact</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview & Impact Filtering toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600 animate-pulse" />
            Interactive Strategic SWOT Analysis
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Internal factors (Strengths/Weaknesses) vs External circumstances (Opportunities/Threats).
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex bg-gray-100 rounded-xl p-0.5 shrink-0 select-none border border-gray-150">
          {(['all', 'high', 'medium', 'low'] as const).map((impact) => (
            <button
              key={impact}
              onClick={() => setImpactFilter(impact)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all duration-150 ${
                impactFilter === impact
                  ? 'bg-white shadow-xs text-indigo-950 font-bold'
                  : 'text-gray-550 hover:text-gray-900'
              }`}
            >
              {impact}
            </button>
          ))}
        </div>
      </div>

      {/* SWOT 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths Card */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <h4 className="font-bold text-lg text-emerald-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-black">S</span>
              Strengths (Internal)
            </h4>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/50 uppercase tracking-widest px-2.5 py-1 rounded-full">
              Core Assets
            </span>
          </div>

          <div className="space-y-3">
            {filterList(data.strengths).length === 0 ? (
              <p className="text-sm font-light text-gray-400 py-4 italic">No items found matching filter criteria.</p>
            ) : (
              filterList(data.strengths).map((it, idx) => (
                <div key={`str-${idx}`} className="p-4 rounded-xl bg-emerald-50/20 border border-emerald-50/40 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-gray-950">{it.title}</span>
                    {getImpactBadge(it.impact)}
                  </div>
                  <p className="text-xs text-gray-650 leading-relaxed font-light">{it.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weaknesses Card */}
        <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <h4 className="font-bold text-lg text-rose-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-rose-500 text-white flex items-center justify-center text-xs font-black">W</span>
              Weaknesses (Internal)
            </h4>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50/50 uppercase tracking-widest px-2.5 py-1 rounded-full">
              Risks & Barriers
            </span>
          </div>

          <div className="space-y-3">
            {filterList(data.weaknesses).length === 0 ? (
              <p className="text-sm font-light text-gray-400 py-4 italic">No items found matching filter.</p>
            ) : (
              filterList(data.weaknesses).map((it, idx) => (
                <div key={`weak-${idx}`} className="p-4 rounded-xl bg-rose-50/20 border border-rose-50/40 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-gray-950">{it.title}</span>
                    {getImpactBadge(it.impact)}
                  </div>
                  <p className="text-xs text-gray-650 leading-relaxed font-light">{it.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Opportunities Card */}
        <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <h4 className="font-bold text-lg text-blue-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs font-black">O</span>
              Opportunities (External)
            </h4>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50/50 uppercase tracking-widest px-2.5 py-1 rounded-full">
              Growth Vectors
            </span>
          </div>

          <div className="space-y-3">
            {filterList(data.opportunities).length === 0 ? (
              <p className="text-sm font-light text-gray-400 py-4 italic">No items found matching filter.</p>
            ) : (
              filterList(data.opportunities).map((it, idx) => (
                <div key={`opp-${idx}`} className="p-4 rounded-xl bg-blue-50/20 border border-blue-50/40 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-gray-950">{it.title}</span>
                    {getImpactBadge(it.impact)}
                  </div>
                  <p className="text-xs text-gray-650 leading-relaxed font-light">{it.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Threats Card */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <h4 className="font-bold text-lg text-amber-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-black">T</span>
              Threats (External)
            </h4>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50/50 uppercase tracking-widest px-2.5 py-1 rounded-full">
              Market Hazards
            </span>
          </div>

          <div className="space-y-3">
            {filterList(data.threats).length === 0 ? (
              <p className="text-sm font-light text-gray-400 py-4 italic">No items found matching filter.</p>
            ) : (
              filterList(data.threats).map((it, idx) => (
                <div key={`thr-${idx}`} className="p-4 rounded-xl bg-amber-50/20 border border-amber-50/40 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-gray-950">{it.title}</span>
                    {getImpactBadge(it.impact)}
                  </div>
                  <p className="text-xs text-gray-650 leading-relaxed font-light">{it.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Strategic Directions Analysis block */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <h4 className="text-lg font-bold text-gray-950 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Actionable SWOT Strategic Directions
          </h4>
          <p className="text-xs text-gray-500">Formulated matrix intersections for defensive and offensive alignment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* S-O Leverage Strategy */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">Offensive Drive</span>
              <span className="text-xs text-gray-400 font-semibold uppercase">Strength + Opportunity</span>
            </div>
            <p className="text-sm text-gray-800 font-medium tracking-tight">Utilizing core Strengths to capitalize on Opportunities:</p>
            <p className="text-xs text-gray-600 leading-relaxed">{data.strategicAdvice.leverageStrengths}</p>
          </div>

          {/* W-T Defensive strategy */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">Defensive Shield</span>
              <span className="text-xs text-gray-400 font-semibold uppercase">Weakness + Threat</span>
            </div>
            <p className="text-sm text-gray-800 font-medium tracking-tight">Improving Weaknesses to safeguard against Threats:</p>
            <p className="text-xs text-gray-600 leading-relaxed">{data.strategicAdvice.mitigateWeaknesses}</p>
          </div>
        </div>

        {/* Strategic Verdict Row */}
        <div className="p-5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">Strategic Pathway Verdict</span>
            <p className="text-sm font-extrabold text-indigo-950">{data.verdict}</p>
          </div>
          <div className="flex items-start gap-2.5 bg-yellow-50/50 border border-yellow-100 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wide text-amber-900 block">Critical Launch Trigger Metric</span>
              <p className="text-xs text-amber-950 font-light mt-0.5 leading-relaxed italic">{data.strategicAdvice.tiebreakerAction}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Finalizer */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-6 md:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h4 className="text-xl font-bold tracking-tight">Commit to Your Strategy</h4>
            <p className="text-sm text-indigo-100 max-w-xl">
              Do the vectors align? Break the debate cycle and record your final choice to pursue or shelve this venture pathway.
            </p>
          </div>

          {status === 'resolved' ? (
            <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 flex items-center gap-2 shrink-0">
              <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs text-indigo-100 font-semibold uppercase tracking-wider">Strategic Intent Saved</p>
                <p className="text-sm font-bold text-white">Decision: {chosenOption}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => onResolve('Pursue Strategy')}
                className="bg-white text-indigo-950 hover:bg-slate-50 text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm"
              >
                Pursue Strategy
              </button>
              <button
                onClick={() => onResolve('Decline / Hold Strategy')}
                className="bg-indigo-300/20 text-white hover:bg-white/10 border border-white/20 text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
              >
                Shelve / Hold
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
