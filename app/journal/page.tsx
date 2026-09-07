"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function JournalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [learningLogs, setLearningLogs] = useState<any[]>([]);
  const [reflection, setReflection] = useState<any>({ mood: 3, gratitude: "", lesson: "", tomorrow_focus: "" });

  const [type, setType] = useState("Reading");
  const [topic, setTopic] = useState("");
  const [metricValue, setMetricValue] = useState("");
  const [metricUnit, setMetricUnit] = useState("Pages");
  const [notes, setNotes] = useState("");

  const todayDate = new Date().toISOString().split('T')[0];

  useEffect(() => { fetchJournalData(); }, [router]);

  const fetchJournalData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setUser(session.user);

    const { data: learnData } = await supabase.from("learning_logs").select("*").eq("user_id", session.user.id).eq("log_date", todayDate).order("created_at", { ascending: false });
    if (learnData) setLearningLogs(learnData);

    const { data: refData } = await supabase.from("reflections").select("*").eq("user_id", session.user.id).eq("reflection_date", todayDate).maybeSingle();
    if (refData) setReflection(refData);

    setLoading(false);
  };

  const handleAddLearning = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("learning_logs").insert([{ user_id: user.id, type, topic, metric_value: parseFloat(metricValue), metric_unit: metricUnit, log_date: todayDate, notes }]);
    if (!error) { setTopic(""); setMetricValue(""); setNotes(""); fetchJournalData(); }
  };

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("reflections").upsert({ user_id: user.id, reflection_date: todayDate, mood: reflection.mood, gratitude: reflection.gratitude, lesson: reflection.lesson, tomorrow_focus: reflection.tomorrow_focus }, { onConflict: 'user_id, reflection_date' });
    if (!error) { alert("✨ Refleksi hari ini berhasil disimpan!"); fetchJournalData(); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat ruang jurnal...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="mb-8"><h1 className="text-3xl font-bold">Self Development & Journal 🧠</h1><p className="text-gray-500">Catat progres dan refleksi harian Anda.</p></div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">📚 Tambah Catatan Belajar</h2>
            <form onSubmit={handleAddLearning} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Tipe Pembelajaran</label><select value={type} onChange={(e) => { setType(e.target.value); setMetricUnit(e.target.value === 'Reading' ? 'Pages' : 'Minutes'); }} className="w-full p-2 border rounded-md"><option value="Reading">Membaca Buku (Reading)</option><option value="Course">Kursus / Kelas (Course)</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Judul / Topik</label><input type="text" required value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full p-2 border rounded-md" /></div>
              <div className="flex gap-4">
                <div className="w-2/3"><label className="block text-sm font-medium mb-1">Jumlah</label><input type="number" required value={metricValue} onChange={(e) => setMetricValue(e.target.value)} className="w-full p-2 border rounded-md" /></div>
                <div className="w-1/3"><label className="block text-sm font-medium mb-1">Satuan</label><input type="text" value={metricUnit} onChange={(e) => setMetricUnit(e.target.value)} className="w-full p-2 border rounded-md" /></div>
              </div>
              <button type="submit" className="w-full bg-black text-white p-2 rounded-md font-medium">Simpan Log Belajar</button>
            </form>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold mb-3 text-sm text-gray-500">Aktivitas Belajar Hari Ini</h3>
            <div className="space-y-3">
              {learningLogs.map(log => (
                <div key={log.id} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center">
                  <div><p className="font-bold text-black">{log.topic}</p><span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-700">{log.type}</span></div>
                  <div className="text-right"><span className="font-bold text-lg text-black">{log.metric_value}</span><span className="text-xs text-gray-500 ml-1">{log.metric_unit}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">📝 Refleksi Harian</h2>
            <form onSubmit={handleSaveReflection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mood Hari Ini (1 - 5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button key={num} type="button" onClick={() => setReflection({ ...reflection, mood: num })} className={`flex-1 py-2 rounded-lg font-bold border ${reflection.mood === num ? 'bg-black text-white' : 'bg-white text-gray-600'}`}>{num}</button>
                  ))}
                </div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Apa yang disyukuri hari ini?</label><textarea rows={2} value={reflection.gratitude} onChange={(e) => setReflection({ ...reflection, gratitude: e.target.value })} className="w-full p-2 border rounded-md" /></div>
              <div><label className="block text-sm font-medium mb-1">Fokus utama esok hari</label><textarea rows={2} value={reflection.tomorrow_focus} onChange={(e) => setReflection({ ...reflection, tomorrow_focus: e.target.value })} className="w-full p-2 border rounded-md" /></div>
              <button type="submit" className="w-full bg-black text-white p-2 rounded-md font-medium">Simpan Jurnal</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}