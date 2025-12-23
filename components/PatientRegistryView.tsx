
import React, { useMemo, useState } from 'react';
import { 
  Users, 
  Search, 
  Calendar, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  TrendingUp,
  FileText,
  UserCheck,
  Clock
} from 'lucide-react';
import { PatientRecord } from '../types';

interface PatientRegistryViewProps {
  data: PatientRecord[];
}

const PatientRegistryView: React.FC<PatientRegistryViewProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof PatientRecord>('visitDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const stats = useMemo(() => {
    if (data.length === 0) return { ytd: 0, latestMonth: 0, latestMonthName: 'N/A' };

    const sortedByDate = [...data].sort((a, b) => String(b.visitDate).localeCompare(String(a.visitDate)));
    const latestDateStr = sortedByDate[0].visitDate;
    const latestDate = new Date(latestDateStr);
    
    // Check for invalid date
    if (isNaN(latestDate.getTime())) return { ytd: 0, latestMonth: 0, latestMonthName: 'N/A' };

    const latestYear = latestDate.getFullYear();
    const latestMonth = latestDate.getMonth();

    const ytdCount = data.filter(r => {
      const d = new Date(r.visitDate);
      return !isNaN(d.getTime()) && d.getFullYear() === latestYear;
    }).length;

    const monthCount = data.filter(r => {
      const d = new Date(r.visitDate);
      return !isNaN(d.getTime()) && d.getFullYear() === latestYear && d.getMonth() === latestMonth;
    }).length;

    const monthName = latestDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return { 
      ytd: ytdCount, 
      latestMonth: monthCount, 
      latestMonthName: monthName 
    };
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (searchTerm) {
      const low = searchTerm.toLowerCase();
      result = result.filter(r => 
        String(r.patientName).toLowerCase().includes(low) || 
        String(r.hn).toLowerCase().includes(low) ||
        String(r.icd10).toLowerCase().includes(low) ||
        String(r.doctor).toLowerCase().includes(low)
      );
    }

    result.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });

    return result;
  }, [data, searchTerm, sortKey, sortOrder]);

  const toggleSort = (key: keyof PatientRecord) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total in Filter</p>
            <h3 className="text-3xl font-black text-slate-800">{data.length}</h3>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Year-to-Date (YTD)</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.ytd} <span className="text-xs font-medium text-slate-400 ml-1">Patients</span></h3>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Latest Month ({stats.latestMonthName})</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.latestMonth} <span className="text-xs font-medium text-slate-400 ml-1">Patients</span></h3>
          </div>
        </div>
      </div>

      {/* Registry Table */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tighter">Clinical Patient Registry</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Master Data Lake View</p>
            </div>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Name, HN, ICD10, or Doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 group cursor-pointer" onClick={() => toggleSort('visitDate')}>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">
                    Visit Date <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-8 py-5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HN</span>
                </th>
                <th className="px-8 py-5 group cursor-pointer" onClick={() => toggleSort('patientName')}>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">
                    Patient Name <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-8 py-5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnosis (ICD10)</span>
                </th>
                <th className="px-8 py-5 text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pain (In/Out)</span>
                </th>
                <th className="px-8 py-5 group cursor-pointer" onClick={() => toggleSort('doctor')}>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">
                    Doctor <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-8 py-5 text-right group cursor-pointer" onClick={() => toggleSort('revenue')}>
                  <div className="flex items-center justify-end gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">
                    Revenue <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedData.map((row, i) => (
                <tr key={i} className="hover:bg-indigo-50/30 transition-all group">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{row.visitDate}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{row.visitTime}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{row.hn}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs">
                        {String(row.patientName || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-800">{row.patientName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 max-w-[200px]">
                    <span className="text-xs text-slate-600 font-medium truncate block" title={row.icd10}>{row.icd10}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-black text-xs">{row.initialPainScore ?? '-'}</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                      <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs">{row.dischargePainScore ?? '-'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-bold text-slate-600">{row.doctor}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="font-black text-slate-800">฿{row.revenue.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedData.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="p-5 bg-slate-50 rounded-[32px]">
              <UserCheck className="w-12 h-12 text-slate-300" />
            </div>
            <h4 className="text-xl font-black text-slate-400">No matching patients found</h4>
            <button 
              onClick={() => setSearchTerm('')}
              className="text-indigo-600 font-bold hover:underline"
            >
              Clear search filters
            </button>
          </div>
        )}

        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing {filteredAndSortedData.length} of {data.length} records
          </span>
          <div className="flex items-center gap-1">
             <Clock className="w-3 h-3 text-slate-300" />
             <span className="text-[9px] font-bold text-slate-400 uppercase">Live Registry View</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientRegistryView;
