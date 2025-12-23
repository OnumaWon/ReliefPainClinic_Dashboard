
import React, { useMemo, useState } from 'react';
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  LabelList
} from 'recharts';
import { 
  Users, 
  TrendingDown, 
  DollarSign, 
  Award, 
  Table as TableIcon,
  LineChart as LineChartIcon,
  BarChart3,
  LayoutGrid,
  Stethoscope,
  ChevronRight,
  ClipboardCheck
} from 'lucide-react';
import { PatientRecord, AIInsight } from '../types';

interface DashboardProps {
  data: PatientRecord[];
  insights: AIInsight | null;
  isAnalyzing: boolean;
  icdDescriptions: Record<string, string>;
  isFetchingIcd: boolean;
}

type CalcMode = 'mean' | 'median';

const PainTooltip = ({ active, payload, label, isMonthly = false }: any) => {
  if (active && payload && payload.length) {
    const initial = payload.find((p: any) => p.dataKey.includes('initial'))?.value || 0;
    const discharge = payload.find((p: any) => p.dataKey.includes('discharge'))?.value || 0;
    const reduction = initial - discharge;
    const pct = initial > 0 ? ((reduction / initial) * 100).toFixed(1) : "0";
    
    return (
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-800 min-w-[240px] z-50 animate-in fade-in zoom-in-95 duration-200">
        <p className="text-xs font-black text-indigo-400 mb-3 border-b border-white/10 pb-2 uppercase tracking-widest">
          {isMonthly ? `Period: ${label}` : `Patient: ${label}`}
        </p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Avg Initial (แรกรับ)</span>
            </div>
            <span className="font-mono text-sm font-bold">{initial.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-400 font-bold uppercase">Avg Discharge (จำหน่าย)</span>
            </div>
            <span className="font-mono text-sm font-bold text-emerald-400">{discharge.toFixed(2)}</span>
          </div>
          <div className="pt-2 mt-2 border-t border-white/10 flex justify-between items-center">
            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-tighter">Improvement</span>
            <span className="bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded text-[11px] font-black border border-indigo-500/20">
              {pct}% Efficiency
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subValue?: string;
  trend?: 'up' | 'down';
  footer?: React.ReactNode;
}> = ({ title, value, icon: Icon, color, subValue, trend, footer }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between h-full">
    <div>
      <div className={`p-3 rounded-xl bg-${color}-50 w-fit mb-4 relative z-10 transition-transform group-hover:scale-110`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <div className="flex flex-col relative z-10">
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900">{value}</span>
          {subValue && <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{subValue}</span>}
        </div>
      </div>
    </div>
    
    {footer && <div className="mt-4 pt-4 border-t border-slate-100 relative z-10">{footer}</div>}

    {trend && (
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {trend === 'down' ? <TrendingDown className={`w-12 h-12 text-${color}-600`} /> : <TrendingDown className={`w-12 h-12 text-${color}-600 rotate-180`} />}
      </div>
    )}
  </div>
);

const ClinicalTable = ({ data }: { data: any[] }) => (
  <div className="overflow-auto max-h-[350px] w-full no-scrollbar">
    <table className="w-full text-left border-collapse">
      <thead className="sticky top-0 bg-white z-10 border-b border-slate-100">
        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
          <th className="py-4 pr-4">Month</th>
          <th className="py-4 px-4 text-center">Avg Initial</th>
          <th className="py-4 px-4 text-center">Avg Discharge</th>
          <th className="py-4 px-4 text-center">ตัวตั้ง (Numerator)</th>
          <th className="py-4 px-4 text-center">ตัวหาร (Denominator)</th>
          <th className="py-4 px-4 text-right">Reduction %</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {data.map((m, i) => {
          const reduction = m.initial - m.discharge;
          const pct = m.initial > 0 ? ((reduction / m.initial) * 100).toFixed(1) : "0";
          return (
            <tr key={i} className="hover:bg-slate-50/80 transition-colors">
              <td className="py-4 pr-4 font-black text-slate-800 text-xs">{m.month}</td>
              <td className="py-4 px-4 text-center font-mono text-xs text-indigo-600 font-bold">{m.initial.toFixed(2)}</td>
              <td className="py-4 px-4 text-center font-mono text-xs text-emerald-600 font-bold">{m.discharge.toFixed(2)}</td>
              <td className="py-4 px-4 text-center text-[11px] font-medium text-slate-500">{m.initialCount}</td>
              <td className="py-4 px-4 text-center text-[11px] font-medium text-slate-500">{m.count}</td>
              <td className="py-4 px-4 text-right">
                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-black text-[10px]">{pct}%</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ 
  data, 
  icdDescriptions
}) => {
  const [calcMode, setCalcMode] = useState<CalcMode>('mean');
  const [painCompView, setPainCompView] = useState<'chart' | 'table'>('chart');
  const [outcomeMatrixView, setOutcomeMatrixView] = useState<'chart' | 'table'>('chart');

  const calculateMedian = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const calculateAvg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const metrics = useMemo(() => {
    const total = data.length;
    if (total === 0) return { totalPatients: 0, avgReduction: 0, medianReduction: 0, totalRevenue: 0, topICD10: 'N/A', top10Icd: [], top10Icd9: [] };
    
    const initials = data.map(r => r.initialPainScore).filter(v => v !== null) as number[];
    const discharges = data.map(r => r.dischargePainScore).filter(v => v !== null) as number[];
    
    const avgInitial = calculateAvg(initials);
    const avgDischarge = calculateAvg(discharges);
    const avgRed = avgInitial > 0 ? ((avgInitial - avgDischarge) / avgInitial) * 100 : 0;

    const medInitial = calculateMedian(initials);
    const medDischarge = calculateMedian(discharges);
    const medRed = medInitial > 0 ? ((medInitial - medDischarge) / medInitial) * 100 : 0;

    // ICD Frequency Analysis
    const icdGroups: Record<string, { count: number, nameFromData: string }> = {};
    const icd9Groups: Record<string, { count: number, nameFromData: string }> = {};
    
    data.forEach(p => {
      // ICD-10
      const parts10 = p.icd10.split(':');
      const code10 = parts10[0]?.trim() || 'Unknown';
      const name10 = parts10[1]?.trim() || '';

      if (!icdGroups[code10]) icdGroups[code10] = { count: 0, nameFromData: name10 };
      icdGroups[code10].count += 1;
      if (!icdGroups[code10].nameFromData && name10) icdGroups[code10].nameFromData = name10;

      // ICD-9
      const parts9 = p.icd9.split(':');
      const code9 = parts9[0]?.trim() || 'Unknown';
      const name9 = parts9[1]?.trim() || '';

      if (!icd9Groups[code9]) icd9Groups[code9] = { count: 0, nameFromData: name9 };
      icd9Groups[code9].count += 1;
      if (!icd9Groups[code9].nameFromData && name9) icd9Groups[code9].nameFromData = name9;
    });

    const sortedIcds = Object.entries(icdGroups)
      .map(([code, vals]) => ({
        code,
        count: vals.count,
        description: icdDescriptions[code] || vals.nameFromData || 'Clinical Diagnosis',
        share: ((vals.count / total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);

    const sortedIcd9s = Object.entries(icd9Groups)
      .map(([code, vals]) => ({
        code,
        count: vals.count,
        description: vals.nameFromData || 'Medical Procedure',
        share: ((vals.count / total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);

    const topIcd = sortedIcds[0]?.code || 'N/A';
    
    return {
      totalPatients: total,
      avgReduction: Number(avgRed.toFixed(1)),
      medianReduction: Number(medRed.toFixed(1)),
      totalRevenue: Math.round(data.reduce((acc, r) => acc + r.revenue, 0)),
      topICD10: topIcd,
      top10Icd: sortedIcds.slice(0, 10),
      top10Icd9: sortedIcd9s.slice(0, 10)
    };
  }, [data, icdDescriptions]);

  const monthlyStats = useMemo(() => {
    const groups: Record<string, { initials: number[], discharges: number[], count: number }> = {};
    data.forEach(p => {
      const month = p.visitDate.substring(0, 7);
      if (!groups[month]) groups[month] = { initials: [], discharges: [], count: 0 };
      if (p.initialPainScore !== null) groups[month].initials.push(p.initialPainScore);
      if (p.dischargePainScore !== null) groups[month].discharges.push(p.dischargePainScore);
      groups[month].count += 1;
    });

    return Object.entries(groups)
      .map(([month, vals]) => ({
        month,
        initial: calculateAvg(vals.initials),
        discharge: calculateAvg(vals.discharges),
        initialCount: vals.initials.length,
        dischargeCount: vals.discharges.length,
        count: vals.count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Patient Cohort" value={metrics.totalPatients} icon={Users} color="indigo" />
        <MetricCard 
          title="Clinical Efficacy" 
          value={`${calcMode === 'mean' ? metrics.avgReduction : metrics.medianReduction}%`} 
          icon={TrendingDown} 
          color="emerald" 
          subValue="Pain Reduction"
          trend="down"
          footer={
            <div className="flex bg-slate-100 p-0.5 rounded-lg w-full">
              <button onClick={() => setCalcMode('mean')} className={`flex-1 py-1 rounded-md text-[9px] font-black uppercase tracking-tight transition-all ${calcMode === 'mean' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Avg</button>
              <button onClick={() => setCalcMode('median')} className={`flex-1 py-1 rounded-md text-[9px] font-black uppercase tracking-tight transition-all ${calcMode === 'median' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>Median</button>
            </div>
          }
        />
        <MetricCard title="Gross Revenues" value={`฿${metrics.totalRevenue.toLocaleString()}`} icon={DollarSign} color="amber" />
        <MetricCard title="Top Diagnosis" value={metrics.topICD10.split(':')[0]} icon={Award} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Longitudinal Pain Comparison Line Chart */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-10 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <LineChartIcon className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xl font-black text-slate-800 tracking-tighter">Pain Intensity Comparison</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                Trend of Avg Score (Column J vs Column L)
              </p>
            </div>
            
            <button 
              onClick={() => setPainCompView(painCompView === 'chart' ? 'table' : 'chart')}
              className={`p-2 rounded-xl transition-all duration-300 border flex items-center gap-2 ${
                painCompView === 'table' 
                  ? 'bg-indigo-600 text-white border-indigo-600' 
                  : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              {painCompView === 'chart' ? <TableIcon className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-widest">{painCompView === 'chart' ? 'Table' : 'Chart'}</span>
            </button>
          </div>

          <div className="h-[350px]">
            {painCompView === 'chart' ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    fontSize={11} 
                    stroke="#94a3b8" 
                    tickMargin={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickMargin={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<PainTooltip isMonthly />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    iconType="circle" 
                    wrapperStyle={{ 
                      paddingBottom: '30px', 
                      fontSize: '10px', 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="initial" 
                    name="Avg Initial (J)" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="discharge" 
                    name="Avg Discharge (L)" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ClinicalTable data={monthlyStats} />
            )}
          </div>
        </div>

        {/* Outcome Matrix Bar Chart */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-10 relative z-10">
            <div className="max-w-[70%]">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-emerald-500 shrink-0" />
                <h3 className="text-xl font-black text-slate-800 tracking-tighter leading-tight">
                  Pain Intensity Comparison <span className="text-xs font-bold text-slate-400 inline-block mt-0.5">(Pain Score: Initial vs Discharge Distributions)</span>
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Pain Score: Intake vs Discharge Distributions</p>
            </div>

            <button 
              onClick={() => setOutcomeMatrixView(outcomeMatrixView === 'chart' ? 'table' : 'chart')}
              className={`p-2 rounded-xl transition-all duration-300 border flex items-center gap-2 ${
                outcomeMatrixView === 'table' 
                  ? 'bg-indigo-600 text-white border-indigo-600' 
                  : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
              }`}
            >
              {outcomeMatrixView === 'chart' ? <TableIcon className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-widest">{outcomeMatrixView === 'chart' ? 'Table' : 'Chart'}</span>
            </button>
          </div>

          <div className="h-[350px]">
            {outcomeMatrixView === 'chart' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats} barGap={8} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                  <Tooltip content={<PainTooltip isMonthly />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    iconType="circle" 
                    wrapperStyle={{ 
                      paddingBottom: '30px', 
                      fontSize: '10px', 
                      fontWeight: 'bold', 
                      textTransform: 'uppercase' 
                    }} 
                  />
                  <Bar dataKey="initial" name="Initial pain score" fill="#6366f1" radius={[6, 6, 0, 0]}>
                    <LabelList dataKey="initial" position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#6366f1' }} offset={10} formatter={(val: number) => val.toFixed(1)} />
                  </Bar>
                  <Bar dataKey="discharge" name="Discharge pain score" fill="#10b981" radius={[6, 6, 0, 0]}>
                    <LabelList dataKey="discharge" position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#10b981' }} offset={10} formatter={(val: number) => val.toFixed(1)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ClinicalTable data={monthlyStats} />
            )}
          </div>
        </div>
      </div>

      {/* Top 10 Clinical Diagnoses by Frequency (ICD-10) */}
      <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm overflow-hidden relative group">
        <div className="flex justify-between items-center mb-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <Stethoscope className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Top 10 Clinical Diagnoses by Volume</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Most Frequent ICD10 Clusters (Patient Frequency)</p>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="bg-slate-100 text-slate-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
              {metrics.top10Icd.length} Clusters Analyzed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {metrics.top10Icd.map((icd, idx) => (
            <div key={idx} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col gap-4 group/card hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1.5 flex-1">
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg w-fit group-hover/card:bg-indigo-600 group-hover/card:text-white transition-colors">{icd.code}</span>
                  <span className="text-[11px] text-slate-700 font-bold leading-tight line-clamp-2 h-8">{icd.description}</span>
                </div>
                <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-300">
                  #{idx + 1}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                   <p className="text-3xl font-black text-slate-900 leading-none">{icd.count}</p>
                   <span className="text-[10px] font-black text-slate-400 uppercase">Cases</span>
                </div>
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${icd.share}%` }} 
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Population Share</span>
                    <span className="text-indigo-500">{icd.share}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-700">
          <Stethoscope className="w-64 h-64" />
        </div>
      </div>

      {/* NEW: Top 10 Procedure Codes by Frequency (ICD-9) */}
      <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm overflow-hidden relative group">
        <div className="flex justify-between items-center mb-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <ClipboardCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Top 10 Procedure Codes by Volume</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Most Frequent ICD9 Clusters (Procedure Frequency)</p>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="bg-slate-100 text-slate-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
              {metrics.top10Icd9.length} Clusters Analyzed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {metrics.top10Icd9.map((icd, idx) => (
            <div key={idx} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col gap-4 group/card hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1.5 flex-1">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg w-fit group-hover/card:bg-emerald-600 group-hover/card:text-white transition-colors">{icd.code}</span>
                  <span className="text-[11px] text-slate-700 font-bold leading-tight line-clamp-2 h-8">{icd.description}</span>
                </div>
                <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-300">
                  #{idx + 1}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                   <p className="text-3xl font-black text-slate-900 leading-none">{icd.count}</p>
                   <span className="text-[10px] font-black text-slate-400 uppercase">Cases</span>
                </div>
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${icd.share}%` }} 
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Population Share</span>
                    <span className="text-emerald-500">{icd.share}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-700">
          <ClipboardCheck className="w-64 h-64" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
