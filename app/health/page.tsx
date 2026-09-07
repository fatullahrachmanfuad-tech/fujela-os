"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function HealthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [healthActivities, setHealthActivities] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState(0);
  const dbDate = new Date().toISOString().split('T')[0];

  useEffect(() => { fetchHealthData(); }, [router]);

  const fetchHealthData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setUser(session.user);

    const { data: catData } = await supabase.from("categories").select("id").eq("user_id", session.user.id).ilike("name", "%Health%").single();
    if (!catData) { setLoading(false); return; }

    const { data: actData } = await supabase.from("activities").select("*").eq("user_id", session.user.id).eq("category_id", catData.id);
    const { data: logsData } = await supabase.from("activity_logs").select("*").eq("user_id", session.user.id).eq("log_date", dbDate);

    if (actData) {
      const activitiesWithLog = actData.map(act => {
        const log = logsData?.find(l => l.activity_id === act.id);
        return { ...act, currentValue: log?.value || 0, isCompleted: log?.status === 'Completed' };
      });
      setHealthActivities(activitiesWithLog);

      if (activitiesWithLog.length > 0) {
        let totalProgress = 0;
        activitiesWithLog.forEach(a => {
          if (a.target_type === 'Checklist') totalProgress += a.isCompleted ? 100 : 0;
          else totalProgress += Math.min(100, (a.currentValue / a.target_value) * 100);
        });
        setHealthScore(Math.round(totalProgress / activitiesWithLog.length));
      }
    }
    setLoading(false);
  };

  const handleQuickAdd = async (activity: any, amountToAdd: number) => {
    const newValue = activity.currentValue + amountToAdd;
    let logStatus = 'In Progress';
    if (activity.target_type === 'Quantitative' && newValue >= activity.target_value) logStatus = 'Completed';
    else if (activity.target_type === 'Checklist') logStatus = 'Completed';

    const { error } = await supabase.from("activity_logs").upsert({
      activity_id: activity.id, user_id: user.id, log_date: dbDate, value: newValue, status: logStatus
    }, { onConflict: 'activity_id, user_id, log_date' });

    if (error) {
      await supabase.from("activity_logs").delete().eq("activity_id", activity.id).eq("log_date", dbDate);
      await supabase.from("activity_logs").insert([{ activity_id: activity.id, user_id: user.id, log_date: dbDate, value: newValue, status: logStatus }]);
    }
    fetchHealthData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat modul kesehatan...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Health & Nutrition 🥗</h1>
        <p className="text-gray-500">Pantau asupan nutrisi dan target kesehatan harian Anda.</p>
      </div>

      <div className="bg-black text-white p-6 rounded-xl shadow-md mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium opacity-80">Daily Health Score</h2>
          <p className="text-4xl font-bold mt-1">{healthScore}%</p>
        </div>
        <div className="text-right text-4xl">❤️</div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {healthActivities.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border p-10 text-center text-gray-500">Belum ada aktivitas Health.</div>
        ) : (
          healthActivities.map(act => (
            <div key={act.id} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-xl">{act.name}</h3>
                {act.isCompleted && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">TERCAPAI</span>}
              </div>
              <div className="mt-auto">
                <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Progres</span><span className="font-bold">{act.currentValue} / {act.target_value} {act.unit}</span></div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-6 overflow-hidden">
                  <div className="bg-black h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (act.currentValue / act.target_value) * 100)}%` }}></div>
                </div>
                {!act.isCompleted && act.target_type === 'Quantitative' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleQuickAdd(act, 1)} className="flex-1 bg-gray-100 py-2 rounded-lg font-medium text-sm">+ 1 {act.unit}</button>
                    {(act.unit.toLowerCase().includes('l') || act.unit.toLowerCase().includes('ml')) && (
                      <button onClick={() => handleQuickAdd(act, 0.25)} className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg font-medium text-sm">+ 0.25 L</button>
                    )}
                  </div>
                )}
                {!act.isCompleted && act.target_type === 'Checklist' && (
                  <button onClick={() => handleQuickAdd(act, 1)} className="w-full bg-black text-white py-2 rounded-lg font-medium">Tandai Selesai</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}