"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";

export default function FinancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState("EXPENSE");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("Food");
  const [txAccountId, setTxAccountId] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txDate, setTxDate] = useState("");

  useEffect(() => { fetchFinanceData(); setTxDate(new Date().toISOString().split('T')[0]); }, [router]);

  const fetchFinanceData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setUser(session.user);

    const { data: accData } = await supabase.from("accounts").select("*").eq("user_id", session.user.id).order("created_at", { ascending: true });
    if (accData) {
      setAccounts(accData);
      setTotalBalance(accData.reduce((sum, acc) => sum + Number(acc.balance), 0));
      if (accData.length > 0 && !txAccountId) setTxAccountId(accData[0].id);
    }

    const { data: txData } = await supabase.from("transactions").select("*, accounts(name)").eq("user_id", session.user.id).order("transaction_date", { ascending: false }).limit(10);
    if (txData) setTransactions(txData);
    setLoading(false);
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("accounts").insert([{ user_id: user.id, name: accountName, type: "Bank", balance: parseFloat(initialBalance) || 0 }]);
    if (!error) { setIsAccountModalOpen(false); setAccountName(""); setInitialBalance(""); fetchFinanceData(); }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(txAmount);
    const { error: txError } = await supabase.from("transactions").insert([{ user_id: user.id, account_id: txAccountId, type: txType, amount: amount, category: txCategory, description: txDescription, transaction_date: txDate }]);
    
    if (!txError) {
      const selectedAccount = accounts.find(a => a.id === txAccountId);
      if (selectedAccount) {
        const newBalance = txType === 'INCOME' ? Number(selectedAccount.balance) + amount : Number(selectedAccount.balance) - amount;
        await supabase.from("accounts").update({ balance: newBalance }).eq("id", txAccountId);
      }
      setIsTxModalOpen(false); setTxAmount(""); setTxDescription(""); fetchFinanceData();
    }
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat keuangan...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="mb-8"><h1 className="text-3xl font-bold">Finance Management 💰</h1><p className="text-gray-500">Lacak arus kas dan kelola aset Anda.</p></div>

      <div className="bg-black text-white p-6 rounded-xl shadow-md mb-8 flex items-center justify-between">
        <div><h2 className="text-sm font-medium opacity-80 mb-1">Total Saldo</h2><p className="text-4xl font-bold">{formatRupiah(totalBalance)}</p></div>
        <button onClick={() => { if(accounts.length>0){ if(!txAccountId) setTxAccountId(accounts[0].id); setIsTxModalOpen(true); } else alert("Buat rekening dulu!"); }} className="bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-gray-200">+ Transaksi</button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Rekening</h2><button onClick={() => setIsAccountModalOpen(true)} className="text-sm font-medium text-blue-600">+ Tambah</button></div>
          <div className="space-y-3">
            {accounts.map(acc => (
              <div key={acc.id} className="p-4 border rounded-xl bg-white flex justify-between items-center">
                <div><h3 className="font-bold text-lg">{acc.name}</h3></div><div className="text-right"><p className="font-bold text-lg">{formatRupiah(acc.balance)}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4">Transaksi Terakhir</h2>
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="p-4 border rounded-xl bg-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex justify-center items-center font-bold ${tx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{tx.type === 'INCOME' ? '↓' : '↑'}</div>
                  <div><h3 className="font-bold text-sm">{tx.category}</h3><p className="text-xs text-gray-500">{tx.description}</p></div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>{tx.type === 'INCOME' ? '+' : '-'}{formatRupiah(tx.amount)}</p>
                  <p className="text-xs text-gray-500">{tx.transaction_date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} title="Tambah Rekening">
        <form onSubmit={handleAddAccount} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Nama Rekening</label><input type="text" required value={accountName} onChange={(e) => setAccountName(e.target.value)} className="w-full p-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium mb-1">Saldo Awal (Rp)</label><input type="number" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} className="w-full p-2 border rounded-md" /></div>
          <button type="submit" className="w-full bg-black text-white p-2 rounded-md font-medium mt-4">Simpan Rekening</button>
        </form>
      </Modal>

      <Modal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} title="Catat Transaksi">
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => setTxType('EXPENSE')} className={`flex-1 py-2 rounded-md font-bold text-sm ${txType === 'EXPENSE' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'}`}>PENGELUARAN</button>
            <button type="button" onClick={() => setTxType('INCOME')} className={`flex-1 py-2 rounded-md font-bold text-sm ${txType === 'INCOME' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>PEMASUKAN</button>
          </div>
          <div><label className="block text-sm font-medium mb-1">Nominal (Rp)</label><input type="number" required value={txAmount} onChange={(e) => setTxAmount(e.target.value)} className="w-full p-2 border rounded-md text-xl font-bold" /></div>
          <div className="flex gap-4">
            <div className="w-1/2"><label className="block text-sm font-medium mb-1">Rekening</label><select required value={txAccountId} onChange={(e) => setTxAccountId(e.target.value)} className="w-full p-2 border rounded-md">{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({formatRupiah(acc.balance)})</option>)}</select></div>
            <div className="w-1/2"><label className="block text-sm font-medium mb-1">Kategori</label><select required value={txCategory} onChange={(e) => setTxCategory(e.target.value)} className="w-full p-2 border rounded-md"><option value="Food">Makan/Belanja/Gaji</option></select></div>
          </div>
          <button type="submit" className="w-full bg-black text-white p-2 rounded-md font-medium mt-4">Simpan Transaksi</button>
        </form>
      </Modal>
    </div>
  );
}