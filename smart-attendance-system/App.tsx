import React, { useState, useEffect } from 'react';
import { User, AttendanceRecord } from './types';
import Dashboard from './components/Dashboard';
import Registration from './components/Registration';
import Scanner from './components/Scanner';
import AttendanceHistory from './components/AttendanceHistory';
import { LayoutDashboard, ScanFace, UserPlus, FileClock, Menu, X, Users, Bell, Moon, Sun } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scanner' | 'register' | 'history'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUsers = localStorage.getItem('smart_attendance_users');
    const savedRecords = localStorage.getItem('smart_attendance_records');
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedRecords) setRecords(JSON.parse(savedRecords));
  }, []);

  // Save data when updated
  useEffect(() => {
    localStorage.setItem('smart_attendance_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('smart_attendance_records', JSON.stringify(records));
  }, [records]);

  const handleRegister = (user: User) => {
    setUsers(prev => [...prev, user]);
    alert("User registered successfully!");
    setActiveTab('scanner');
  };

  const handleAttendance = (record: AttendanceRecord) => {
    setRecords(prev => [record, ...prev]);
  };

  const NavItem = ({ id, icon: Icon, label }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative w-full flex items-center gap-3 px-4 py-3 mb-1 transition-all duration-200 rounded-md group font-medium text-sm ${
        activeTab === id 
          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      <Icon size={20} className={activeTab === id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
      <span>{label}</span>
      {activeTab === id && (
        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-brand-400"></div>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
      
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-0 -ml-4'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col z-50 shadow-sm`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand-400">
            <Users size={24} />
            <h1 className="font-bold text-lg tracking-tight">StaffPanel</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-2">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Overview" />
          <NavItem id="scanner" icon={ScanFace} label="Attendance Kiosk" />
          <NavItem id="register" icon={UserPlus} label="Employee Registration" />
          <NavItem id="history" icon={FileClock} label="Attendance Logs" />
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold text-xs">
               AD
             </div>
             <div>
               <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Admin User</p>
               <p className="text-xs text-slate-500 dark:text-slate-500">Administrator</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 sticky top-0 z-40 justify-between shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'scanner' && 'Attendance Kiosk'}
              {activeTab === 'register' && 'New Employee'}
              {activeTab === 'history' && 'Attendance Records'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors relative">
               <Bell size={20} />
               <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50 dark:bg-slate-950 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard users={users} records={records} isDarkMode={isDarkMode} />}
            
            {activeTab === 'scanner' && (
              <div className="h-[calc(100vh-140px)] min-h-[600px] bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                 <Scanner users={users} onAttendance={handleAttendance} recentRecords={records} />
                 {users.length === 0 && (
                   <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-200 text-sm text-center">
                     Database is empty. Please register employees first.
                   </div>
                 )}
              </div>
            )}
            
            {activeTab === 'register' && <Registration onRegister={handleRegister} />}
            
            {activeTab === 'history' && <AttendanceHistory records={records} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;