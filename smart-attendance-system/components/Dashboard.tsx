import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, BarChart, Bar, LineChart, Line, Legend } from 'recharts';
import { AttendanceRecord, User } from '../types';
import { Users, Clock, AlertTriangle, CheckCircle2, TrendingUp, UserCheck, BarChart3, Activity, AlertOctagon } from 'lucide-react';

interface DashboardProps {
  users: User[];
  records: AttendanceRecord[];
  isDarkMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ users, records, isDarkMode }) => {
  // Stats Calculation
  const totalUsers = users.length;
  const today = new Date().toISOString().split('T')[0];

  const { presentCount, avgCheckInTime, latestCheckInTime } = useMemo(() => {
    const todayRecords = records.filter(r => r.timestamp.startsWith(today));
    
    // Unique present today
    const uniquePresentIds = new Set(todayRecords.map(r => r.userId));
    const count = uniquePresentIds.size;

    let avgTime = "--:--";
    let latestTime = "--:--";

    if (todayRecords.length > 0) {
      const timestamps = todayRecords.map(r => new Date(r.timestamp).getTime());
      const sumTime = timestamps.reduce((a, b) => a + b, 0);
      const avgTimestamp = sumTime / timestamps.length;
      const maxTimestamp = Math.max(...timestamps);

      avgTime = new Date(avgTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      latestTime = new Date(maxTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return {
      presentCount: count,
      avgCheckInTime: avgTime,
      latestCheckInTime: latestTime
    };
  }, [records, today]);
  
  const absentCount = Math.max(0, totalUsers - presentCount);
  const attendanceRate = totalUsers > 0 ? Math.round((presentCount / totalUsers) * 100) : 0;

  // Chart Data: Weekly Attendance
  const chartData = useMemo(() => {
    return Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const count = new Set(records.filter(r => r.timestamp.startsWith(dateStr)).map(r => r.userId)).size;
      return {
        date: dateStr.slice(5), // MM-DD
        count: count,
      };
    });
  }, [records, totalUsers]);

  // Analytics: Peak Attendance Times (Hourly)
  const peakTimeData = useMemo(() => {
    const hourCounts = Array(24).fill(0);
    records.forEach(r => {
      const h = new Date(r.timestamp).getHours();
      hourCounts[h]++;
    });
    // Return typical office hours 6 AM - 8 PM
    return hourCounts.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      attendees: count
    })).filter((_, i) => i >= 6 && i <= 20); 
  }, [records]);

  // Analytics: Recognition Accuracy Over Time
  const accuracyData = useMemo(() => {
    const grouped: Record<string, number[]> = {};
    const sorted = [...records].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    sorted.forEach(r => {
      const date = r.timestamp.split('T')[0].slice(5); // MM-DD
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(r.confidence * 100);
    });

    return Object.entries(grouped).map(([date, scores]) => ({
      date,
      accuracy: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    })).slice(-10); // Last 10 days
  }, [records]);

  // Analytics: Frequently Late Employees
  const lateData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.filter(r => r.status === 'Late').forEach(r => {
      counts[r.userName] = (counts[r.userName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [records]);

  // Pie Data
  const pieData = [
    { name: 'Present', value: presentCount },
    { name: 'Absent', value: absentCount },
  ];
  const PIE_COLORS = ['#3b82f6', isDarkMode ? '#1e293b' : '#e2e8f0']; // blue-500, slate-800/slate-200

  // Styles for charts
  const axisColor = isDarkMode ? '#94a3b8' : '#94a3b8';
  const gridColor = isDarkMode ? '#334155' : '#f1f5f9';
  const tooltipStyle = { 
    backgroundColor: isDarkMode ? '#1e293b' : '#fff', 
    border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, 
    color: isDarkMode ? '#f8fafc' : '#1e293b', 
    borderRadius: '8px' 
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, subtext, delay }: any) => (
    <div 
      className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow duration-300"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {value}
          </h3>
          {subtext && <div className="text-slate-400 dark:text-slate-500 text-xs mt-2 font-medium">
             {subtext}
          </div>}
        </div>
        <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
          <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Employees" 
          value={totalUsers} 
          icon={Users} 
          colorClass="bg-blue-600 text-blue-600"
          subtext="Registered active personnel"
          delay={0}
        />
        <StatCard 
          title="Present Today" 
          value={presentCount} 
          icon={UserCheck} 
          colorClass="bg-emerald-500 text-emerald-500"
          subtext={`Attendance Rate: ${attendanceRate}%`}
          delay={100}
        />
        <StatCard 
          title="Absent" 
          value={absentCount} 
          icon={AlertTriangle} 
          colorClass="bg-rose-500 text-rose-500"
          subtext="Needs attention"
          delay={200}
        />
        <StatCard 
          title="Avg Check-in" 
          value={avgCheckInTime} 
          icon={Clock} 
          colorClass="bg-violet-500 text-violet-500"
          subtext={presentCount > 0 ? `Last: ${latestCheckInTime}` : "No data today"}
          delay={300}
        />
      </div>

      {/* Middle Row: Main Trend + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend - Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="text-slate-400" size={20} />
              Attendance Trend
            </h3>
            <select className="text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded px-2 py-1 text-slate-600 dark:text-slate-300 outline-none focus:border-blue-500">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  cursor={{stroke: '#3b82f6', strokeWidth: 1}}
                  itemStyle={{ fontSize: '14px', color: '#3b82f6', fontWeight: 600 }}
                  labelStyle={{ color: '#64748b', marginBottom: '0.25rem' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" name="Attendees" activeDot={{r: 6, strokeWidth: 0}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Column */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Today's Overview</h3>
          <p className="text-slate-400 text-sm mb-6">Real-time attendance ratio</p>
          
          <div className="flex-1 min-h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="block text-3xl font-bold text-slate-800 dark:text-slate-100">{attendanceRate}%</span>
                <span className="text-xs text-slate-400 font-medium">PRESENT</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                 <span className="text-slate-600 dark:text-slate-400">Present</span>
               </div>
               <span className="font-semibold text-slate-800 dark:text-slate-200">{presentCount}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                 <span className="text-slate-600 dark:text-slate-400">Absent</span>
               </div>
               <span className="font-semibold text-slate-800 dark:text-slate-200">{absentCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Advanced Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Peak Attendance Times */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
            <BarChart3 className="text-slate-400" size={20} />
            Peak Attendance
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="hour" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} interval={2} />
                <Tooltip contentStyle={tooltipStyle} cursor={{fill: isDarkMode ? '#1e293b' : '#f1f5f9'}} />
                <Bar dataKey="attendees" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accuracy Trend */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
            <Activity className="text-slate-400" size={20} />
            AI Accuracy Trend
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} hide />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} dot={{r: 3, fill: '#10b981'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Frequently Late Employees */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
            <AlertOctagon className="text-slate-400" size={20} />
            Late Arrivals
          </h3>
          <div className="flex-1 flex flex-col gap-3">
            {lateData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">
                No late records found.
              </div>
            ) : (
              lateData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                    {item.count} times
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;