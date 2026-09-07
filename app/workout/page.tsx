"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";

export default function WorkoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [name, setName] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [workoutDate, setWorkoutDate] = useState("");
  const [duration, setDuration] = useState("");
  const [exercises, setExercises] = useState([{ name: "", sets: "", reps: "", weight: "" }]);

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  useEffect(() => { fetchWorkoutData(); setWorkoutDate(new Date().toISOString().split('T')[0]); }, [router]);

  const fetchWorkoutData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setUser(session.user);

    const { data: planData } = await supabase.from("workout_plans").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
    if (planData) setPlans(planData);

    const { data: logData } = await supabase.from("workout_logs").select("*, workout_plans(name)").eq("user_id", session.user.id).order("workout_date", { ascending: false }).limit(5);
    if (logData) setLogs(logData);
    setLoading(false);
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSubmitting(true);
    const { error } = await supabase.from("workout_plans").insert([{ user_id: user.id, name, schedule_days: selectedDays }]);
    if (error) alert("Gagal: " + error.message);
    else { setIsModalOpen(false); setName(""); setSelectedDays([]); fetchWorkoutData(); }
    setIsSubmitting(false);
  };

  const openLogModal = (plan: any) => { setSelectedPlan(plan); setExercises([{ name: "", sets: "", reps: "", weight: "" }]); setDuration(""); setIsLogModalOpen(true); };

  const handleLogWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !duration) return;
    setIsSubmitting(true);
    const validExercises = exercises.filter(ex => ex.name.trim() !== "");
    const { error } = await supabase.from("workout_logs").insert([{ user_id: user.id, plan_id: selectedPlan.id, workout_date: workoutDate, duration_minutes: parseInt(duration), exercises_data: validExercises }]);
    if (error) alert("Gagal mencatat: " + error.message);
    else { setIsLogModalOpen(false); fetchWorkoutData(); }
    setIsSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat modul fitness...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-bold">Workout Management 🏋️</h1><p className="text-gray-500">Rancang jadwal latihan dan catat repetisi Anda.</p></div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Rencana Latihan</h2><button onClick={() => setIsModalOpen(true)} className="text-sm bg-black text-white px-3 py-1.5 rounded-md font-medium">+ Buat Plan</button></div>
          <div className="space-y-3">
            {plans.map(plan => (
              <div key={plan.id} className="p-4 border rounded-xl bg-white flex flex-col">
                <div className="flex justify-between items-start mb-3"><h3 className="font-bold text-lg">{plan.name}</h3><button onClick={() => openLogModal(plan)} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded text-sm font-bold">▶ Catat Sesi</button></div>
                <div className="flex flex-wrap gap-1">{plan.schedule_days?.map((day: string) => <span key={day} className="text-xs bg-gray-100 px-2 py-1 rounded font-medium">{day}</span>)}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Histori Latihan</h2>
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="p-4 border rounded-xl bg-white flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <div><h3 className="font-bold">{log.workout_plans?.name || 'Latihan'}</h3><p className="text-xs text-gray-500">{log.workout_date}</p></div>
                  <div className="text-right"><span className="font-bold text-lg">{log.duration_minutes}</span><span className="text-xs text-gray-500 ml-1">min</span></div>
                </div>
                {log.exercises_data?.length > 0 && (
                  <div className="mt-2 pt-2 border-t flex flex-wrap gap-1">
                    {log.exercises_data.map((ex: any, i: number) => <span key={i} className="text-xs bg-gray-50 border px-2 py-1 rounded">{ex.name} ({ex.sets}x{ex.reps}) {ex.weight && `${ex.weight}kg`}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Rencana Latihan">
        <form onSubmit={handleAddPlan} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Nama Latihan</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium mb-2">Jadwal Hari (Opsional)</label><div className="flex flex-wrap gap-2">
            {weekDays.map(day => <button key={day} type="button" onClick={() => setSelectedDays(selectedDays.includes(day) ? selectedDays.filter(d => d !== day) : [...selectedDays, day])} className={`px-3 py-1.5 rounded-full text-sm font-medium border ${selectedDays.includes(day) ? 'bg-black text-white' : 'bg-white'}`}>{day.substring(0, 3)}</button>)}
          </div></div>
          <button type="submit" className="w-full bg-black text-white p-2 rounded-md font-medium mt-4">Simpan Rencana</button>
        </form>
      </Modal>

      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title={`Catat Sesi: ${selectedPlan?.name}`}>
        <form onSubmit={handleLogWorkout} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-1/2"><label className="block text-sm font-medium mb-1">Tanggal</label><input type="date" required value={workoutDate} onChange={(e) => setWorkoutDate(e.target.value)} className="w-full p-2 border rounded-md" /></div>
            <div className="w-1/2"><label className="block text-sm font-medium mb-1">Durasi (Mnt)</label><input type="number" required value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-2 border rounded-md" /></div>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2"><label className="block text-sm font-medium">Detail Gerakan</label><button type="button" onClick={() => setExercises([...exercises, { name: "", sets: "", reps: "", weight: "" }])} className="text-xs bg-gray-100 px-2 py-1 rounded font-medium">+ Tambah</button></div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {exercises.map((ex, index) => (
                <div key={index} className="flex flex-wrap gap-2 items-center bg-gray-50 p-2 rounded border">
                  <input type="text" placeholder="Gerakan" value={ex.name} onChange={(e) => {const n=[...exercises]; n[index].name=e.target.value; setExercises(n)}} className="w-full text-sm p-1.5 border rounded" />
                  <input type="number" placeholder="Sets" value={ex.sets} onChange={(e) => {const n=[...exercises]; n[index].sets=e.target.value; setExercises(n)}} className="w-1/4 text-sm p-1.5 border rounded" />
                  <input type="number" placeholder="Reps" value={ex.reps} onChange={(e) => {const n=[...exercises]; n[index].reps=e.target.value; setExercises(n)}} className="w-1/4 text-sm p-1.5 border rounded" />
                  <input type="number" placeholder="Kg" value={ex.weight} onChange={(e) => {const n=[...exercises]; n[index].weight=e.target.value; setExercises(n)}} className="w-1/3 text-sm p-1.5 border rounded flex-1" />
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md font-medium mt-4">Simpan Sesi Olahraga</button>
        </form>
      </Modal>
    </div>
  );
}