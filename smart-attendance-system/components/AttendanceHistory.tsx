import React from 'react';
import { AttendanceRecord } from '../types';
import { Search, Download, Filter } from 'lucide-react';

interface HistoryProps {
  records: AttendanceRecord[];
}

const AttendanceHistory: React.FC<HistoryProps> = ({ records }) => {
  const sorted = [...records].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleExport = () => {
    if (sorted.length === 0) {
      alert("No records to export.");
      return;
    }

    const headers = ['Date', 'Time', 'Employee Name', 'Employee ID', 'Status', 'Confidence', 'Mood'];
    const csvContent = [
      headers.join(','),
      ...sorted.map(record => {
        const date = new Date(record.timestamp);
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          `"${record.userName}"`, // Wrap in quotes to handle potential commas in names
          record.userId,
          record.status,
          `${(record.confidence * 100).toFixed(1)}%`,
          record.mood || '-'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full transition-colors">
      
      {/* Table Header */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 transition-colors">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Attendance Logs</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Comprehensive daily entry records.</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Filter size={16} />
            Filter
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-slate-900 dark:hover:bg-brand-700 transition-colors shadow-sm active:scale-95"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Time</th>
              <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Employee</th>
              <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
              <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Expression</th>
              <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Confidence Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sorted.length === 0 ? (
               <tr>
                 <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                   No attendance records found for this period.
                 </td>
               </tr>
            ) : (
              sorted.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-slate-200">
                        {new Date(record.timestamp).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute:'2-digit' })}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-500">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{record.userName}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      record.status === 'Present' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 
                      record.status === 'Late' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800' : 
                      'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-slate-600 dark:text-slate-400 capitalize">{record.mood || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-slate-500 dark:text-slate-400 text-xs">{Math.round(record.confidence * 100)}%</span>
                      <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${record.confidence > 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                          style={{ width: `${Math.min(100, record.confidence * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
        <span>Showing {records.length} records</span>
        <span>Synced Just Now</span>
      </div>
    </div>
  );
};

export default AttendanceHistory;