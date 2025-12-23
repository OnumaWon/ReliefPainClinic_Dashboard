
import React from 'react';
import { 
  BrainCircuit, 
  Lightbulb, 
  Activity, 
  Target, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight,
  ClipboardList,
  Sparkles,
  TrendingUp,
  Stethoscope,
  RefreshCw
} from 'lucide-react';
import { AIInsight } from '../types';

interface ClinicalIntelligenceViewProps {
  insights: AIInsight | null;
  isAnalyzing: boolean;
  onRequestAnalysis: () => void;
}

const ClinicalIntelligenceView: React.FC<ClinicalIntelligenceViewProps> = ({ insights, isAnalyzing, onRequestAnalysis }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[48px] p-16 relative overflow-hidden shadow-2xl shadow-indigo-200">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="text-white space-y-6 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">Medical AI Report</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">Clinical Intelligence Engine</h1>
            <p className="text-indigo-100 text-xl font-medium leading-relaxed opacity-90">
              Advanced synthesis of clinical outcomes, pain reduction efficacy, and diagnostic distribution patterns using Gemini-3 Pro.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-[40px] border border-white/20 shadow-inner flex flex-col items-center justify-center min-w-[240px]">
            {isAnalyzing ? (
              <>
                <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
                <span className="text-xs font-black text-indigo-100 uppercase tracking-widest animate-pulse">Running Analysis...</span>
              </>
            ) : insights ? (
              <>
                <div className="p-5 bg-emerald-400 rounded-3xl shadow-lg shadow-emerald-400/40 mb-4 animate-bounce">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <span className="text-xs font-black text-emerald-100 uppercase tracking-widest">Model Synchronized</span>
              </>
            ) : (
              <button 
                onClick={onRequestAnalysis}
                className="p-8 bg-indigo-500 hover:bg-indigo-400 rounded-3xl shadow-xl transition-all group active:scale-95"
              >
                <RefreshCw className="w-10 h-10 text-white group-hover:rotate-180 transition-transform duration-500" />
              </button>
            )}
          </div>
        </div>
        
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-indigo-900/40 rounded-full blur-[120px]" />
      </div>

      {!insights ? (
        <div className="bg-white border border-slate-200 rounded-[40px] p-24 text-center space-y-8 shadow-sm">
          <div className="mx-auto w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center">
            <BrainCircuit className="w-12 h-12 text-indigo-200" />
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl font-black text-slate-800">Ready for Clinical Synthesis</h3>
            <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">Click the button in the header or below to generate a comprehensive clinical report based on your specific patient cohort.</p>
            {!isAnalyzing && (
              <button 
                onClick={onRequestAnalysis}
                className="inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 mt-6"
              >
                <Sparkles className="w-5 h-5" />
                Generate AI Intelligence Report
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Executive Summary Section */}
            <section className="bg-white border border-slate-200 rounded-[40px] p-12 shadow-sm relative group overflow-hidden">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-indigo-50 rounded-2xl">
                  <ClipboardList className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Executive Summary</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Clinical Overview</p>
                </div>
              </div>
              
              <div className="relative pl-10 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-2 before:bg-indigo-600 before:rounded-full">
                <p className="text-2xl text-slate-700 leading-relaxed font-medium italic">
                  "{insights.summary}"
                </p>
              </div>
              
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <BrainCircuit className="w-32 h-32 text-indigo-600" />
              </div>
            </section>

            {/* Observations Grid */}
            <section className="bg-white border border-slate-200 rounded-[40px] p-12 shadow-sm">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-emerald-50 rounded-2xl">
                  <Target className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Clinical Observations</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Evidence-Based Findings</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {insights.clinicalObservations.map((obs, i) => (
                  <div key={i} className="flex gap-6 p-6 rounded-[32px] bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all group">
                    <div className="shrink-0 w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-sm font-black text-slate-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-sm">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <p className="text-slate-600 text-lg font-medium leading-relaxed pt-2">{obs}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Strategic Sidebar Column */}
          <div className="space-y-8">
            <section className="bg-indigo-900 border border-indigo-800 rounded-[48px] p-10 shadow-2xl text-white relative overflow-hidden h-full">
              <div className="flex items-center gap-4 mb-12">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Lightbulb className="w-7 h-7 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">Strategic Protocol</h2>
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-0.5">Recommendations</p>
                </div>
              </div>
              
              <div className="space-y-8 relative z-10">
                {insights.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-4 group cursor-default">
                    <div className="shrink-0 mt-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] group-hover:scale-150 transition-transform" />
                    </div>
                    <p className="text-indigo-50 text-base font-bold leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>

              <div className="mt-16 p-6 bg-white/5 rounded-3xl border border-white/10">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-indigo-200 leading-normal">
                    This AI-generated analysis serves as clinical support. Implement protocol changes under certified medical supervision.
                  </p>
                </div>
              </div>
              
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalIntelligenceView;
