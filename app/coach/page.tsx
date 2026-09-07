"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function CoachPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [briefing, setBriefing] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const todayDate = new Date().toISOString().split('T')[0];

  useEffect(() => { fetchUserData(); }, [router]);

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setUser(session.user);
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (profileData) setProfile(profileData);
    setLoading(false);
  };

  const generateInsight = async () => {
    setIsAnalyzing(true); setBriefing(null);
    const userId = user.id;
    
    const { data: journal } = await supabase.from("reflections").select("mood, tomorrow_focus").eq("user_id", userId).eq("reflection_date", todayDate).maybeSingle();
    const { data: accounts } = await supabase.from("accounts").select("balance").eq("user_id", userId);
    const totalBalance = accounts ? accounts.reduce((sum, acc) => sum + Number(acc.balance), 0) : 0;
    const { data: goals } = await supabase.from("goals").select("name").eq("user_id", userId).eq("status", "In Progress");

    setTimeout(() => {
      const userName = profile?.full_name?.split(' ')[0] || "Fuad";
      let greeting = `Halo ${userName}, ini adalah analisis harian Anda. `;
      let recs = [];

      if (journal) {
        if (journal.mood <= 2) { greeting += `Mood kurang baik. `; recs.push("Lakukan sesi Recovery."); }
        else if (journal.mood >= 4) { greeting += `Sangat bersemangat hari ini! `; }
        if (journal.tomorrow_focus) recs.push(`Fokus besok: "${journal.tomorrow_focus}".`);
      } else { greeting += `Jurnal belum diisi. `; recs.push("Isi Daily Reflection malam ini."); }

      if (totalBalance < 500000) { greeting += `Aset likuid rendah. `; recs.push("Hindari pengeluaran tersier."); }
      else if (totalBalance > 10000000) { greeting += `Kondisi kas sehat. `; recs.push("Pertimbangkan investasi."); }

      if (goals && goals.length > 0) greeting += `Target berjalan: ${goals.map(g => g.name).join(", ")}.`;

      setBriefing(greeting);
      setRecommendations(recs.length > 0 ? recs : ["Pertahankan ritme produktivitas Anda!"]);
      setIsAnalyzing(false);
    }, 1500);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat AI Coach...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="mb-8"><h1 className="text-3xl font-bold">FUJELA AI 🤖</h1><p className="text-gray-500">Asisten cerdas untuk memandu kehidupan Anda.</p></div>

      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        {!briefing && !isAnalyzing ? (
          <div className="py-10">
            <div className="text-6xl mb-4">🧠</div><h2 className="text-2xl font-bold mb-2">Minta Insight Harian</h2>
            <button onClick={generateInsight} className="mt-4 bg-black text-white px-8 py-3 rounded-full font-bold">Generate Daily Briefing</button>
          </div>
        ) : isAnalyzing ? (
          <div className="py-10 animate-pulse"><div className="text-5xl mb-4">⏳</div><p className="font-medium text-gray-500">Menganalisis data komprehensif...</p></div>
        ) : (
          <div className="text-left space-y-6">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100"><h3 className="font-bold text-lg mb-2">💬 Pesan FUJELA AI</h3><p className="text-gray-700 text-lg">"{briefing}"</p></div>
            <div>
              <h3 className="font-bold text-lg mb-3 text-gray-500 text-sm">Rekomendasi Tindakan</h3>
              <ul className="space-y-3">{recommendations.map((rec, idx) => <li key={idx} className="flex gap-3 bg-blue-50 text-blue-800 p-4 rounded-lg"><span className="font-bold">⚡</span><span className="font-medium">{rec}</span></li>)}</ul>
            </div>
            <div className="text-center pt-4"><button onClick={generateInsight} className="text-sm font-medium text-gray-500 underline">Analisis Ulang</button></div>
          </div>
        )}
      </div>
    </div>
  );
}