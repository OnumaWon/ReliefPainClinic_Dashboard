
import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Activity, 
  UploadCloud, 
  Stethoscope, 
  TrendingDown, 
  BrainCircuit, 
  LayoutDashboard, 
  Database, 
  DollarSign, 
  LogOut,
  UserCircle,
  ChevronRight,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { PatientRecord, AIInsight, DateRange } from './types';
import { processRawData } from './utils/dataParser';
import Dashboard from './components/Dashboard';
import ClinicalIntelligenceView from './components/ClinicalIntelligenceView';
import RevenueView from './components/RevenueView';
import DateRangePicker from './components/DateRangePicker';
import PatientRegistryView from './components/PatientRegistryView';
import PatientProfileView from './components/PatientProfileView';
import { getClinicalInsights, fetchIcdDescriptions } from './services/geminiService';

type ViewType = 'dashboard' | 'intelligence' | 'records' | 'revenues' | 'profile';

interface NavColorConfig {
  bg: string;
  text: string;
  border: string;
  icon: string;
  accent: string;
}

const NAV_COLORS: Record<ViewType, NavColorConfig> = {
  profile: {
    bg: 'bg-indigo-50/80',
    text: 'text-indigo-700',
    border: 'border-indigo-100',
    icon: 'text-indigo-600',
    accent: 'bg-indigo-600'
  },
  dashboard: {
    bg: 'bg-violet-50/80',
    text: 'text-violet-700',
    border: 'border-violet-100',
    icon: 'text-violet-600',
    accent: 'bg-violet-600'
  },
  revenues: {
    bg: 'bg-emerald-50/80',
    text: 'text-emerald-700',
    border: 'border-emerald-100',
    icon: 'text-emerald-600',
    accent: 'bg-emerald-600'
  },
  intelligence: {
    bg: 'bg-blue-50/80',
    text: 'text-blue-700',
    border: 'border-blue-100',
    icon: 'text-blue-600',
    accent: 'bg-blue-600'
  },
  records: {
    bg: 'bg-amber-50/80',
    text: 'text-amber-700',
    border: 'border-amber-100',
    icon: 'text-amber-600',
    accent: 'bg-amber-600'
  }
};

const App: React.FC = () => {
  const [fullData, setFullData] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });
  const [activeView, setActiveView] = useState<ViewType>('profile');
  const [icdDescriptions, setIcdDescriptions] = useState<Record<string, string>>({});
  const [loadingDescriptions, setLoadingDescriptions] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws);
      
      const processed = processRawData(rawData);
      
      const dates = processed
        .map(r => r.visitDate)
        .filter(d => d)
        .sort((a: string, b: string) => a.localeCompare(b));
      
      const start = dates[0] || '';
      const end = dates[dates.length - 1] || '';
      
      setFullData(processed);
      setDateRange({ start, end });
      setLoading(false);
      setInsights(null); // Reset insights for new dataset
    };
    reader.readAsBinaryString(file);
  };

  // Only fetch descriptions for the most frequent ICD codes to save quota
  useEffect(() => {
    if (fullData.length === 0) return;

    const counts: Record<string, number> = {};
    fullData.forEach(p => {
      const code = p.icd10.split(':')[0].trim();
      if (code && code !== 'Unknown') {
        counts[code] = (counts[code] || 0) + 1;
      }
    });

    const topCodes = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15) // Only fetch top 15 descriptions
      .map(([code]) => code)
      .filter(code => !icdDescriptions[code]);
    
    if (topCodes.length > 0 && !loadingDescriptions) {
      const fetchTop = async () => {
        setLoadingDescriptions(true);
        try {
          const results = await fetchIcdDescriptions(topCodes);
          setIcdDescriptions(prev => ({ ...prev, ...results }));
        } catch (err) {
          console.error("Quota error suppressed in background fetch:", err);
        } finally {
          setLoadingDescriptions(false);
        }
      };
      fetchTop();
    }
  }, [fullData]);

  const triggerAIAnalysis = async () => {
    if (fullData.length === 0 || analyzing) return;
    setAnalyzing(true);
    try {
      const result = await getClinicalInsights(fullData);
      setInsights(result);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return fullData;
    return fullData.filter(r => 
      r.visitDate >= dateRange.start && r.visitDate <= dateRange.end
    );
  }, [fullData, dateRange]);

  const availableDates = useMemo(() => {
    return Array.from(new Set(fullData.map(r => r.visitDate)))
      .filter(d => d)
      .sort((a: string, b: string) => a.localeCompare(b));
  }, [fullData]);

  const NavItem: React.FC<{ 
    view: ViewType; 
    icon: React.ElementType; 
    label: string; 
  }> = ({ view, icon: Icon, label }) => {
    const isActive = activeView === view;
    const colors = NAV_COLORS[view];
    
    return (
      <button
        onClick={() => setActiveView(view)}
        className={`flex items-center gap-3.5 px-6 py-4 rounded-2xl transition-all duration-500 whitespace-nowrap group relative w-full border-2 ${
          isActive 
            ? `${colors.bg} ${colors.text} ${colors.border} shadow-lg shadow-black/5` 
            : 'text-slate-400 bg-transparent border-transparent hover:bg-white hover:shadow-sm hover:text-slate-600'
        }`}
      >
        <Icon className={`w-5 h-5 transition-all duration-500 ${
          isActive ? colors.icon : 'text-slate-300 group-hover:text-slate-500'
        } ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
        <span className={`font-black text-[11px] uppercase tracking-[0.15em] transition-all duration-500 ${
          isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
        }`}>
          {label}
        </span>
        
        {isActive && (
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 ${colors.accent} rounded-r-full shadow-[2px_0_8px_rgba(0,0,0,0.1)]`} />
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar Navigation */}
      {fullData.length > 0 && (
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 relative z-50">
          <div className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-10">
              <div className="bg-indigo-600 p-2.5 rounded-[18px] shadow-lg shadow-indigo-200">
                <Activity className="text-white w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">ChronicPain</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">Enterprise BI</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="px-2 mb-4">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Clinical Dashboard</span>
              </div>
              <NavItem view="profile" icon={UserCircle} label="Patient profile" />
              <NavItem view="dashboard" icon={LayoutDashboard} label="Analytics" />
              <NavItem view="revenues" icon={DollarSign} label="Revenues" />
              <NavItem view="intelligence" icon={BrainCircuit} label="AI Intelligence" />
              <NavItem view="records" icon={Database} label="Patient Registry" />
            </div>
          </div>

          <div className="mt-auto p-8 pt-4">
            <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Status</span>
              </div>
              <p className="text-[11px] font-bold text-slate-600 leading-snug">
                {activeView === 'intelligence' ? 'Clinical Insights Sync' : 
                 activeView === 'revenues' ? 'Revenue Analytics' : 
                 activeView === 'records' ? 'Registry Master View' : 
                 activeView === 'profile' ? 'Pain Relief Hub' : 'Outcomes Analytics'}
              </p>
            </div>

            <button 
              onClick={() => {
                if(window.confirm('Are you sure you want to clear all loaded clinical data?')) {
                  setFullData([]);
                  setInsights(null);
                  setIcdDescriptions({});
                  setActiveView('profile');
                }
              }}
              className="group flex items-center justify-between w-full px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-slate-100 hover:border-rose-100 shadow-sm"
            >
              <span>Clear Dataset</span>
              <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50">
        <div className="max-w-full p-8 lg:p-12 mx-auto">
          {fullData.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[85vh] animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-[64px] p-24 text-center shadow-2xl shadow-indigo-100/20 group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500" />
                
                <div className="mx-auto w-32 h-32 bg-indigo-50 rounded-[40px] flex items-center justify-center mb-10 group-hover:rotate-6 transition-transform duration-500 shadow-inner">
                  <UploadCloud className="w-16 h-16 text-indigo-600" />
                </div>
                <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">Clinical Decision Support</h1>
                <p className="text-slate-500 mb-12 max-w-lg mx-auto leading-relaxed text-xl font-medium opacity-80">
                  Transform complex clinical pain datasets into actionable insights. Upload your Excel files to begin longitudinal analysis.
                </p>
                
                <label className="cursor-pointer inline-flex items-center px-12 py-6 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.25em] rounded-[24px] hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 group/btn">
                  <FileSpreadsheet className="w-6 h-6 mr-4 transition-transform group-hover/btn:scale-110" />
                  Load Clinical Dataset
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleFileUpload}
                    disabled={loading}
                  />
                </label>
                
                {loading && (
                  <div className="mt-12 flex flex-col items-center gap-4 text-indigo-600 animate-pulse">
                    <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Synthesizing records...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {activeView === 'profile' ? 'Pain Relief Clinic Dashboard' : 
                     activeView === 'dashboard' ? 'Medical Outcomes' : 
                     activeView === 'revenues' ? 'Financial Performance' : 
                     activeView === 'intelligence' ? 'Clinical Insights' : 'Data Registry'}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">Comprehensive Clinical Outcomes & Intelligence Suite</p>
                </div>
                
                {activeView === 'intelligence' && !insights && !analyzing && (
                  <button 
                    onClick={triggerAIAnalysis}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    Request AI Analysis
                  </button>
                )}
              </div>

              <DateRangePicker 
                range={dateRange} 
                onChange={setDateRange} 
                availableDates={availableDates} 
              />
              
              <div className="pb-24">
                {activeView === 'dashboard' && (
                  <Dashboard 
                    data={filteredData} 
                    insights={insights} 
                    isAnalyzing={analyzing}
                    icdDescriptions={icdDescriptions}
                    isFetchingIcd={loadingDescriptions}
                  />
                )}
                {activeView === 'revenues' && (
                  <RevenueView 
                    data={filteredData}
                    icdDescriptions={icdDescriptions}
                  />
                )}
                {activeView === 'intelligence' && (
                  <ClinicalIntelligenceView 
                    insights={insights} 
                    isAnalyzing={analyzing} 
                    onRequestAnalysis={triggerAIAnalysis}
                  />
                )}
                {activeView === 'records' && (
                  <PatientRegistryView 
                    data={filteredData}
                  />
                )}
                {activeView === 'profile' && (
                  <PatientProfileView 
                    data={fullData}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default App;
