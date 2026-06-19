import { useEffect, useState } from 'react';
import { db } from '@/config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Bell, Trophy, Calendar, Sparkles, GraduationCap, Globe, Shield, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface Stats {
  notices: number;
  events: number;
  achievements: number;
  projects: number;
  sponsors: number;
  collaborations: number;
}

export function DashboardHome({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [stats, setStats] = useState<Stats>({
    notices: 0,
    events: 0,
    achievements: 0,
    projects: 0,
    sponsors: 0,
    collaborations: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [noticesSnap, eventsSnap, achievementsSnap, projectsSnap, sponsorsSnap, collaborationsSnap] = await Promise.all([
        getDocs(collection(db, 'All_Data', 'Notice_Board', 'notices')),
        getDocs(collection(db, 'All_Data', 'Event_Page', 'All_Events_of_RC')),
        getDocs(collection(db, 'All_Data', 'Achievement', 'achievement')),
        getDocs(collection(db, 'All_Data', 'Research_Projects', 'research_projects')),
        getDocs(collection(db, 'sponsors')),
        getDocs(collection(db, 'collaborations')),
      ]);

      setStats({
        notices: noticesSnap.size,
        events: eventsSnap.size,
        achievements: achievementsSnap.size,
        projects: projectsSnap.size,
        sponsors: sponsorsSnap.size,
        collaborations: collaborationsSnap.size,
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Notices Board',
      value: stats.notices,
      icon: Bell,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      tab: 'notices',
      desc: 'Announcements & official updates',
    },
    {
      title: 'Robotics Events',
      value: stats.events,
      icon: Calendar,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      tab: 'events',
      desc: 'National challenges & workshops',
    },
    {
      title: 'Achievements',
      value: stats.achievements,
      icon: Trophy,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      tab: 'achievements',
      desc: 'Trophies & milestones',
    },
    {
      title: 'Research Projects',
      value: stats.projects,
      icon: GraduationCap,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      tab: 'projects',
      desc: 'R&D publications & projects',
    },
    {
      title: 'Club Sponsors',
      value: stats.sponsors,
      icon: Shield,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      tab: 'sponsors',
      desc: 'Corporate sponsors & partners',
    },
    {
      title: 'Collaborations',
      value: stats.collaborations,
      icon: Globe,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      tab: 'collaborations',
      desc: 'Partner university clubs',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-black/40 to-black/40 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
            <Sparkles className="w-4 h-4 text-[#2ECC71]" />
            <span className="text-[#2ECC71] text-xs font-bold uppercase tracking-wider">AUSTRC Administrator Console</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Welcome to the Admin Command Panel
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl">
            Manage your database collections dynamically. Any additions or modifications here will synchronize in real-time with the AUST Robotics Club mobile application and official website.
          </p>
          <button
            onClick={fetchStats}
            className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#2ECC71] hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Dashboard Statistics
          </button>
        </div>
      </div>

      {/* Grid statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              onClick={() => setActiveTab(card.tab)}
              className="bg-black/30 border-gray-850 hover:border-[#2ECC71]/30 transition-all duration-300 hover:shadow-[0_0_30px_0_rgba(46,204,113,0.1)] cursor-pointer overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#2ECC71]/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <CardContent className="p-6 flex items-start gap-4">
                <div className={`p-3.5 rounded-2xl ${card.bgColor} ${card.color} shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <span className="text-gray-400 text-sm font-semibold block">{card.title}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">
                      {loading ? '...' : card.value}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">documents</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{card.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
