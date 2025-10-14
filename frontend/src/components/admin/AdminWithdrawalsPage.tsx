import React, { useEffect, useMemo, useState } from "react";
import { Search, Filter, Check, X, Eye, Clock, Copy } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { toast } from "sonner";
import api from "../../services/api";

interface WithdrawalRow {
  id: string;
  user: { name: string; email: string; balance: number };
  amount: number;
  fee: number;
  totalAmount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: "Pending" | "Approved" | "Rejected";
  requestDate: string;
}

export function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRow | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [actionNotes, setActionNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const mapBackend = (r: any): WithdrawalRow => ({
    id: r._id,
    user: { name: r.userId?.fullName || r.userId?.phoneNumber || r.userId?.username || 'User', email: r.userId?.email || '', balance: Number(r.userId?.balance || 0) },
    amount: Number(r.amount || 0),
    fee: 0,
    totalAmount: Number(r.amount || 0),
    bankName: r.bankName || (r.bankCardId ? 'Bank Card' : ''),
    accountNumber: r.bankCardId || '',
    accountName: r.userId?.fullName || '',
    status: (r.status || 'pending').toLowerCase() === 'approved' ? 'Approved' : (r.status || 'pending').toLowerCase() === 'rejected' ? 'Rejected' : 'Pending',
    requestDate: r.requestDate ? new Date(r.requestDate).toISOString().slice(0,16).replace('T',' ') : '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.adminListWithdrawalRequests({ status: 'all', page: 1, limit: 50 });
      const list = (res?.data?.requests || res?.data || []).map(mapBackend);
      setWithdrawals(list);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filteredWithdrawals = useMemo(() => withdrawals.filter((withdrawal) => {
    const matchesSearch =
      withdrawal.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.accountNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || withdrawal.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [withdrawals, searchQuery, statusFilter]);

  const handleAction = (withdrawal: WithdrawalRow, type: "approve" | "reject") => {
    setSelectedWithdrawal(withdrawal);
    setActionType(type);
    setActionNotes("");
    setActionDialogOpen(true);
  };

  const handleSubmitAction = async () => {
    if (actionType === "reject" && !actionNotes.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    try {
      if (!selectedWithdrawal) return;
      if (actionType === 'approve') {
        await api.adminApproveWithdrawal(selectedWithdrawal.id, actionNotes);
      } else {
        await api.adminRejectWithdrawal(selectedWithdrawal.id, actionNotes);
      }
      toast.success(`Withdrawal ${actionType === 'approve' ? 'approved' : 'rejected'} successfully!`);
      await loadData();
    } catch (e: any) {
      alert(e?.message || 'Action failed');
    }
    setActionDialogOpen(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const pendingCount = withdrawals.filter((w) => w.status === "Pending").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">Withdrawal Requests</h1>
          <p className="text-gray-600">
            Review and process withdrawal requests ({pendingCount} pending)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-orange-100 text-orange-700 px-4 py-2">
            <Clock className="w-4 h-4 mr-2" />
            {pendingCount} Pending
          </Badge>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or account number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Bank Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWithdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {withdrawal.user.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-gray-900">{withdrawal.user.name}</p>
                        <p className="text-sm text-gray-500">{withdrawal.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-900">${withdrawal.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-red-600">-${withdrawal.fee.toFixed(2)}</TableCell>
                  <TableCell className="text-green-600">${withdrawal.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-gray-900">{withdrawal.bankName}</p>
                      <p className="text-gray-500">{withdrawal.accountNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        withdrawal.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : withdrawal.status === "Pending"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {withdrawal.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{withdrawal.requestDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {withdrawal.status === "Pending" ? (
                        <>
                          <button
                            onClick={() => handleAction(withdrawal, "approve")}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction(withdrawal, "reject")}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredWithdrawals.length} of {withdrawals.length} requests
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Withdrawal Request
            </DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">User:</span>
                  <span className="text-gray-900">{selectedWithdrawal.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Balance:</span>
                  <span className="text-gray-900">${selectedWithdrawal.user.balance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-gray-900">${selectedWithdrawal.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fee:</span>
                  <span className="text-red-600">-${selectedWithdrawal.fee.toFixed(2)}</span>
                </div>
                  {/* total to transfer is amount minus fee (fee not available from backend; show amount) */}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm text-gray-900">Total to Transfer:</span>
                    <span className="text-green-600">${selectedWithdrawal.amount.toFixed(2)}</span>
                  </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-900">Bank Details:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bank:</span>
                    <span className="text-gray-900">{selectedWithdrawal.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Account:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">{selectedWithdrawal.accountNumber}</span>
                      <button
                        onClick={() => handleCopy(selectedWithdrawal.accountNumber)}
                        className="p-1 hover:bg-blue-100 rounded"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="text-gray-900">{selectedWithdrawal.accountName}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Notes {actionType === "reject" && <span className="text-red-600">*</span>}</Label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={
                    actionType === "approve"
                      ? "Add optional notes..."
                      : "Provide reason for rejection..."
                  }
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setActionDialogOpen(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitAction}
                  className={`flex-1 ${
                    actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {actionType === "approve" ? "Approve & Transfer" : "Reject"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
