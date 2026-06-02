/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Wallet,
  ArrowDownToLine,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
} from "lucide-react";
import {
  getWalletBalance,
  getWalletTransactions,
  getMyWithdrawals,
  createWithdrawalRequest,
} from "@/lib/client-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n || 0);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const WITHDRAWAL_STATUS = {
  pending: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  processing: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800", icon: RefreshCw },
  completed: { label: "Hoàn tất", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  rejected: { label: "Bị từ chối", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function HostWalletPage() {
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"transactions" | "withdrawals">("transactions");

  // Withdraw dialog
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  async function fetchAll() {
    setLoading(true);
    try {
      const [balRes, txRes, wdRes] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions(1, 50),
        getMyWithdrawals(1, 50),
      ]);
      if (balRes.success) setBalance(balRes.data);
      if (txRes.success) setTransactions((txRes.data as any)?.transactions || []);
      if (wdRes.success) setWithdrawals((wdRes.data as any)?.withdrawals || []);
    } catch {
      toast.error("Không thể tải dữ liệu ví");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function handleWithdraw() {
    const amount = parseInt(withdrawAmount.replace(/[^0-9]/g, ""));
    if (!amount || amount < 50000) {
      toast.error("Số tiền rút tối thiểu là 50,000₫");
      return;
    }
    if (balance && amount > balance.availableBalance) {
      toast.error("Số tiền vượt quá số dư khả dụng");
      return;
    }

    setWithdrawing(true);
    try {
      const res = await createWithdrawalRequest(amount);
      if (res.success) {
        toast.success("Đã tạo lệnh rút tiền thành công! Admin sẽ xử lý sớm.");
        setWithdrawDialog(false);
        setWithdrawAmount("");
        await fetchAll();
      } else {
        toast.error(res.message || "Có lỗi xảy ra");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const availableBalance = balance?.availableBalance ?? 0;
  const totalBalance = balance?.walletBalance ?? 0;
  const pendingAmount = balance?.pendingWithdrawalAmount ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-indigo-500" />
            Ví của tôi
          </h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý số dư và lệnh rút tiền</p>
        </div>
        <Button
          onClick={() => setWithdrawDialog(true)}
          disabled={availableBalance < 50000}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <ArrowDownToLine className="h-4 w-4" />
          Rút tiền
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
          <p className="text-indigo-200 text-sm font-medium">Tổng số dư ví</p>
          <p className="text-3xl font-black mt-1">{fmt(totalBalance)}₫</p>
          <p className="text-indigo-300 text-xs mt-2">Bao gồm cả tiền đang chờ rút</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Có thể rút ngay</p>
          <p className="text-3xl font-black mt-1 text-emerald-600">{fmt(availableBalance)}₫</p>
          <p className="text-slate-400 text-xs mt-2">Tối thiểu 50,000₫/lần</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Đang chờ xử lý</p>
          <p className="text-3xl font-black mt-1 text-amber-500">{fmt(pendingAmount)}₫</p>
          <p className="text-slate-400 text-xs mt-2">Lệnh rút đang chờ admin duyệt</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "transactions"
              ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20"
              : "text-slate-500 hover:text-slate-700"
              }`}
          >
            Lịch sử giao dịch ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "withdrawals"
              ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20"
              : "text-slate-500 hover:text-slate-700"
              }`}
          >
            Lệnh rút tiền ({withdrawals.length})
          </button>
        </div>

        <div className="p-4">
          {activeTab === "transactions" && (
            <>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-slate-500 mt-3">Chưa có giao dịch nào</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx: any) => (
                    <div
                      key={tx._id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${tx.type === "credit"
                          ? "bg-emerald-100 dark:bg-emerald-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                          }`}>
                          {tx.type === "credit" ? (
                            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {tx.description}
                          </p>
                          <p className="text-xs text-slate-400">{fmtDate(tx.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${tx.type === "credit" ? "text-emerald-600" : "text-red-500"}`}>
                          {tx.type === "credit" ? "+" : "-"}{fmt(tx.amount)}₫
                        </p>
                        <p className="text-xs text-slate-400">Số dư: {fmt(tx.balanceAfter)}₫</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "withdrawals" && (
            <>
              {withdrawals.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowDownToLine className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-slate-500 mt-3">Chưa có lệnh rút nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((wd: any) => {
                    const st = WITHDRAWAL_STATUS[wd.status as keyof typeof WITHDRAWAL_STATUS] || WITHDRAWAL_STATUS.pending;
                    const Icon = st.icon;
                    return (
                      <div
                        key={wd._id}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                            <ArrowDownToLine className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              Rút {fmt(wd.amount)}₫
                            </p>
                            <p className="text-xs text-slate-400">{wd.bankInfo?.bankName} — {wd.bankInfo?.accountNumber}</p>
                            <p className="text-xs text-slate-400">{fmtDate(wd.createdAt)}</p>
                            {wd.adminNote && (
                              <p className="text-xs text-slate-500 mt-1 italic">"{wd.adminNote}"</p>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {st.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialog} onOpenChange={setWithdrawDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-indigo-600" />
              Rút tiền về ngân hàng
            </DialogTitle>
            <DialogDescription>
              Số dư khả dụng: <strong className="text-emerald-600">{fmt(availableBalance)}₫</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="withdraw-amount">Số tiền muốn rút (tối thiểu 50,000₫)</Label>
              <Input
                id="withdraw-amount"
                type="text"
                placeholder="VD: 500000"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9]/g, ""))}
                className="mt-1.5"
              />
              {withdrawAmount && (
                <p className="text-xs text-slate-500 mt-1">
                  = {fmt(parseInt(withdrawAmount) || 0)}₫
                </p>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700 flex items-start gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                Tiền sẽ được chuyển tới tài khoản ngân hàng đã đăng ký. Admin sẽ xử lý trong 1-2 ngày làm việc.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialog(false)} disabled={withdrawing}>
              Hủy
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawAmount}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {withdrawing ? "Đang tạo..." : "Xác nhận rút tiền"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
