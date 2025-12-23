
import React, { useMemo } from 'react';
import { Calendar, Filter, X, ChevronDown } from 'lucide-react';
import { DateRange } from '../types';

interface DateRangePickerProps {
  range: DateRange;
  onChange: (range: DateRange) => void;
  availableDates: string[];
}

const MONTHS = [
  { name: 'All Months', value: '' },
  { name: 'January', value: '01' },
  { name: 'February', value: '02' },
  { name: 'March', value: '03' },
  { name: 'April', value: '04' },
  { name: 'May', value: '05' },
  { name: 'June', value: '06' },
  { name: 'July', value: '07' },
  { name: 'August', value: '08' },
  { name: 'September', value: '09' },
  { name: 'October', value: '10' },
  { name: 'November', value: '11' },
  { name: 'December', value: '12' },
];

const DateRangePicker: React.FC<DateRangePickerProps> = ({ range, onChange, availableDates }) => {
  const minDate = availableDates[0] || '';
  const maxDate = availableDates[availableDates.length - 1] || '';

  const years = useMemo(() => {
    const uniqueYears = new Set(availableDates.map(d => d.split('-')[0]));
    // Fix: Explicitly type sort parameters to avoid 'unknown' type inference error
    return Array.from(uniqueYears).sort((a: string, b: string) => b.localeCompare(a));
  }, [availableDates]);

  // Determine currently selected year/month for the dropdowns
  const currentYear = useMemo(() => {
    if (range.start.startsWith(range.end.split('-')[0]) && range.start.split('-')[0] === range.end.split('-')[0]) {
      return range.start.split('-')[0];
    }
    return '';
  }, [range]);

  const currentMonth = useMemo(() => {
    const startParts = range.start.split('-');
    const endParts = range.end.split('-');
    if (startParts[0] === endParts[0] && startParts[1] === endParts[1]) {
      // Check if it's the full month
      const lastDay = new Date(parseInt(startParts[0]), parseInt(startParts[1]), 0).getDate();
      if (parseInt(startParts[2]) === 1 && parseInt(endParts[2]) === lastDay) {
        return startParts[1];
      }
    }
    return '';
  }, [range]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value;
    if (!year) return;
    onChange({
      start: `${year}-01-01`,
      end: `${year}-12-31`
    });
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = e.target.value;
    const year = currentYear || years[0] || new Date().getFullYear().toString();
    
    if (!month) {
      onChange({ start: `${year}-01-01`, end: `${year}-12-31` });
      return;
    }

    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    onChange({
      start: `${year}-${month}-01`,
      end: `${year}-${month}-${lastDay.toString().padStart(2, '0')}`
    });
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...range, start: e.target.value });
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...range, end: e.target.value });
  };

  const reset = () => {
    onChange({ start: minDate, end: maxDate });
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-indigo-600">
          <Filter className="w-5 h-5" />
          <span className="font-bold text-sm uppercase tracking-wider">Dashboard Filters</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Available Data:</span>
          <span className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            {minDate} to {maxDate}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        {/* Quick Year Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Select Year</label>
          <div className="relative">
            <select
              value={currentYear}
              onChange={handleYearChange}
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700 min-w-[120px]"
            >
              <option value="" disabled>Year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Quick Month Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Select Month</label>
          <div className="relative">
            <select
              value={currentMonth}
              onChange={handleMonthChange}
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700 min-w-[140px]"
            >
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="h-10 w-px bg-slate-100 mx-2 hidden md:block mt-4" />

        {/* Custom Date Range Selection */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[300px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Custom Range</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={range.start}
                min={minDate}
                max={range.end}
                onChange={handleStartChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700"
              />
            </div>
            <span className="text-slate-300 font-medium">to</span>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={range.end}
                min={range.start}
                max={maxDate}
                onChange={handleEndChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700"
              />
            </div>
          </div>
        </div>

        <button
          onClick={reset}
          className="mt-5 flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-transparent hover:border-indigo-100 transition-all"
        >
          <X className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
};

export default DateRangePicker;
