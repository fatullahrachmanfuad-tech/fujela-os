"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function TodayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [todayActivities, setTodayActivities] = useState<any[]>([]);
  const [dailyScore, setDailyScore] = useState(0);

  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const todayString = new Date().toLocaleDateString('id-ID', options);
  const dbDate = new Date().toISOString().split('T')[0];

  const hour = new Date().getHours();
  let greeting = "Selamat Pagi";
  if (hour >= 11 && hour < 15) greeting = "Selamat Siang";
  else if (hour >= 15 && hour < 18) greeting = "Selamat Sore";
  else if (hour >= 18 || hour < 4) greeting = "Selamat Malam";

  useEffect(() => { fetchTodayData(); }, [router]);

  const fetchTodayData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setUser(session.user);

    const { data: profileData } = await supabase.from("profiles").select("full_name").eq("id", session.user.id).single();
    if (profileData) setProfile(profileData);

    const { data: actData } = await supabase.from("activities").select("*, categories(name)").eq("user_id", session.user.id).eq("frequency", "Daily");
    const { data: logsData } = await supabase.from("activity_logs").select("*").eq("user_id", session.user.id).eq("log_date", dbDate);

    if (actData) {
      const activitiesWithLog = actData.map(act => {
        const log = logsData?.find(l => l.activity_id === act.id);
        return { ...act, isCompleted: log?.status === 'Completed', currentValue: log?.value || 0 };
      });
      setTodayActivities(activitiesWithLog);
      if (activitiesWithLog.length > 0) {
        const completedCount = activitiesWithLog.filter(a => a.isCompleted).length;
        setDailyScore(Math.round((completedCount / activitiesWithLog.length) * 100));
      }
    }
    setLoading(false);
  };

  const handleLogActivity = async (activity: any) => {
    let logValue = 1;
    let logStatus = 'Completed';

    if (activity.target_type === 'Quantitative') {
      const input = prompt(`Masukkan nilai progres untuk "${activity.name}" (${activity.unit}):\nTarget Anda: ${activity.target_value} ${activity.unit}`);
      if (input === null || input === "") return; 
      logValue = parseFloat(input);
      if (isNaN(logValue)) { alert("Harap masukkan angka yang valid!"); return; }
      if (logValue >= activity.target_value) logStatus = 'Completed';
      else logStatus = 'In Progress';
    }

    const { error } = await supabase.from("activity_logs").insert([{
      activity_id: activity.id, user_id: user.id, log_date: dbDate, value: logValue, status: logStatus
    }]);

    if (error) alert("Gagal mencatat progres: " + error.message);
    else fetchTodayData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat hari Anda...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{greeting}, {profile?.full_name?.split(' ')[0] || "User"} 👋</h1>
        <p className="text-gray-500">{todayString}</p>
      </div>

      <div className="bg-black text-white p-6 rounded-xl shadow-md mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium opacity-80">Daily Score</h2>
          <p className="text-4xl font-bold mt-1">{dailyScore}%</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-80">Aktivitas Selesai</p>
          <p className="text-xl font-bold">{todayActivities.filter(a => a.isCompleted).length} / {todayActivities.length}</p>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4">Fokus Hari Ini</h3>
      <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
        {todayActivities.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Belum ada aktivitas harian. Buat di Manajemen.</p>
        ) : (
          todayActivities.map(act => (
            <div key={act.id} className={`p-4 border rounded-lg flex items-center justify-between transition-colors ${act.isCompleted ? 'bg-gray-50 border-green-200' : 'bg-white'}`}>
              <div>
                <h4 className={`font-bold text-lg ${act.isCompleted ? 'text-gray-500 line-through' : 'text-black'}`}>{act.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{act.categories?.name}</span>
                  <span className="text-xs font-medium text-gray-400">
                    {act.target_type === "Checklist" ? "✅ Checklist" : `🎯 Target: ${act.target_value} ${act.unit}`}
                  </span>
                </div>
              </div>
              <div>
                {act.isCompleted ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-md text-sm font-bold">✓ Selesai</span>
                ) : (
                  <button onClick={() => handleLogActivity(act)} className="bg-black text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800">Selesaikan</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}