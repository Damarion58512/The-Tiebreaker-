import React, { useState } from 'react';
import { ProsConsDecision, ProConItem } from '../types';
import { Plus, Trash2, ShieldAlert, BadgeCheck, Sparkles, Scale, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ProsConsViewProps {
  data: ProsConsDecision;
  onChange: (updatedData: ProsConsDecision) => void;
  status: 'pending' | 'resolved';
  chosenOption?: string;
  onResolve: (chosenOption: string) => void;
}

export default function ProsConsView({
  data,
  onChange,
  status,
  chosenOption,
  onResolve,
}: ProsConsViewProps) {
  const [newText, setNewText] = useState('');
  const [newScore, setNewScore] = useState(5);
  const [newType, setNewType] = useState<'pro' | 'con'>('pro');
  const [explanationText, setExplanationText] = useState('');

  // Local calculation of weighted balance
  const totalProScore = data.pros.reduce((acc, item) => acc + item.score, 0);
  const totalConScore = data.cons.reduce((acc, item) => acc + item.score, 0);
  const totalScoreCombine = totalProScore + totalConScore;
  const proPercentage = totalScoreCombine > 0 ? Math.round((totalProScore / totalScoreCombine) * 100) : 50;

  const handleScoreChange = (index: number, type: 'pro' | 'con', increment: boolean) => {
    const list = type === 'pro' ? [...data.pros] : [...data.cons];
    const currentScore = list[index].score;
    let targetScore = increment ? currentScore + 1 : currentScore - 1;
    if (targetScore < 1) targetScore = 1;
    if (targetScore > 10) targetScore = 10;
    
    list[index] = { ...list[index], score: targetScore };
    if (type === 'pro') {
      onChange({ ...data, pros: list });
    } else {
      onChange({ ...data, cons: list });
    }
  };

  const handleSliderChange = (index: number, type: 'pro' | 'con', val: number) => {
    const list = type === 'pro' ? [...data.pros] : [...data.cons];
    list[index] = { ...list[index], score: val };
    if (type === 'pro') {
      onChange({ ...data, pros: list });
    } else {
      onChange({ ...data, cons: list });
    }
  };

  const handleDeleteItem = (index: number, type: 'pro' | 'con') => {
    if (type === 'pro') {
      const list = data.pros.filter((_, i) => i !== index);
      onChange({ ...data, pros: list });
    } else {
      const list = data.cons.filter((_, i) => i !== index);
      onChange({ ...data, cons: list });
    }
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newItem: ProConItem = {
      text: newText.trim(),
      score: newScore,
      explanation: explanationText.trim() || 'Custom entry supplied by you.',
    };

    if (newType === 'pro') {
      onChange({
        ...data,
        pros: [...data.pros, newItem],
      });
    } else {
      onChange({
        ...data,
        cons: [...data.cons, newItem],
      });
    }

    setNewText('');
    setExplanationText('');
    setNewScore(5);
  };

  const getMeterColor = () => {
    if (proPercentage > 60) return 'bg-emerald-500';
    if (proPercentage < 40) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const getMeterText = () => {
    if (proPercentage > 65) return 'Strongly favors Pro Option';
    if (proPercentage > 55) return 'Slightly favors Pro Option';
    if (proPercentage > 45) return 'Even Balanced Tiebreaker territory';
    if (proPercentage > 35) return 'Slightly favors Con Option';
    return 'Strongly favors Con Option';
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Recommendation Gauge */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" id="scale-icon" />
              Dynamic Balance Scorecard
            </h3>
            <p className="text-sm text-gray-500">
              The AI computed the starting parameters. Drag slides or add variables to watch the math tilt the balance.
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-extrabold font-display text-gray-900">
              {proPercentage}% <span className="text-lg font-normal text-gray-400">Pro bias</span>
            </div>
            <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest mt-1">
              {getMeterText()}
            </p>
          </div>
        </div>

        {/* Visual Gauge track */}
        <div className="mt-6">
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex relative">
            <div className="absolute left-[50%] top-0 bottom-0 border-l border-dashed border-gray-400 z-10"></div>
            <div 
              className={`h-full transition-all duration-500 ease-out flex items-center justify-end pr-2 ${getMeterColor()}`}
              style={{ width: `${proPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-semibold uppercase text-gray-400 tracking-wider mt-2">
            <span>Con Arguments ({totalConScore} pts)</span>
            <span>Pro Arguments ({totalProScore} pts)</span>
          </div>
        </div>
      </div>

      {/* Two Columns for Pros & Cons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pros Column (Success Card theme) */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <h4 className="text-lg font-bold text-emerald-800">Pros / Advantages</h4>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                Total Score: {totalProScore}
              </span>
            </div>

            {data.pros.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-6 text-center">No advantages listed. Add one below!</p>
            ) : (
              <div className="space-y-4">
                {data.pros.map((item, idx) => (
                  <motion.div
                    key={`pro-${idx}`}
                    layoutId={`pro-card-${idx}`}
                    className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-50 flex flex-col gap-3 group relative transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-sm font-semibold text-gray-900">{item.text}</span>
                        <p className="text-xs text-gray-600 leading-relaxed pr-6">{item.explanation}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(idx, 'pro')}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                        title="Delete pro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Elastic Score Slider */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-emerald-700 shrink-0 bg-emerald-100/50 px-2 py-0.5 rounded">
                        Weight: {item.score}/10
                      </span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={item.score}
                        onChange={(e) => handleSliderChange(idx, 'pro', Number(e.target.value))}
                        className="w-full accent-emerald-600 h-1 bg-emerald-100 rounded-lg cursor-pointer"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cons Column (Warning Card theme) */}
        <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <h4 className="text-lg font-bold text-amber-800">Cons / Disadvantages</h4>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                Total Score: {totalConScore}
              </span>
            </div>

            {data.cons.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-6 text-center">No risks or warnings listed. Clear skies!</p>
            ) : (
              <div className="space-y-4">
                {data.cons.map((item, idx) => (
                  <motion.div
                    key={`con-${idx}`}
                    layoutId={`con-card-${idx}`}
                    className="p-4 rounded-xl bg-amber-50/40 border border-amber-50 flex flex-col gap-3 group relative transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-sm font-semibold text-gray-900">{item.text}</span>
                        <p className="text-xs text-gray-600 leading-relaxed pr-6">{item.explanation}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(idx, 'con')}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                        title="Delete con"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Elastic Score Slider */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-amber-700 shrink-0 bg-amber-100/50 px-2 py-0.5 rounded">
                        Weight: {item.score}/10
                      </span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={item.score}
                        onChange={(e) => handleSliderChange(idx, 'con', Number(e.target.value))}
                        className="w-full accent-amber-600 h-1 bg-amber-100 rounded-lg cursor-pointer"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Custom Factor Widget */}
      <div className="bg-gray-50 border border-gray-200/60 rounded-2xl p-6">
        <h5 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-indigo-600" /> Adopt Your Own Factor
        </h5>
        <form onSubmit={handleAddCustomItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Type
              </label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setNewType('pro')}
                  className={`flex-1 py-2 text-xs font-bold text-center transition-colors ${
                    newType === 'pro'
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-750 hover:bg-gray-100 bg-white'
                  }`}
                >
                  Pro
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('con')}
                  className={`flex-1 py-2 text-xs font-bold text-center transition-colors ${
                    newType === 'con'
                      ? 'bg-amber-600 text-white'
                      : 'text-gray-750 hover:bg-gray-100 bg-white'
                  }`}
                >
                  Con
                </button>
              </div>
            </div>

            <div className="md:col-span-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Factor Name
              </label>
              <input
                type="text"
                placeholder="e.g. Higher commute time of 40 mins"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Importance ({newScore}/10)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={newScore}
                  onChange={(e) => setNewScore(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1 bg-gray-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Personalized Explanation (Optional)
            </label>
            <input
              type="text"
              placeholder="Detail your feelings on this risk or benefit..."
              value={explanationText}
              onChange={(e) => setExplanationText(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Factor
            </button>
          </div>
        </form>
      </div>

      {/* AI Consulting Insights Block */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" id="ai-icon-insights" />
            AI Tiebreaker Consulting & Verdict
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">Custom perspective crafted by Gemini to explore deeper nuances.</p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">AI Analytical Verdict</span>
            <p className="text-sm text-gray-700 leading-relaxed font-light">{data.verdict}</p>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-50 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900">
              <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-900">The Ultimate Tiebreaker Criterion</span>
            </div>
            <p className="text-sm text-indigo-950 font-medium leading-relaxed italic">{data.tiebreakerAdvice}</p>
          </div>
        </div>
      </div>

      {/* Decision Finalizer */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-6 md:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h4 className="text-xl font-bold tracking-tight">Set Your Course: Resolve This Debate</h4>
            <p className="text-sm text-indigo-100 max-w-xl">
              Break the cycle of hesitation. After adjusting weights and exploring insights, record your final active choice!
            </p>
          </div>

          {status === 'resolved' ? (
            <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 flex items-center gap-2 shrink-0">
              <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs text-indigo-100 font-semibold uppercase tracking-wider">Decision Recorded</p>
                <p className="text-sm font-bold text-white">Chose Option: {chosenOption}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => onResolve('Pursue Proposed Path')}
                className="bg-white text-indigo-950 hover:bg-indigo-50 text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
              >
                Pursue Decision
              </button>
              <button
                onClick={() => onResolve('Decline / Postpone')}
                className="bg-indigo-300/20 text-white hover:bg-white/10 border border-white/20 text-sm font-bold px-5 py-2.5 rounded-xl transition-all"
              >
                Decline / Stop
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
