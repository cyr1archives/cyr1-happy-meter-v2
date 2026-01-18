"use client";

import { useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { motion } from "framer-motion";
import { UserCircle, FileDown, FileText } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ... (Keep existing Types: DashboardData) ...
interface DashboardData {
  total: number;
  average: number;
  weeklyTrend: { week: string; score: number }[];
  byDept: { name: string; score: number }[];
  recent: { name: string; dept: string; mood: string; feedback: string; date: string }[];
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "cyr1admin") { setIsAuthenticated(true); fetchData(); }
    else { alert("Invalid Access Code"); }
  };

  const fetchData = async () => {
    setLoading(true);
    setTimeout(() => {
        setData({
            total: 142,
            average: 3.8,
            weeklyTrend: [
                { week: 'Dec 10 - Dec 16', score: 3.5 }, { week: 'Dec 17 - Dec 23', score: 3.9 },
                { week: 'Dec 24 - Dec 30', score: 4.2 }, { week: 'Dec 31 - Jan 06', score: 3.6 },
                { week: 'Jan 07 - Jan 13', score: 4.5 }
            ],
            byDept: [
                { name: 'Design', score: 4.5 }, { name: 'Eng', score: 2.9 },
                { name: 'Product', score: 3.5 }, { name: 'Sales', score: 4.8 }, { name: 'HR', score: 3.2 }
            ],
            recent: [
                { name: 'Alex S.', dept: 'Design', mood: 'Very Satisfied', feedback: 'Great flow today.', date: 'Today, 10:42 AM' },
                { name: 'Jordan K.', dept: 'Eng', mood: 'Dissatisfied', feedback: 'Blocked on API.', date: 'Today, 09:15 AM' },
                { name: 'Sam M.', dept: 'Sales', mood: 'Very Satisfied', feedback: 'Closed a big deal!', date: 'Today, 08:55 AM' },
                { name: 'Casey L.', dept: 'HR', mood: 'Neutral', feedback: 'Office temp is too cold.', date: 'Yesterday' },
                { name: 'Taylor R.', dept: 'Product', mood: 'Satisfied', feedback: '', date: 'Yesterday' },
            ]
        });
        setLoading(false);
    }, 1500);
  };

  // ... (Keep existing Export Functions) ...
  const exportCSV = () => { /* ... same as before ... */ };
  const exportPDF = async () => {
    if (!dashboardRef.current) return;
    const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
    pdf.save("happy_meter_dashboard.pdf");
  };

  if (!isAuthenticated) return <LoginScreen password={password} setPassword={setPassword} handleLogin={handleLogin} />;

  return (
    <div className="min-h-screen font-sans text-gray-800 relative">

      {/* UPDATE: Use same background as main page */}
      <div className="fixed inset-0 bg-warm-deep-animated -z-20" />
      <div className="vignette-overlay z-0" />

      {/* Navbar */}
      <nav className="glass-panel sticky top-4 z-50 mx-4 md:mx-8 rounded-2xl px-6 py-3 flex justify-between items-center mb-6 shadow-sm">
        <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-white/50 rounded-full flex items-center justify-center shadow-sm">
                <UserCircle className="w-7 h-7 text-gray-600" />
             </div>
             <div>
                <span className="font-bold text-lg tracking-tight block leading-none">Admin Console</span>
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">V2.3 Dashboard</span>
             </div>
        </div>
        <div className="flex gap-3">
             <button onClick={() => setIsAuthenticated(false)} className="text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-white/50 px-4 py-2 rounded-lg transition-colors">Logout</button>
        </div>
      </nav>

      {/* Main Content */}
      <main ref={dashboardRef} className="max-w-7xl mx-auto px-4 md:px-8 pb-12 relative z-10">

        <div className="flex justify-between items-end mb-8 pl-2">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
                <h1 className="text-4xl font-black text-gray-800 mb-2 tracking-tight">Team Pulse</h1>
                <p className="text-gray-600 font-medium">Weekly sentiment analysis for your workspace.</p>
            </motion.div>

            {data && (
                <div className="flex gap-2">
                    <button onClick={exportCSV} className="flex items-center gap-2 bg-white/60 hover:bg-white text-gray-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all">
                        <FileText className="w-4 h-4" /> Export CSV
                    </button>
                    <button onClick={exportPDF} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all">
                        <FileDown className="w-4 h-4" /> Save PDF
                    </button>
                </div>
            )}
        </div>

        {loading || !data ? (
            <div className="text-center py-32 glass-panel rounded-3xl">
                 <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent mb-4"></div>
                 <p className="text-yellow-600 font-bold animate-pulse">Gathering Insights...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                <KPICard title="Total Check-ins" value={data.total} trend="+12% vs last wk" />
                <KPICard title="Avg Mood Score" value={data.average} trend="+0.3 vs last wk" isScore />
                <KPICard title="Response Rate" value="84%" trend="Steady" />

                <motion.div initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} className="md:col-span-8 glass-panel p-8 rounded-[2rem] min-h-[420px] flex flex-col justify-between shadow-xl">
                    <h3 className="text-xl font-bold text-gray-700 mb-6">Sentiment Trend (Weekly)</h3>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.weeklyTrend}>
                                <defs>
                                    <linearGradient id="lineColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#ef4444" />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 11, fontWeight: 600}} dy={10} />
                                <YAxis domain={[1, 5]} hide />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'bold' }} cursor={{ stroke: '#d1d5db' }} />
                                <Line type="monotone" dataKey="score" stroke="url(#lineColor)" strokeWidth={5} dot={{ r: 6, fill: 'white', strokeWidth: 3, stroke: '#9ca3af' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="md:col-span-4 glass-panel p-8 rounded-[2rem] shadow-xl">
                    <h3 className="text-xl font-bold text-gray-700 mb-6">By Dept</h3>
                    <div className="h-[320px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.byDept} layout="vertical" barSize={24}>
                                <XAxis type="number" domain={[0, 5]} hide />
                                <YAxis dataKey="name" type="category" width={70} axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12, fontWeight: 600}} />
                                <Bar dataKey="score" radius={[0, 12, 12, 0]}>
                                    {data.byDept.map((entry, index) => (<Cell key={`cell-${index}`} fill={getColorHex(entry.score)} />))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="md:col-span-12 glass-panel p-8 rounded-[2rem] mt-4 shadow-xl">
                    <h3 className="text-xl font-bold text-gray-700 mb-6">Live Feed</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200/50">
                                <tr>
                                    <th className="pb-4 pl-4">Team Member</th>
                                    <th className="pb-4">Department</th>
                                    <th className="pb-4">Current Mood</th>
                                    <th className="pb-4 w-1/3">Note</th>
                                    <th className="pb-4 text-right pr-4">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {data.recent.map((item, i) => (
                                    <tr key={i} className="group hover:bg-white/40 transition-colors border-b border-transparent hover:border-gray-100/30">
                                        <td className="py-4 pl-4 font-bold text-gray-800 flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${getAvatarColor(item.mood)}`}>
                                                {item.name.charAt(0)}
                                            </div>
                                            {item.name}
                                        </td>
                                        <td className="py-4 text-gray-500 font-medium">{item.dept}</td>
                                        <td className="py-4"><span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${getBadgeColor(item.mood)}`}>{item.mood}</span></td>
                                        <td className="py-4 text-gray-600 italic text-xs">{item.feedback || "-"}</td>
                                        <td className="py-4 text-right pr-4 text-[10px] font-bold text-gray-400 uppercase">{item.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

            </div>
        )}
      </main>
    </div>
  );
}

// ... (Helper functions for KPICard, LoginScreen, colors remain the same as previous admin code)
function KPICard({ title, value, trend, isScore = false }: any) {
    return (
        <motion.div whileHover={{ y: -5 }} className="md:col-span-4 glass-panel p-8 rounded-[2rem] relative overflow-hidden group border-white/60 shadow-xl">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br from-yellow-100 to-transparent rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</p>
            <div className="flex items-end gap-3"><h2 className="text-5xl font-black text-gray-800 tracking-tighter">{value}{isScore && <span className="text-3xl text-gray-400 font-medium">/5</span>}</h2></div>
            <div className="mt-4 flex items-center gap-2"><span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${trend.includes('+') || trend === 'Steady' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{trend}</span></div>
        </motion.div>
    );
}

function LoginScreen({ password, setPassword, handleLogin }: any) {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-warm-deep-animated">
             <div className="vignette-overlay" />
             <form onSubmit={handleLogin} className="glass-panel p-12 rounded-[2.5rem] w-full max-w-sm text-center z-10 shadow-2xl border-white/60">
                <div className="mb-8 text-5xl drop-shadow-md">🔒</div>
                <h2 className="text-3xl font-black text-gray-800 mb-3 tracking-tight">Admin Access</h2>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="glass-input w-full rounded-2xl p-4 mb-4 text-center text-lg font-bold tracking-[0.3em] focus:ring-yellow-400" placeholder="••••••" />
                <button type="submit" className="glass-button-active w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95 mt-2">Unlock</button>
            </form>
        </div>
    );
}

function getColorHex(score: number) {
    if (score >= 4.5) return '#3b82f6'; if (score >= 3.5) return '#22c55e'; if (score >= 2.5) return '#eab308'; if (score >= 1.5) return '#f97316'; return '#ef4444';
}
function getBadgeColor(mood: string) {
    if (mood.includes('Very Satisfied')) return 'bg-blue-100 text-blue-700'; if (mood.includes('Satisfied')) return 'bg-green-100 text-green-700'; if (mood.includes('Neutral')) return 'bg-yellow-100 text-yellow-700'; if (mood.includes('Dissatisfied')) return 'bg-orange-100 text-orange-700'; return 'bg-red-100 text-red-700';
}
function getAvatarColor(mood: string) {
    if (mood.includes('Very Satisfied')) return 'bg-blue-500'; if (mood.includes('Satisfied')) return 'bg-green-500'; if (mood.includes('Neutral')) return 'bg-yellow-400'; if (mood.includes('Dissatisfied')) return 'bg-orange-500'; return 'bg-red-500';
}