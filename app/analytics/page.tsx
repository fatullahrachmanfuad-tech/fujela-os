"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [productivityScore, setProductivityScore] = useState(0);
  const [activityScore, setActivityScore] = useState(0);
  const [hasJournal, setHasJournal] = useState(false);
  const [hasWorkout, setHasWorkout] = useState(false);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);

  const todayDate = new Date().toISOString().split('T')[0];

  useEffect(() => { fetchAnalyticsData(); }, [router]);

  const fetchAnalyticsData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    const userId = session.user.id;

    const { data: activities } = await supabase.from("activities").select("id, target_type").eq("user_id", userId).eq("frequency", "Daily");
    const { data: actLogs } = await supabase.from("activity_logs").select("*").eq("user_id", userId).eq("log_date", todayDate);

    let tempActScore = 0;
    if (activities && activities.length > 0) {
       const completedActs = activities.filter(a => { const log = actLogs?.find(l => l.activity_id === a.id); return log?.status === 'Completed'; });
       tempActScore = Math.round((completedActs.length / activities.length) * 100);
       setActivityScore(tempActScore);
    }

    const { data: workouts } = await supabase.from("workout_logs").select("id").eq("user_id", userId).eq("workout_date", todayDate);
    const workoutDone = workouts && workouts.length > 0;
    setHasWorkout(workoutDone);

    const { data: journals } = await supabase.from("reflections").select("id").eq("user_id", userId).eq("reflection_date", todayDate);
    const journalDone = journals && journals.length > 0;
    setHasJournal(journalDone);

    let totalScore = (tempActScore * 0.6);
    if (workoutDone) totalScore += 20;
    if (journalDone) totalScore += 20;
    setProductivityScore(Math.min(100, Math.round(totalScore)));

    const mockTrend = [
        { day: 'Sen', score: 65 }, { day: 'Sel', score: 80 }, { day: 'Rab', score: 45 },
        { day: 'Kam', score: 90 }, { day: 'Jum', score: 70 }, { day: 'Sab', score: 85 },
        { day: 'Min', score: Math.min(100, Math.round(totalScore)) }
    ];
    setWeeklyTrend(mockTrend);
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Menganalisis performa...</div>;

  let scoreLabel = "Kritis"; let scoreColor = "text-red-500";
  if (productivityScore >= 80) { scoreLabel = "Sangat Produktif"; scoreColor = "text-green-500"; }
  else if (productivityScore >= 60) { scoreLabel = "Cukup Baik"; scoreColor = "text-blue-500"; }
  else if (productivityScore >= 40) { scoreLabel = "Perlu Fokus"; scoreColor = "text-yellow-500"; }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="mb-8"><h1 className="text-3xl font-bold">Analytics & Score 📈</h1><p className="text-gray-500">Evaluasi performa harian Anda.</p></div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-black text-white p-8 rounded-xl shadow-md flex flex-col justify-center items-center text-center">
            <h2 className="text-sm font-medium opacity-80 uppercase tracking-widest mb-2">Productivity Score</h2>
            <div className="text-7xl font-bold my-4">{productivityScore}</div>
            <p className={`text-lg font-bold uppercase tracking-wider ${scoreColor}`}>{scoreLabel}</p>
        </div>
        <div className="space-y-4">
            <div className="bg-white p-4 border rounded-xl flex items-center justify-between"><div><h3 className="font-bold text-gray-700">Aktivitas Harian</h3></div><div className="text-2xl font-bold">{activityScore}%</div></div>
            <div className="bg-white p-4 border rounded-xl flex items-center justify-between"><div><h3 className="font-bold text-gray-700">Workout / Latihan</h3></div><div className="text-2xl font-bold">{hasWorkout ? "✅ Ya" : "❌ Tidak"}</div></div>
            <div className="bg-white p-4 border rounded-xl flex items-center justify-between"><div><h3 className="font-bold text-gray-700">Daily Reflection</h3></div><div className="text-2xl font-bold">{hasJournal ? "✅ Ya" : "❌ Tidak"}</div></div>
        </div>
      </div>

      <div className="mt-8 bg-white border rounded-xl p-6">
        <h3 className="font-bold mb-6">Tren Produktivitas (7 Hari Terakhir)</h3>
        <div className="flex items-end justify-between h-40 gap-2">
            {weeklyTrend.map((t, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                    <div className="w-full bg-gray-100 rounded-t-md relative flex items-end justify-center" style={{ height: '120px' }}>
                        <div className={`w-full rounded-t-md ${t.score >= 80 ? 'bg-black' : t.score >= 50 ? 'bg-gray-400' : 'bg-red-200'}`} style={{ height: `${t.score}%` }}></div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 mt-2">{t.day}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}