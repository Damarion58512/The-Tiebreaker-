import React, { useState, useEffect } from 'react';
import { SavedDecision, ProsConsDecision, ComparisonDecision, SwotDecision } from './types';
import ProsConsView from './components/ProsConsView';
import ComparisonView from './components/ComparisonView';
import SwotView from './components/SwotView';
import { 
  GitCompare, 
  HelpCircle, 
  Scale, 
  Zap, 
  Sparkles, 
  History, 
  Plus, 
  X, 
  Search, 
  CheckCircle, 
  Activity, 
  Star, 
  RotateCcw, 
  BookOpen, 
  TrendingUp, 
  Trash2,
  BookmarkCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DEBATE_ADVICES = [
  "Gemini is mapping out weighted multidimensional trade-offs...",
  "Formulating cross-sectional strategy advice...",
  "Drafting final decisive tiebreaker criteria...",
  "Synthesizing logical variables to resolve analysis bottlenecks..."
];

export default function App() {
  // Decision Form state
  const [decisionStatement, setDecisionStatement] = useState('');
  const [analysisType, setAnalysisType] = useState<'pros_cons' | 'comparison' | 'swot'>('pros_cons');
  const [options, setOptions] = useState<string[]>(['Option A', 'Option B']);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingSentence, setLoadingSentence] = useState(DEBATE_ADVICES[0]);
  const [error, setError] = useState<string | null>(null);
  
  // History list
  const [savedDecisions, setSavedDecisions] = useState<SavedDecision[]>([]);
  const [activeDecisionId, setActiveDecisionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync with localStorage on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tiebreaker_decisions');
      if (stored) {
        const parsed = JSON.parse(stored) as SavedDecision[];
        setSavedDecisions(parsed);
        if (parsed.length > 0) {
          setActiveDecisionId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error("Local storage lookup failed", e);
    }
  }, []);

  // Save to localStorage
  const saveToStorage = (updatedList: SavedDecision[]) => {
    setSavedDecisions(updatedList);
    try {
      localStorage.setItem('tiebreaker_decisions', JSON.stringify(updatedList));
    } catch (e) {
      console.error("Failed to sync to local storage", e);
    }
  };

  // Rotate loading screen prompts
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        const rand = DEBATE_ADVICES[Math.floor(Math.random() * DEBATE_ADVICES.length)];
        setLoadingSentence(rand);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newOptionInput.trim();
    if (!clean) return;
    if (options.includes(clean)) {
      setError("Option name already exists!");
      return;
    }
    setOptions([...options, clean]);
    setNewOptionInput('');
    setError(null);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      setError("Comparison matrix model requires at least 2 parameters to evaluate.");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
    setError(null);
  };

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionStatement.trim()) {
      setError("Please declare a valid decision statement or dilemma!");
      return;
    }
    if (analysisType === 'comparison' && options.length < 2) {
      setError("At least 2 options are required for comparison model.");
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingSentence(DEBATE_ADVICES[0]);

    try {
      const bodyPayload = {
        decision: decisionStatement.trim(),
        type: analysisType,
        options: analysisType === 'comparison' ? options : undefined,
        additionalContext: additionalContext.trim() || undefined
      };

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Server failed to process your decision parameters.");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error("Unable to evaluate. Ensure your parameters conform.");
      }

      const newSavedItem: SavedDecision = {
        id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        createdAt: new Date().toISOString(),
        decisionStatement: decisionStatement.trim(),
        type: analysisType,
        additionalContext: additionalContext.trim() || undefined,
        data: result.data,
        status: 'pending'
      };

      const updatedList = [newSavedItem, ...savedDecisions];
      saveToStorage(updatedList);
      setActiveDecisionId(newSavedItem.id);
      
      // Clean form
      setDecisionStatement('');
      setAdditionalContext('');
    } catch (err: any) {
      setError(err.message || "An unexpected network or gateway error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const activeDecision = savedDecisions.find(d => d.id === activeDecisionId);

  // Update specific active node data
  const handleUpdateActiveData = (updatedData: any) => {
    if (!activeDecisionId) return;
    const updatedList = savedDecisions.map(d => {
      if (d.id === activeDecisionId) {
        return { ...d, data: updatedData };
      }
      return d;
    });
    saveToStorage(updatedList);
  };

  // Close debate with resolution details
  const handleResolveDecision = (chosen: string) => {
    if (!activeDecisionId) return;
    const updatedList = savedDecisions.map(d => {
      if (d.id === activeDecisionId) {
        return { 
          ...d, 
          status: 'resolved' as const, 
          chosenOption: chosen,
          satisfactionRating: 5 // Default starting point, client can adjust
        };
      }
      return d;
    });
    saveToStorage(updatedList);
  };

  // Adjust satisfaction star score
  const handleSetSatisfaction = (idx: number, rating: number) => {
    const updatedList = savedDecisions.map((d, i) => {
      if (i === idx) {
        return { ...d, satisfactionRating: rating };
      }
      return d;
    });
    saveToStorage(updatedList);
  };

  // Hard Reset database
  const handleResetAll = () => {
    if (window.confirm("Are you sure you want to clear your local decision workspace history?")) {
      saveToStorage([]);
      setActiveDecisionId(null);
    }
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedDecisions.filter(d => d.id !== id);
    saveToStorage(updated);
    if (activeDecisionId === id) {
      setActiveDecisionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Analytics Computation
  const statsResolved = savedDecisions.filter(d => d.status === 'resolved').length;
  const statsPending = savedDecisions.filter(d => d.status === 'pending').length;
  const totalAnalyzed = savedDecisions.length;
  
  const averageConfidence = totalAnalyzed > 0 
    ? Math.round(
        (savedDecisions
          .filter(d => d.satisfactionRating !== undefined)
          .reduce((acc, curr) => acc + (curr.satisfactionRating || 5), 0) / 
          (savedDecisions.filter(d => d.satisfactionRating !== undefined).length || 1)) * 10
      ) / 10
    : 5;

  const filteredHistory = savedDecisions.filter(d => 
    d.decisionStatement.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.data?.title?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fafafc] flex flex-col justify-between">
      {/* Absolute top notice */}
      <header className="border-b border-gray-100 bg-white shadow-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Scale className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-xl font-bold font-display tracking-tight text-gray-900 flex items-center gap-1.5">
                The Tiebreaker
                <span className="text-[10px] font-mono tracking-widest bg-indigo-50 text-indigo-700 uppercase px-1.5 py-0.5 rounded-sm font-extrabold border border-indigo-100">
                  v1.2 PRO
                </span>
              </span>
              <p className="text-xs text-gray-400">Dynamic AI criteria weights & logical decision analysis suite</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-gray-400">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{statsResolved} Resolved</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>{statsPending} Pending</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Sandbox Layout Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: INPUT FORM & HISTORY PANEL */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Consultation Input panel */}
            <div className="bg-white rounded-2xl border border-gray-150 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#101827] flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
                  Initiate Evaluation
                </h2>
              </div>

              <form onSubmit={handleRunAnalysis} className="space-y-4">
                {/* Decision Prompt area */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Your Decision Statement
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Should I accept the senior architect offer at Company X or stay at my current web agency?"
                    value={decisionStatement}
                    onChange={(e) => setDecisionStatement(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2.5 text-sm font-sans placeholder-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all resize-none"
                    required
                  />
                </div>

                {/* Analysis framework selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Consultation Framework
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'pros_cons', icon: Scale, label: 'Pros/Cons' },
                      { type: 'comparison', icon: GitCompare, label: 'Compare' },
                      { type: 'swot', icon: Zap, label: 'SWOT Matrix' }
                    ].map((btn) => {
                      const Icon = btn.icon;
                      const active = analysisType === btn.type;
                      return (
                        <button
                          key={btn.type}
                          type="button"
                          onClick={() => setAnalysisType(btn.type as any)}
                          className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-center transition-all ${
                            active 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                              : 'bg-[#fafafa] hover:bg-slate-50 text-gray-650 border-gray-150'
                          }`}
                        >
                          <Icon className="w-4 h-4 mb-1" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{btn.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Matrix Comparison options - conditional */}
                {analysisType === 'comparison' && (
                  <div className="space-y-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                    <span className="block text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      Specify Options to Compare
                    </span>
                    
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {options.map((opt, idx) => (
                        <span 
                          key={`opt-form-${idx}-${opt}`}
                          className="inline-flex items-center gap-1 bg-white border border-indigo-100 text-xs text-indigo-950 px-2 py-1 rounded"
                        >
                          {opt}
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add option (e.g. Move to Austin)"
                        value={newOptionInput}
                        onChange={(e) => setNewOptionInput(e.target.value)}
                        className="flex-grow bg-white border border-gray-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded text-xs font-bold shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Additional Guidance Context */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Guidance / Constraints (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Budget is $4000, value remote work"
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2 text-sm placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal italic">
                    Provides focused guidance so the AI weights can prioritize specific variables.
                  </p>
                </div>

                {/* Trigger button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Evaluate via Gemini
                </button>
              </form>
            </div>

            {/* Quick Metrics panel */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4 shadow-xs">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#101827] flex items-center gap-1 border-b border-gray-100 pb-2">
                <BookmarkCheck className="w-4.5 h-4.5 text-indigo-600" />
                Debate Statistics
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#fafafc] p-3 rounded-xl border border-gray-100 text-center">
                  <span className="text-xs font-medium text-gray-500 block">Total Analyzed</span>
                  <span className="text-2xl font-extrabold font-display text-gray-900">{totalAnalyzed}</span>
                </div>
                <div className="bg-[#fafafc] p-3 rounded-xl border border-gray-100 text-center">
                  <span className="text-xs font-medium text-gray-500 block">Resolved Rate</span>
                  <span className="text-2xl font-extrabold font-display text-gray-900">
                    {totalAnalyzed > 0 ? Math.round((statsResolved / totalAnalyzed) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Archives Section */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#101827] flex items-center gap-1.5">
                  <History className="w-4.5 h-4.5 text-indigo-600" />
                  Saved Debates ({filteredHistory.length})
                </h3>
                {savedDecisions.length > 0 && (
                  <button
                    onClick={handleResetAll}
                    className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1"
                    title="Clear database"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear History
                  </button>
                )}
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search previously evaluated cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 focus:outline-none"
                />
              </div>

              {/* List */}
              {filteredHistory.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-4">No debates archived in this workspace.</p>
              ) : (
                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto pr-1">
                  {filteredHistory.map((dec, idx) => {
                    const isActive = dec.id === activeDecisionId;
                    const typeLabel = dec.type === 'pros_cons' ? 'Pros/Cons' : dec.type === 'comparison' ? 'Compare' : 'SWOT';
                    
                    return (
                      <div
                        key={dec.id}
                        onClick={() => setActiveDecisionId(dec.id)}
                        className={`py-3 px-2 rounded-xl cursor-pointer transition-all flex justify-between items-center ${
                          isActive ? 'bg-indigo-50 border border-indigo-120' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-1 pr-4 min-w-0">
                          <span className="text-xs font-bold text-gray-800 line-clamp-1">
                            {dec.data?.title || dec.decisionStatement}
                          </span>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-indigo-600 font-bold tracking-wider uppercase bg-white px-1.5 py-0.25 rounded border border-indigo-100">
                              {typeLabel}
                            </span>
                            <span className={`font-semibold ${dec.status === 'resolved' ? 'text-emerald-700' : 'text-amber-500'}`}>
                              {dec.status === 'resolved' ? 'Resolved' : 'Pending'}
                            </span>
                          </div>

                           {/* Confidence block for resolved decisions */}
                          {dec.status === 'resolved' && (
                            <div className="flex items-center gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[9px] text-gray-400 uppercase">Rate confidence:</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={`star-${dec.id}-${star}`}
                                    className={`w-3 h-3 cursor-pointer ${
                                      star <= (dec.satisfactionRating || 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                                    }`}
                                    onClick={() => handleSetSatisfaction(idx, star)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => handleDeleteItem(dec.id, e)}
                          className="text-gray-300 hover:text-red-500 p-1 rounded-sm transition-colors"
                          title="Delete entry"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: DETAILS VIEW AREA */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              
              {/* Display Errors */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-800 flex items-start gap-2.5 animate-fade-in">
                  <span className="bg-red-100 text-red-800 text-xs font-bold px-1.5 py-0.5 rounded uppercase mt-0.5">Error</span>
                  <div>
                    <span className="text-sm font-semibold">Workspace Warning:</span>
                    <p className="text-xs text-red-700 leading-relaxed mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Display Loading screen */}
              {loading ? (
                <div className="bg-white border border-gray-150 rounded-3xl p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-6">
                  {/* Rotating spinner */}
                  <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-gray-900 tracking-tight flex items-center justify-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                      Gemini Consulting in Progress...
                    </h4>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto italic">
                      "{loadingSentence}"
                    </p>
                  </div>
                </div>
              ) : activeDecision ? (
                // Active debate sandbox board
                <div className="space-y-6">
                  
                  {/* Header of dynamic active debate */}
                  <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          activeDecision.status === 'resolved' 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                            : 'bg-amber-50 text-amber-800 border border-amber-100'
                        }`}>
                          {activeDecision.status === 'resolved' ? 'Debate Resolved' : 'Draped in Doubt'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(activeDecision.createdAt).toLocaleDateString()} at {new Date(activeDecision.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <h1 className="text-xl md:text-2xl font-black text-gray-950 font-display">
                        {activeDecision.data?.title || activeDecision.decisionStatement}
                      </h1>
                      <p className="text-sm text-gray-500 font-light">
                        {activeDecision.data?.description || activeDecision.decisionStatement}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded">
                        ID: {activeDecision.id}
                      </span>
                    </div>
                  </div>

                  {/* Framework View Renderer */}
                  <div>
                    {activeDecision.type === 'pros_cons' && (
                      <ProsConsView
                        data={activeDecision.data as ProsConsDecision}
                        onChange={handleUpdateActiveData}
                        status={activeDecision.status}
                        chosenOption={activeDecision.chosenOption}
                        onResolve={handleResolveDecision}
                      />
                    )}
                    {activeDecision.type === 'comparison' && (
                      <ComparisonView
                        data={activeDecision.data as ComparisonDecision}
                        onChange={handleUpdateActiveData}
                        status={activeDecision.status}
                        chosenOption={activeDecision.chosenOption}
                        onResolve={handleResolveDecision}
                      />
                    )}
                    {activeDecision.type === 'swot' && (
                      <SwotView
                        data={activeDecision.data as SwotDecision}
                        onChange={handleUpdateActiveData}
                        status={activeDecision.status}
                        chosenOption={activeDecision.chosenOption}
                        onResolve={handleResolveDecision}
                      />
                    )}
                  </div>
                </div>
              ) : (
                // Workspace placeholder landing screen
                <div className="bg-white border border-dashed border-gray-250 rounded-3xl p-12 text-center shadow-xs space-y-6 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50/50 flex items-center justify-center text-indigo-505">
                    <BookOpen className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-xl font-bold tracking-tight text-gray-900 font-display">
                      Welcome to The Tiebreaker
                    </h3>
                    <p className="text-sm text-gray-500 font-light leading-relaxed">
                      Enter a crucial decision statement or debate topic on the left, then trigger Gemini to populate active mathematical balances, weighted scores, and diagnostic matrices.
                    </p>
                  </div>
                  
                  {/* Simple tips to encourage use */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg text-left pt-4 border-t border-gray-100">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">01. Choose Method</span>
                      <p className="text-xs text-gray-600 font-light leading-relaxed">Pros/Cons for basic choices, Comparer for multiple paths, SWOT for strategies.</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">02. Customize Parameters</span>
                      <p className="text-xs text-gray-600 font-light leading-relaxed">Interactively slide score weights (1 to 10) to tilt results based on raw feelings.</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">03. Resolve Dilemma</span>
                      <p className="text-xs text-gray-600 font-light leading-relaxed">Record your chosen pathway once resolved to compute overall workspace stats.</p>
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer credits and reset warnings */}
      <footer className="border-t border-gray-100 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© 2026 The Tiebreaker Decision Workspace. Offline-first local storage safety configuration.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">All systems online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
