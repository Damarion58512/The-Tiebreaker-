import React, { useState } from 'react';
import { ComparisonDecision, CriterionItem, OptionScore } from '../types';
import { Plus, Trash2, Trophy, ArrowRight, Sparkles, Scale, AlertCircle, BadgeCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface ComparisonViewProps {
  data: ComparisonDecision;
  onChange: (updatedData: ComparisonDecision) => void;
  status: 'pending' | 'resolved';
  chosenOption?: string;
  onResolve: (chosenOption: string) => void;
}

export default function ComparisonView({
  data,
  onChange,
  status,
  chosenOption,
  onResolve,
}: ComparisonViewProps) {
  const [newCriteriaName, setNewCriteriaName] = useState('');
  const [newWeight, setNewWeight] = useState(3);

  // Initialize option scores with 5s
  const [newOptionScores, setNewOptionScores] = useState<Record<string, { score: number; detail: string }>>(
    data.options.reduce((acc, opt) => ({
      ...acc,
      [opt]: { score: 5, detail: 'User specified factor score.' }
    }), {})
  );

  // Calculate live scores
  // Score = sum of (option score * criteria weight)
  const calculateScores = () => {
    const scoresMap: Record<string, number> = {};
    const maxScoresMap: Record<string, number> = {}; // to compute percentage

    data.options.forEach(opt => {
      scoresMap[opt] = 0;
      maxScoresMap[opt] = 0;
    });

    data.criteria.forEach(crit => {
      crit.optionScores.forEach(optScore => {
        if (scoresMap[optScore.optionName] !== undefined) {
          scoresMap[optScore.optionName] += optScore.score * crit.weight;
          maxScoresMap[optScore.optionName] += 10 * crit.weight;
        }
      });
    });

    return { scoresMap, maxScoresMap };
  };

  const { scoresMap, maxScoresMap } = calculateScores();

  // Find overall live winner
  let liveWinner = data.overallWinner;
  let maxScore = -1;
  data.options.forEach(opt => {
    if (scoresMap[opt] > maxScore) {
      maxScore = scoresMap[opt];
      liveWinner = opt;
    }
  });

  const handleUpdateCriteriaWeight = (critIdx: number, val: number) => {
    const updated = [...data.criteria];
    updated[critIdx] = { ...updated[critIdx], weight: val };
    onChange({ ...data, criteria: updated });
  };

  const handleUpdateOptionScore = (critIdx: number, scoreIdx: number, val: number) => {
    const updated = [...data.criteria];
    const scores = [...updated[critIdx].optionScores];
    scores[scoreIdx] = { ...scores[scoreIdx], score: val };
    updated[critIdx] = { ...updated[critIdx], optionScores: scores };
    onChange({ ...data, criteria: updated });
  };

  const handleDeleteCriteria = (critIdx: number) => {
    const updated = data.criteria.filter((_, i) => i !== critIdx);
    onChange({ ...data, criteria: updated });
  };

  const handleAddFieldChange = (optName: string, score: number, detail: string) => {
    setNewOptionScores(prev => ({
      ...prev,
      [optName]: { score, detail }
    }));
  };

  const handleAddCriteria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriteriaName.trim()) return;

    const scoresList: OptionScore[] = data.options.map(opt => ({
      optionName: opt,
      score: newOptionScores[opt]?.score ?? 5,
      detail: newOptionScores[opt]?.detail || 'Manually loaded parameter.'
    }));

    const newItem: CriterionItem = {
      criteriaName: newCriteriaName.trim(),
      weight: newWeight,
      optionScores: scoresList,
    };

    onChange({
      ...data,
      criteria: [...data.criteria, newItem]
    });

    setNewCriteriaName('');
    setNewWeight(3);
    // Reset inputs
    setNewOptionScores(
      data.options.reduce((acc, opt) => ({
        ...acc,
        [opt]: { score: 5, detail: 'User specified factor score.' }
      }), {})
    );
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Results Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold tracking-tight text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Dynamic Weighted Matrix
            </h3>
            <p className="text-sm text-gray-500">
              Each choice scores against customizable criteria. Adjust weights dynamically to see the champion tilt.
            </p>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 px-4 py-3 rounded-xl text-right">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">Objective Leader</span>
            <span className="text-lg font-bold text-indigo-950 font-display flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              {liveWinner || 'None yet'}
            </span>
          </div>
        </div>

        {/* Score comparison progress indicators */}
        <div className="space-y-4">
          {data.options.map((opt, idx) => {
            const currentScore = scoresMap[opt] || 0;
            const maxScoreOpt = maxScoresMap[opt] || 1;
            const percentage = Math.min(100, Math.max(0, Math.round((currentScore / maxScoreOpt) * 100)));
            const isWinner = opt === liveWinner;

            return (
              <div key={`opt-comparison-${idx}-${opt}`} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className={`font-semibold ${isWinner ? 'text-indigo-950' : 'text-gray-650'}`}>
                    {opt} {isWinner && <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded ml-2">Leader</span>}
                  </span>
                  <span className="text-xs font-mono font-medium text-gray-500">
                    Weighted points: {currentScore} / {maxScoreOpt} ({percentage}%)
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${isWinner ? 'bg-indigo-600' : 'bg-gray-400'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Criteria Cards Matrix */}
      <div className="space-y-6">
        <h4 className="text-lg font-bold text-gray-900">Configured Decision Criteria</h4>
        
        {data.criteria.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-sm font-light text-gray-500">No criteria defined yet. Use the tool below to specify factors.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.criteria.map((crit, critIdx) => (
              <div key={`crit-${critIdx}-${crit.criteriaName}`} className="bg-white rounded-xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                    <div className="space-y-0.5">
                      <span className="text-base font-bold text-gray-950">{crit.criteriaName}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCriteria(critIdx)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Remove criteria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Weight modifier */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                      <span>Criteria Weight (Multiplier)</span>
                      <span className="font-mono font-bold text-indigo-600">{crit.weight}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={crit.weight}
                      onChange={(e) => handleUpdateCriteriaWeight(critIdx, Number(e.target.value))}
                      className="w-full accent-indigo-600 h-1 bg-gray-100 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Option Scores within criteria */}
                  <div className="space-y-3.5 mt-2">
                    {crit.optionScores.map((optScore, scoreIdx) => (
                      <div key={`optscore-${scoreIdx}-${optScore.optionName}`} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-gray-750">{optScore.optionName}</span>
                          <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-slate-800 font-bold">
                            Score: {optScore.score}/10
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={optScore.score}
                          onChange={(e) => handleUpdateOptionScore(critIdx, scoreIdx, Number(e.target.value))}
                          className="w-full accent-slate-800 h-1 bg-slate-100 rounded-lg cursor-pointer"
                        />
                        <p className="text-[11px] text-gray-400 font-light italic leading-relaxed">
                          "{optScore.detail}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Criterion row */}
      <div className="bg-gray-50 border border-gray-200/60 rounded-2xl p-6">
        <h5 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-indigo-600" /> Introduce Custom Evaluation Parameter
        </h5>
        
        <form onSubmit={handleAddCriteria} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-8">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Criterion Title
              </label>
              <input
                type="text"
                placeholder="e.g. Learning Potential, Comfort, Long-term Asset value"
                value={newCriteriaName}
                onChange={(e) => setNewCriteriaName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Importance Weight ({newWeight}/5)
              </label>
              <div className="flex items-center gap-3 py-1.5">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newWeight}
                  onChange={(e) => setNewWeight(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1 bg-gray-200 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Rate each Option for this Criterion
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.options.map((opt, idx) => (
                <div key={`input-${idx}-${opt}`} className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-blue-900 uppercase tracking-widest">{opt}</span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      Score: {newOptionScores[opt]?.score ?? 5}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={newOptionScores[opt]?.score ?? 5}
                    onChange={(e) => handleAddFieldChange(opt, Number(e.target.value), newOptionScores[opt]?.detail || '')}
                    className="w-full accent-indigo-600 h-1 bg-slate-100 cursor-pointer rounded"
                  />
                  <input
                    type="text"
                    placeholder="Short argument word (optional)..."
                    value={newOptionScores[opt]?.detail ?? ''}
                    onChange={(e) => handleAddFieldChange(opt, newOptionScores[opt]?.score ?? 5, e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200/50 rounded px-2.5 py-1 text-xs focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newCriteriaName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Criterion
            </button>
          </div>
        </form>
      </div>

      {/* AI Professional verdict & counseling */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Comparison Consultant Insights
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">Custom analysis computed by Gemini on multidimensional pros/cons.</p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">AI Rationale & Verdict</span>
            <p className="text-sm text-gray-700 leading-relaxed font-light">{data.verdictReasoning}</p>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-50 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900">
              <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-900">Clinching Query</span>
            </div>
            <p className="text-sm text-indigo-950 font-medium leading-relaxed italic">"{data.tiebreakerAdvice}"</p>
          </div>
        </div>
      </div>

      {/* Decision Finalizer */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl p-6 md:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h4 className="text-xl font-bold tracking-tight">Select the Final Champion</h4>
            <p className="text-sm text-indigo-100 max-w-xl">
              Bring clarity to this evaluation. Record which option you are selecting to solve this tiebreaker challenge!
            </p>
          </div>

          {status === 'resolved' ? (
            <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 flex items-center gap-2 shrink-0">
              <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs text-indigo-100 font-semibold uppercase tracking-wider">Decision Recorded</p>
                <p className="text-sm font-bold text-white">Selected Choice: {chosenOption}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.options.map((opt, idx) => (
                <button
                  key={`resolve-${idx}-${opt}`}
                  onClick={() => onResolve(opt)}
                  className="bg-white text-indigo-950 hover:bg-indigo-55 text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm shrink-0"
                >
                  Choose {opt}
                </button>
              ))}
              <button
                onClick={() => onResolve("Undecided / Re-evaluate")}
                className="bg-indigo-300/20 text-white hover:bg-white/10 border border-white/20 text-xs font-bold px-4 py-2 rounded-xl transition-all"
              >
                Undecided
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
