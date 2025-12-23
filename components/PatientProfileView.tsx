
import React, { useMemo, useState, useEffect } from 'react';
import { 
  History, 
  Calendar, 
  UserCircle,
  Activity,
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MinusCircle,
  Repeat,
  ChevronRight,
  Search,
  Stethoscope
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart,
  Bar,
  Cell,
  LabelList
} from 'recharts';
import { PatientRecord } from '../types';
import { getPatientClinicalNarrative, PatientNarrative } from '../services/geminiService';

interface PatientProfileViewProps {
  data: PatientRecord[];
}

const PatientProfileView: React.FC<PatientProfileViewProps> = ({ data }) => {
  const [selectedHn, setSelectedHn] = useState<string | null>(null);
  const [patientNarrative, setPatientNarrative] = useState<PatientNarrative | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [repeatSearchTerm, setRepeatSearchTerm] = useState('');

  // Calculate Monthly Patient Volume for the overview
  const monthlyVolume = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(p => {
      const month = p.visitDate.substring(0, 7);
      counts[month] = (counts[month] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  // Calculate Repeat Visits (HNs with > 1 visit in the same month)
  const repeatVisitsData = useMemo(() => {
    const monthHnGroups: Record<string, Record<string, { count: number; name: string; icds: string[] }>> = {};
    
    data.forEach(p => {
      const month = p.visitDate.substring(0, 7);
      if (!monthHnGroups[month]) monthHnGroups[month] = {};
      if (!monthHnGroups[month][p.hn]) {
        monthHnGroups[month][p.hn] = { count: 0, name: p.patientName, icds: [] };
      }
      monthHnGroups[month][p.hn].count += 1;
      if (p.icd10 && !monthHnGroups[month][p.hn].icds.includes(p.icd10)) {
        monthHnGroups[month][p.hn].icds.push(p.icd10);
      }
    });

    const result: Array<{ month: string; hns: Array<{ hn: string; count: number; name: string; icds: string[] }> }> = [];
    
    Object.entries(monthHnGroups).forEach(([month, hns]) => {
      const repeats = Object.entries(hns)
        .filter(([_, info]) => info.count > 1)
        .map(([hn, info]) => ({ hn, count: info.count, name: info.name, icds: info.icds }))
        .sort((a, b) => b.count - a.count);
      
      if (repeats.length > 0) {
        result.push({ month, hns: repeats });
      }
    });

    return result.sort((a, b) => b.month.localeCompare(a.month));
  }, [data]);

  const selectedPatientData = useMemo(() => {
    if (!selectedHn) return null;
    const visits = data.filter(p => p.hn === selectedHn)
      .sort((a, b) => a.visitDate.localeCompare(b.visitDate));
    
    const name = visits[0]?.patientName || 'Unknown Patient';
    
    const painTrend = visits.map(v => ({
      date: v.visitDate,
      initial: v.initialPainScore,
      discharge: v.dischargePainScore,
      shortDate: v.visitDate.split('-').slice(1).join('/')
    }));

    const totalRevenue = visits.reduce((sum, v) => sum + v.revenue, 0);
    const validVisits = visits.filter(v => v.initialPainScore !== null && v.dischargePainScore !== null && v.initialPainScore! > 0);
    const avgPainReduction = validVisits.length > 0 
      ? validVisits.reduce((acc, v) => acc + ((v.initialPainScore! - v.dischargePainScore!) / v.initialPainScore!), 0) / validVisits.length
      : 0;

    return { name, hn: selectedHn, visits, painTrend, totalRevenue, avgImprovement: (avgPainReduction * 100).toFixed(1) };
  }, [data, selectedHn]);

  useEffect(() => {
    if (selectedPatientData && selectedHn) {
      const fetchSummary = async () => {
        setIsGeneratingSummary(true);
        setPatientNarrative(null);
        const narrative = await getPatientClinicalNarrative(selectedPatientData.name, selectedPatientData.visits);
        setPatientNarrative(narrative);
        setIsGeneratingSummary(false);
      };
      fetchSummary();
    }
  }, [selectedHn]);

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'improving': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'declining': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'stable': return <MinusCircle className="w-4 h-4 text-indigo-500" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch(trend) {
      case 'improving': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'declining': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'stable': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  if (selectedPatientData) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-7xl mx-auto">
        <button 
          onClick={() => {
            setSelectedHn(null);
            setPatientNarrative(null);
          }}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </button>

        <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-slate-900 px-10 py-10 text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-[28px] bg-indigo-500 flex items-center justify-center text-3xl font-black shadow-2xl shadow-indigo-500/20">
                {selectedPatientData.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-black tracking-tight mb-2">{selectedPatientData.name}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <span className="bg-white/10 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider">HN: {selectedPatientData.hn}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Active Case</span>
                  <span className="text-slate-400 text-xs font-medium flex items-center gap-2"><History className="w-4 h-4" /> {selectedPatientData.visits.length} Total Visits</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Performance Metrics</p>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600">Avg. Improvement</span>
                      <span className="text-xl font-black text-emerald-600">{selectedPatientData.avgImprovement}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600">Total Revenue</span>
                      <span className="text-lg font-black text-slate-900">฿{selectedPatientData.totalRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                   <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <Calendar className="w-4 h-4 text-indigo-500" />
                     Clinical Timeline
                   </h4>
                   <div className="space-y-5">
                     {selectedPatientData.visits.slice().reverse().map((v, i) => (
                       <div key={i} className="flex gap-4 relative group">
                         {i !== selectedPatientData.visits.length - 1 && (
                           <div className="absolute left-[7px] top-6 bottom-[-20px] w-0.5 bg-slate-100" />
                         )}
                         <div className="w-4 h-4 rounded-full border-2 border-indigo-500 bg-white z-10 mt-1" />
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase">{v.visitDate}</p>
                            <p className="text-sm font-bold text-slate-800 line-clamp-1">{v.icd10.split(':')[1]?.trim() || 'Clinical Review'}</p>
                            <p className="text-[9px] text-indigo-600 font-black uppercase mt-0.5">Dr. {v.doctor}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="bg-indigo-50/50 p-8 rounded-[36px] border border-indigo-100 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-[11px] font-black text-indigo-800 uppercase tracking-[0.2em]">Clinical AI Summary</h3>
                      </div>
                      
                      {patientNarrative && (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getTrendColor(patientNarrative.trend)}`}>
                          {getTrendIcon(patientNarrative.trend)}
                          {patientNarrative.trend}
                        </div>
                      )}
                    </div>

                    {isGeneratingSummary ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-3 text-indigo-400">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Analyzing patterns...</span>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <p className="text-lg font-medium text-slate-700 leading-relaxed">
                          {patientNarrative?.summary || "Analyzing history..."}
                        </p>
                        
                        {patientNarrative?.keyIndicators && (
                          <div className="flex flex-wrap gap-2">
                            {patientNarrative.keyIndicators.map((indicator, idx) => (
                              <div key={idx} className="bg-white border border-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                                <Activity className="w-3 h-3 text-indigo-500" />
                                <span className="text-[11px] font-bold text-slate-600">{indicator}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    Pain Progression
                  </h3>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedPatientData.painTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="shortDate" fontSize={11} stroke="#94a3b8" />
                        <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="initial" name="Initial" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="discharge" name="Discharge" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto py-6">
      {/* Reduced Size Monthly Graph */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative z-10 gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-1">
              <BarChart3 className="w-3 h-3 text-indigo-600" />
              <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Volume Analytics</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Number of Patients</h3>
            <p className="text-xs text-slate-400 font-medium">Monthly clinical admissions across the cohort.</p>
          </div>
          <div className="flex items-center gap-6 bg-slate-50 px-6 py-4 rounded-[28px] border border-slate-100">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-indigo-600 leading-none">{data.length}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Patients</span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-2xl font-black text-emerald-600 leading-none">{monthlyVolume.length}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Months</span>
            </div>
          </div>
        </div>

        <div className="h-[300px] relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyVolume} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" fontSize={10} stroke="#94a3b8" tickMargin={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} stroke="#94a3b8" tickMargin={10} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 15px 30px -5px rgba(0,0,0,0.1)' }}
                formatter={(val: number) => [`${val} Patients`, "Admissions"]}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40}>
                 <LabelList dataKey="count" position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#6366f1' }} offset={10} />
                 {monthlyVolume.map((entry, index) => (
                   <Cell 
                    key={`cell-${index}`} 
                    fill={index === monthlyVolume.length - 1 ? '#8b5cf6' : '#6366f1'} 
                    fillOpacity={0.8}
                    className="hover:fill-opacity-100 transition-all duration-300"
                   />
                 ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-indigo-50/50 rounded-full blur-[80px] pointer-events-none" />
      </div>

      {/* Repeat Visits Section */}
      <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 mb-1">
              <Repeat className="w-3 h-3 text-amber-600" />
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Recurring Visits</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Recurring Utilization</h3>
            <p className="text-xs text-slate-400 font-medium">Patients with multiple encounters within a single calendar month.</p>
          </div>
          
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Filter by HN or Name..."
              value={repeatSearchTerm}
              onChange={(e) => setRepeatSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-amber-500/10 transition-all"
            />
          </div>
        </div>

        <div className="space-y-8 relative z-10">
          {repeatVisitsData.map((group, groupIdx) => {
            const filteredHns = group.hns.filter(h => 
              h.hn.toLowerCase().includes(repeatSearchTerm.toLowerCase()) || 
              h.name.toLowerCase().includes(repeatSearchTerm.toLowerCase())
            );

            if (filteredHns.length === 0) return null;

            return (
              <div key={groupIdx} className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-100" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{group.month}</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {filteredHns.map((p, pIdx) => (
                    <button 
                      key={pIdx}
                      onClick={() => setSelectedHn(p.hn)}
                      className="p-5 bg-slate-50 border border-slate-100 rounded-[30px] text-left hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-white p-2 rounded-xl border border-slate-100 group-hover:bg-amber-50 transition-colors">
                          <UserCircle className="w-5 h-5 text-slate-400 group-hover:text-amber-600" />
                        </div>
                        <span className="bg-amber-500 text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-amber-500/20">
                          {p.count} Visits
                        </span>
                      </div>
                      
                      <div className="space-y-1 flex-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.hn}</p>
                        <p className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{p.name}</p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100/60 w-full space-y-2">
                         <div className="flex items-center gap-2 mb-1">
                           <Stethoscope className="w-3 h-3 text-indigo-400" />
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnosis History</span>
                         </div>
                         {p.icds.slice(0, 1).map((icd, idx) => {
                           const [code, desc] = icd.split(':').map(s => s.trim());
                           return (
                             <div key={idx} className="flex flex-col bg-white/50 p-2 rounded-xl border border-slate-50 group-hover:bg-indigo-50/30 group-hover:border-indigo-100 transition-all">
                               <span className="text-[9px] font-black text-indigo-600 uppercase">{code}</span>
                               <span className="text-[10px] text-slate-500 font-bold line-clamp-1 leading-tight">{desc || 'Clinical Encounter'}</span>
                             </div>
                           );
                         })}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Profile Details</span>
                         <ChevronRight className="w-3 h-3 text-indigo-600" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PatientProfileView;
