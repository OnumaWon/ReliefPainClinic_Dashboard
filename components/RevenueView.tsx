import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area,
  Cell,
  LabelList
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Target, 
  Stethoscope,
  ChevronRight,
  PieChart as PieChartIcon,
  Activity,
  Table as TableIcon,
  X,
  Search,
  ArrowUp,
  ArrowDown,
  Calculator,
  BarChart3,
  ArrowUpDown,
  CalendarDays
} from 'lucide-react';
import { PatientRecord } from '../types';

interface RevenueViewProps {
  data: PatientRecord[];
  icdDescriptions: Record<string, string>;
}

const RevenueView: React.FC<RevenueViewProps> = ({ data, icdDescriptions }) => {
  const [showIcdTable, setShowIcdTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: 'revenue', direction: 'desc' });

  const stats = useMemo(() => {
    const monthlyGroups: Record<string, number> = {};
    const doctorGroups: Record<string, number> = {};
    const icdGroups: Record<string, { revenue: number, count: number, nameFromData: string }> = {};
    const totalCount = data.length;

    data.forEach(p => {
      const month = p.visitDate.substring(0, 7);
      monthlyGroups[month] = (monthlyGroups[month] || 0) + p.revenue;
      doctorGroups[p.doctor] = (doctorGroups[p.doctor] || 0) + p.revenue;
      
      const parts = p.icd10.split(':');
      const icdCode = parts[0]?.trim() || 'Other';
      const icdName = parts[1]?.trim() || '';

      if (!icdGroups[icdCode]) {
        icdGroups[icdCode] = { revenue: 0, count: 0, nameFromData: icdName };
      }
      icdGroups[icdCode].revenue += p.revenue;
      icdGroups[icdCode].count += 1;
      // Keep the most complete name from the data if possible
      if (!icdGroups[icdCode].nameFromData && icdName) {
        icdGroups[icdCode].nameFromData = icdName;
      }
    });

    const monthlyData = Object.entries(monthlyGroups)
      .map(([month, rev]) => ({ month, revenue: Math.round(rev) }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const doctorData = Object.entries(doctorGroups)
      .map(([name, rev]) => ({ name, revenue: Math.round(rev) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const totalRevenue = data.reduce((acc, p) => acc + p.revenue, 0);

    const icdData = Object.entries(icdGroups)
      .map(([code, vals]) => {
        const shareNum = (vals.revenue / totalRevenue * 100);
        return { 
          code, 
          revenue: Math.round(vals.revenue),
          count: vals.count,
          totalDatasetSize: totalCount,
          // Prioritize Gemini Description -> Data Description -> Fallback
          description: icdDescriptions[code] || vals.nameFromData || "Clinical Diagnosis",
          share: shareNum.toFixed(1) + '%',
          shareRaw: shareNum
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0;

    return { monthlyData, doctorData, icdData, totalRevenue, avgRevenue };
  }, [data, icdDescriptions]);

  const sortedIcdData = useMemo(() => {
    let result = [...stats.icdData];
    
    if (searchTerm) {
      const low = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.code.toLowerCase().includes(low) || 
        item.description.toLowerCase().includes(low)
      );
    }

    if (sortConfig.key && sortConfig.direction) {
      result.sort((a: any, b: any) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        
        const sA = String(valA).toLowerCase();
        const sB = String(valB).toLowerCase();
        if (sA < sB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (sA > sB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [stats.icdData, searchTerm, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
    setSortConfig({ key, direction });
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Financial Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-100 flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <div className="bg-white/10 w-fit p-3 rounded-2xl backdrop-blur-md mb-6 transition-transform group-hover:scale-110">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-1">Total Gross Revenue</p>
              <h3 className="text-3xl font-black">฿{stats.totalRevenue.toLocaleString()}</h3>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-10 transition-transform group-hover:scale-125">
             <DollarSign className="w-32 h-32 text-white" />
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between group">
          <div>
            <div className="bg-emerald-50 w-fit p-3 rounded-2xl mb-6 transition-transform group-hover:scale-110">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Avg. Rev Per Case</p>
              <h3 className="text-3xl font-black text-slate-800">฿{Math.round(stats.avgRevenue).toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between group">
          <div>
            <div className="bg-amber-50 w-fit p-3 rounded-2xl mb-6 transition-transform group-hover:scale-110">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Encounters</p>
              <h3 className="text-3xl font-black text-slate-800">{data.length} Cases</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Bar Chart & Table */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-2xl">
              <BarChart3 className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Monthly Revenue Distribution</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Discrete Monthly Performance</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyData} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" tickMargin={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickMargin={10} tickFormatter={(val) => `฿${(val/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(val: number) => [`฿${val.toLocaleString()}`, "Revenue"]}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="revenue" radius={[10, 10, 0, 0]}>
                    <LabelList 
                      dataKey="revenue" 
                      position="top" 
                      formatter={(val: number) => `฿${(val/1000).toFixed(0)}k`} 
                      style={{ fontSize: '10px', fontWeight: 'bold', fill: '#6366f1' }}
                      offset={12}
                    />
                    {stats.monthlyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index % 2 === 0 ? '#6366f1' : '#8b5cf6'} 
                        fillOpacity={0.8}
                        className="hover:fill-opacity-100 transition-all duration-300"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden flex flex-col h-full max-h-[400px]">
              <div className="p-5 border-b border-slate-200 bg-white/50 backdrop-blur-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monthly Summary</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">฿ Currency</span>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10">
                    <tr>
                      <th className="px-6 py-3 font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">Month</th>
                      <th className="px-6 py-3 font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-200">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.monthlyData.map((m, i) => (
                      <tr key={i} className="hover:bg-white transition-colors group">
                        <td className="px-6 py-4 font-bold text-slate-700">{m.month}</td>
                        <td className="px-6 py-4 font-black text-indigo-600 text-right group-hover:scale-105 transition-transform origin-right">฿{m.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="sticky bottom-0 bg-indigo-600 text-white z-10">
                    <tr>
                      <td className="px-6 py-3 font-black uppercase tracking-widest">Grand Total</td>
                      <td className="px-6 py-3 font-black text-right">฿{stats.totalRevenue.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <PieChartIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Revenue Trendline</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Monthly Financial Flow</p>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" tickMargin={10} />
                <YAxis stroke="#94a3b8" fontSize={11} tickMargin={10} tickFormatter={(val) => `฿${(val/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(val: number) => [`฿${val.toLocaleString()}`, "Revenue"]}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <Stethoscope className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Physician Contribution</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Revenue Generated by Provider</p>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.doctorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={10} stroke="#94a3b8" width={100} />
                <Tooltip 
                   formatter={(val: number) => `฿${val.toLocaleString()}`}
                   cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 8, 8, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Diagnosis Revenue Section */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden relative min-h-[500px]">
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-50 rounded-2xl">
              <Target className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Revenue by Clinical Diagnosis</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Top 10 Performing ICD10 Clusters</p>
            </div>
          </div>
          <button 
            onClick={() => setShowIcdTable(!showIcdTable)}
            className={`p-3 rounded-2xl transition-all duration-300 ${showIcdTable ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <TableIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Grid View - Displaying top 10 with direct description fallback */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.icdData.slice(0, 10).map((icd, idx) => (
            <div key={idx} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex flex-col gap-3 group hover:bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="flex flex-col flex-1 gap-1">
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg w-fit mb-1">{icd.code}</span>
                  <span className="text-[11px] text-slate-800 font-bold line-clamp-2 leading-snug">{icd.description}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 shrink-0" />
              </div>
              <div className="mt-1"><p className="text-2xl font-black text-slate-900 leading-none">฿{icd.revenue.toLocaleString()}</p></div>
              <div className="space-y-1.5 mt-2">
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: icd.share }} />
                </div>
                <div className="flex justify-between items-center px-0.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Share: {icd.share}</span>
                  <div className="flex items-center gap-1">
                     <Users className="w-2.5 h-2.5 text-indigo-400" />
                     <span className="text-[9px] font-black text-indigo-500">{icd.count} Cases</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overlay Table View */}
        {showIcdTable && (
          <div className="absolute inset-0 bg-white z-20 animate-in fade-in slide-in-from-top-4 flex flex-col p-8 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <Calculator className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Full Diagnosis Ledger</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Comprehensive Revenue Data Table</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Filter by code or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <button 
                  onClick={() => setShowIcdTable(false)}
                  className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-[32px] border border-slate-100 bg-white shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr>
                    <th className="p-4 font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <button onClick={() => handleSort('code')} className="flex items-center gap-2 hover:text-indigo-600">
                        Code <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-4 font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <button onClick={() => handleSort('description')} className="flex items-center gap-2 hover:text-indigo-600">
                        Clinical Diagnosis <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-4 font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">
                      <button onClick={() => handleSort('count')} className="flex items-center gap-2 hover:text-indigo-600 mx-auto">
                        Cases <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-4 font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-100">
                      <button onClick={() => handleSort('revenue')} className="flex items-center gap-2 hover:text-indigo-600 justify-end ml-auto">
                        Revenue <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-4 font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-100">
                      <button onClick={() => handleSort('shareRaw')} className="flex items-center gap-2 hover:text-indigo-600 justify-end ml-auto">
                        Share % <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sortedIcdData.map((item, i) => (
                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-indigo-600">{item.code}</td>
                      <td className="p-4 text-slate-600 font-medium">{item.description}</td>
                      <td className="p-4 text-center font-bold text-slate-500">{item.count}</td>
                      <td className="p-4 text-right font-black text-slate-800">฿{item.revenue.toLocaleString()}</td>
                      <td className="p-4 text-right font-bold text-slate-400">{item.share}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueView;