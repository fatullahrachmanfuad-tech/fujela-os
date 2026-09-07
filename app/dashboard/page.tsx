"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // State Data
  const [categories, setCategories] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  
  // State Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form Values
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState("Daily");
  const [targetType, setTargetType] = useState("Checklist");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");

  useEffect(() => {
    fetchData();
  }, [router]);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUser(session.user);

    // Ambil Kategori milik User
    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", session.user.id);
    
    if (catData) setCategories(catData);
    if (catData && catData.length > 0) setCategoryId(catData[0].id);

    // Ambil Aktivitas milik User
    const { data: actData } = await supabase
      .from("activities")
      .select("*, categories(name)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
      
    if (actData) setActivities(actData);
    
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // --- FUNGSI CREATE AKTIVITAS ---
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) return;
    setIsSubmitting(true);

    const newActivity = {
      user_id: user.id,
      category_id: categoryId,
      name,
      frequency,
      target_type: targetType,
      target_value: targetType === "Quantitative" ? parseFloat(targetValue) : null,
      unit: targetType === "Quantitative" ? unit : null
    };

    const { error } = await supabase.from("activities").insert([newActivity]);

    if (error) alert("Gagal menyimpan aktivitas: " + error.message);
    else {
      setIsModalOpen(false);
      resetForm();
      fetchData(); // Refresh daftar aktivitas
    }
    setIsSubmitting(false);
  };

  // --- FUNGSI DELETE AKTIVITAS ---
  const handleDeleteActivity = async (id: string) => {
    if (!confirm("Yakin ingin menghapus aktivitas ini?")) return;
    
    const { error } = await supabase.from("activities").delete().eq("id", id);
    
    if (error) alert("Gagal menghapus: " + error.message);
    else fetchData(); // Refresh UI
  };

  // --- FUNGSI LOG PROGRESS HARI INI ---
  const handleLogActivity = async (activity: any) => {
    let logValue = 1;
    let logStatus = 'Completed';

    // Jika target berupa angka, minta user memasukkan angkanya
    if (activity.target_type === 'Quantitative') {
      const input = prompt(`Masukkan nilai progres untuk "${activity.name}" (${activity.unit}):\nTarget Anda: ${activity.target_value} ${activity.unit}`);
      if (input === null || input === "") return; // Batal jika kosong
      
      logValue = parseFloat(input);
      if (isNaN(logValue)) {
        alert("Harap masukkan angka yang valid!");
        return;
      }

      // Tentukan status berdasarkan target
      if (logValue >= activity.target_value) {
        logStatus = 'Completed';
      } else {
        logStatus = 'In Progress';
      }
    }

    const today = new Date().toISOString().split('T')[0]; // Dapatkan tanggal YYYY-MM-DD

    const { error } = await supabase.from("activity_logs").insert([{
      activity_id: activity.id,
      user_id: user.id,
      log_date: today,
      value: logValue,
      status: logStatus
    }]);

    if (error) {
      alert("Gagal mencatat progres: " + error.message);
    } else {
      alert(`Berhasil mencatat progres! Status: ${logStatus}`);
      // Nanti progres ini akan ditampilkan di Phase 3 (Today Dashboard)
    }
  };

  const resetForm = () => {
    setName("");
    setFrequency("Daily");
    setTargetType("Checklist");
    setTargetValue("");
    setUnit("");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat dashboard...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Kelola aktivitas sistem operasi kehidupan Anda.</p>
        </div>
        <button onClick={handleLogout} className="text-red-500 text-sm font-medium hover:underline">
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Daftar Aktivitas</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800"
          >
            + Tambah
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
            Belum ada aktivitas. Klik "+ Tambah" untuk memulai.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activities.map((act) => (
              <div key={act.id} className="border p-4 rounded-lg flex flex-col relative group">
                
                {/* Tombol Hapus (Tersembunyi, muncul saat kursor diarahkan / di-tap) */}
                <button 
                  onClick={() => handleDeleteActivity(act.id)}
                  className="absolute top-4 right-4 text-xs font-bold text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  HAPUS
                </button>

                <div className="flex justify-between items-start mb-2 pr-12">
                  <h3 className="font-bold text-lg leading-tight">{act.name}</h3>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-600">
                    {act.categories?.name}
                  </span>
                  <span className="text-xs text-gray-500">{act.frequency}</span>
                </div>

                {/* Area Aksi Pencatatan Log */}
                <div className="mt-auto pt-3 border-t flex justify-between items-center">
                  <span className="text-sm font-medium text-black">
                    {act.target_type === "Checklist" ? "✅ Checklist" : `🎯 ${act.target_value} ${act.unit}`}
                  </span>
                  <button 
                    onClick={() => handleLogActivity(act)}
                    className="bg-black text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 active:scale-95 transition-transform"
                  >
                    {act.target_type === "Checklist" ? "Selesaikan" : "Catat Progres"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Add Activity (Tetap sama seperti sebelumnya) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Aktivitas">
        <form onSubmit={handleAddActivity} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Aktivitas</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-md" placeholder="Contoh: Shalat Subuh, Minum Air" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kategori</label>
            <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-2 border rounded-md">
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Frekuensi</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full p-2 border rounded-md">
              <option value="Daily">Setiap Hari</option>
              <option value="Weekly">Mingguan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipe Target</label>
            <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className="w-full p-2 border rounded-md">
              <option value="Checklist">Selesai / Belum (Checklist)</option>
              <option value="Quantitative">Angka / Target (Quantitative)</option>
            </select>
          </div>
          {targetType === "Quantitative" && (
            <div className="flex space-x-2">
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1">Target Angka</label>
                <input type="number" step="0.1" required value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className="w-full p-2 border rounded-md" placeholder="Contoh: 2.5" />
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1">Satuan (Unit)</label>
                <input type="text" required value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full p-2 border rounded-md" placeholder="Contoh: Liter, Halaman" />
              </div>
            </div>
          )}
          <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white p-2 rounded-md font-medium mt-4 disabled:opacity-50">
            {isSubmitting ? "Menyimpan..." : "Simpan Aktivitas"}
          </button>
        </form>
      </Modal>
    </div>
  );
}