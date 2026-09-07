"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // State untuk form
  const [fullName, setFullName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [categories, setCategories] = useState([
    { name: "🕌 Ibadah", selected: true },
    { name: "🍎 Health", selected: true },
    { name: "🏋️ Workout", selected: true },
    { name: "📚 Self Development", selected: true },
  ]);

  useEffect(() => {
    // Ambil data user yang sedang login
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        // Coba ambil nama dari tabel profiles jika sudah ada
        const { data } = await supabase.from("profiles").select("full_name").eq("id", session.user.id).single();
        if (data?.full_name) setFullName(data.full_name);
      }
    };
    getUser();
  }, [router]);

  const toggleCategory = (index: number) => {
    const newCategories = [...categories];
    newCategories[index].selected = !newCategories[index].selected;
    setCategories(newCategories);
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Update Profile (Nama & Timezone)
      await supabase
        .from("profiles")
        .update({ full_name: fullName, timezone: timezone })
        .eq("id", user.id);

      // 2. Insert Kategori yang dipilih
      const selectedCats = categories.filter((c) => c.selected);
      if (selectedCats.length > 0) {
        const categoryData = selectedCats.map((c) => ({
          user_id: user.id,
          name: c.name,
        }));
        
        await supabase.from("categories").insert(categoryData);
      }

      // Selesai, arahkan ke Dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error during onboarding:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        
        {/* Progress Bar Sederhana */}
        <div className="flex mb-6 space-x-2">
          <div className={`h-2 flex-1 rounded ${step >= 1 ? "bg-black" : "bg-gray-200"}`}></div>
          <div className={`h-2 flex-1 rounded ${step >= 2 ? "bg-black" : "bg-gray-200"}`}></div>
          <div className={`h-2 flex-1 rounded ${step >= 3 ? "bg-black" : "bg-gray-200"}`}></div>
        </div>

        {/* STEP 1: Profil */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Selamat Datang! 👋</h2>
            <p className="text-gray-500 text-sm">Mari siapkan sistem operasi kehidupan Anda.</p>
            
            <div>
              <label className="block text-sm font-medium mb-1">Nama Panggilan</label>
              <input 
                type="text" required
                className="w-full p-2 border rounded-md"
                value={fullName} onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Timezone</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={timezone} onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
              </select>
            </div>
            <button 
              onClick={() => setStep(2)} disabled={!fullName}
              className="w-full bg-black text-white p-2 rounded-md font-medium mt-4 disabled:opacity-50"
            >
              Lanjut
            </button>
          </div>
        )}

        {/* STEP 2: Kategori */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Fokus Anda 🎯</h2>
            <p className="text-gray-500 text-sm">Pilih area kehidupan yang ingin Anda pantau.</p>
            
            <div className="space-y-2 mt-4">
              {categories.map((cat, index) => (
                <label key={index} className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                  <input 
                    type="checkbox" 
                    checked={cat.selected} 
                    onChange={() => toggleCategory(index)}
                    className="w-5 h-5 mr-3 accent-black"
                  />
                  <span className="font-medium">{cat.name}</span>
                </label>
              ))}
            </div>
            
            <div className="flex space-x-2 mt-4">
              <button onClick={() => setStep(1)} className="w-1/3 border p-2 rounded-md font-medium">Kembali</button>
              <button onClick={() => setStep(3)} className="w-2/3 bg-black text-white p-2 rounded-md font-medium">Lanjut</button>
            </div>
          </div>
        )}

        {/* STEP 3: Finish */}
        {step === 3 && (
          <div className="space-y-4 text-center py-6">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-2xl font-bold">Semua Siap!</h2>
            <p className="text-gray-500 text-sm">Profil dan kategori Anda telah dikonfigurasi. Mari mulai perjalanan produktivitas Anda.</p>
            
            <div className="flex space-x-2 mt-6">
              <button onClick={() => setStep(2)} className="w-1/3 border p-2 rounded-md font-medium">Kembali</button>
              <button 
                onClick={handleFinish} disabled={loading}
                className="w-2/3 bg-black text-white p-2 rounded-md font-medium disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Mulai Gunakan HIDUPKU"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}