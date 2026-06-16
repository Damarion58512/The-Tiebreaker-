export interface ProConItem {
  text: string;
  score: number;
  explanation: string;
}

export interface ProsConsDecision {
  title: string;
  description: string;
  pros: ProConItem[];
  cons: ProConItem[];
  recommendation: 'highly_recommend' | 'recommend' | 'neutral' | 'caution' | 'avoid';
  verdict: string;
  tiebreakerAdvice: string;
}

export interface OptionScore {
  optionName: string;
  score: number;
  detail: string;
}

export interface CriterionItem {
  criteriaName: string;
  weight: number; // 1-5
  optionScores: OptionScore[];
}

export interface ComparisonDecision {
  title: string;
  description: string;
  options: string[];
  criteria: CriterionItem[];
  overallWinner: string;
  verdictReasoning: string;
  tiebreakerAdvice: string;
}

export interface SwotItem {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface StrategicAdvice {
  leverageStrengths: string;
  mitigateWeaknesses: string;
  tiebreakerAction: string;
}

export interface SwotDecision {
  title: string;
  description: string;
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
  strategicAdvice: StrategicAdvice;
  verdict: string;
}

export interface SavedDecision {
  id: string;
  createdAt: string;
  decisionStatement: string;
  type: 'pros_cons' | 'comparison' | 'swot';
  additionalContext?: string;
  data: ProsConsDecision | ComparisonDecision | SwotDecision;
  status: 'pending' | 'resolved';
  chosenOption?: string; // option chosen or 'True / Pursue' etc
  satisfactionRating?: number; // 1-5 rating on final chosen decision
}
