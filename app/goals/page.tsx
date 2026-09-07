"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";

export default function GoalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  useEffect(() => { fetchData(); }, [router]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setUser(session.user);

    const { data: catData } = await supabase.from("categories").select("*").eq("user_id", session.user.id);
    if (catData) { setCategories(catData); if (catData.length > 0) setCategoryId(catData[0].id); }

    const { data: actData } = await supabase.from("activities").select("*").eq("user_id", session.user.id);
    if (actData) setActivities(actData);

    const { data: goalData } = await supabase
      .from("goals")
      .select(`*, categories(name), targets(activities(name, target_type, target_value, unit))`)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
      
    if (goalData) setGoals(goalData);
    setLoading(false);
  };

  const toggleActivitySelection = (activityId: string) => {
    if (selectedActivities.includes(activityId)) setSelectedActivities(selectedActivities.filter(id => id !== activityId));
    else setSelectedActivities([...selectedActivities, activityId]);
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId || selectedActivities.length === 0) {
      alert("Mohon isi nama, kategori, dan pilih minimal 1 target aktivitas!"); return;
    }
    setIsSubmitting(true);

    const { data: newGoal, error: goalError } = await supabase.from("goals").insert([{
      user_id: user.id, category_id: categoryId, name, description, start_date: startDate || null, end_date: endDate || null, status: 'In Progress'
    }]).select().single();

    if (goalError) { alert("Gagal menyimpan Goal: " + goalError.message); setIsSubmitting(false); return; }

    const targetInserts = selectedActivities.map(actId => ({ goal_id: newGoal.id, activity_id: actId }));
    const { error: targetError } = await supabase.from("targets").insert(targetInserts);

    if (targetError) alert("Gagal menyimpan Targets: " + targetError.message);
    else {
      setIsModalOpen(false);
      setName(""); setDescription(""); setStartDate(""); setEndDate(""); setSelectedActivities([]);
      fetchData();
    }
    setIsSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat ruang strategi...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Goals & Targets</h1>
          <p className="text-gray-500">Petakan tujuan besar Anda dan lacak pencapaiannya.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800">
          + Buat Goal Baru
        </button>
      </div>

      <div className="space-y-6">
        {goals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-10 text-center text-gray-500">Belum ada Goal. Klik tombol di atas.</div>
        ) : (
          goals.map(goal => (
            <div key={goal.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{goal.name}</h2>
                  <p className="text-gray-500 mt-1">{goal.description}</p>
                </div>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{goal.status}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 border-b pb-4">
                <span className="bg-gray-100 px-2 py-1 rounded text-black font-medium">{goal.categories?.name}</span>
                {goal.start_date && goal.end_date && <span>🗓️ {goal.start_date} s/d {goal.end_date}</span>}
              </div>
              <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-gray-500">Target Activities</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {goal.targets?.map((t: any, i: number) => {
                  if(!t.activities) return null; 
                  return (
                    <div key={i} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                      <span className="text-xl">🎯</span>
                      <div>
                        <p className="font-medium text-black leading-tight">{t.activities.name}</p>
                        <p className="text-xs text-gray-500">{t.activities.target_type === 'Checklist' ? 'Checklist Harian' : `Target: ${t.activities.target_value} ${t.activities.unit}`}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Goal Baru">
        <form onSubmit={handleAddGoal} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Nama Goal</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium mb-1">Deskripsi Singkat</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-md" rows={2} /></div>
          <div><label className="block text-sm font-medium mb-1">Kategori</label>
            <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-2 border rounded-md">
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="w-1/2"><label className="block text-sm font-medium mb-1">Tanggal Mulai</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border rounded-md" /></div>
            <div className="w-1/2"><label className="block text-sm font-medium mb-1">Tenggat Waktu</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border rounded-md" /></div>
          </div>
          <div className="pt-2 border-t">
            <label className="block text-sm font-medium mb-2">Pilih Aktivitas sebagai Target (Minimal 1)</label>
            <div className="max-h-40 overflow-y-auto space-y-2 border p-2 rounded-md bg-gray-50">
              {activities.map(act => (
                <label key={act.id} className="flex items-center p-2 bg-white border rounded cursor-pointer hover:bg-gray-100">
                  <input type="checkbox" checked={selectedActivities.includes(act.id)} onChange={() => toggleActivitySelection(act.id)} className="w-4 h-4 mr-3 accent-black" />
                  <span className="text-sm font-medium">{act.name}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white p-2 rounded-md font-medium mt-4">{isSubmitting ? "Menyimpan..." : "Simpan Goal"}</button>
        </form>
      </Modal>
    </div>
  );
}