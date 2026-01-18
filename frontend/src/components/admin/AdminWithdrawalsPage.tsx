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
import { formatSafeDateTime } from "../ui/utils";
import api from "../../services/api";

interface WithdrawalRow {
  id: string;
  user: { name: string; email: string; balance: number };
  amount: number;
  fee: number;
  totalAmount: number;
  withdrawalType: 'bank' | 'crypto';
  bankName: string;
  accountNumber: string;
  accountName: string;
  walletAddress: string;
  network: string;
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
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewWithdrawal, setViewWithdrawal] = useState<WithdrawalRow | null>(null);

  const mapBackend = (r: any): WithdrawalRow => ({
    id: r.id || r._id,
    user: { name: r.userId?.fullName || r.userId?.phoneNumber || r.userId?.username || 'User', email: r.userId?.email || '', balance: Number(r.userId?.balance || 0) },
    amount: Number(r.amount || 0),
    fee: 0,
    totalAmount: Number(r.amount || 0),
    withdrawalType: r.withdrawalType || 'bank',
    bankName: r.bankName || r.bankCard?.bankName || '',
    accountNumber: r.accountNumber || r.bankCard?.cardNumber || '',
    accountName: r.accountName || r.bankCard?.accountName || r.userId?.fullName || '',
    walletAddress: r.walletAddress || '',
    network: r.network || '',
    status: (r.status || 'pending').toLowerCase() === 'approved' ? 'Approved' : (r.status || 'pending').toLowerCase() === 'rejected' ? 'Rejected' : 'Pending',
    requestDate: formatSafeDateTime(r.requestDate),
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.adminListWithdrawalRequests({ status: 'all', page: 1, limit: 50 });
      const list = (res?.data?.requests || res?.data || []).map(mapBackend);
      setWithdrawals(list);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filteredWithdrawals = useMemo(() => withdrawals.filter((withdrawal) => {
    const matchesSearch =
      withdrawal.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.network.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || withdrawal.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [withdrawals, searchQuery, statusFilter]);

  const handleAction = (withdrawal: WithdrawalRow, type: "approve" | "reject") => {
    setSelectedWithdrawal(withdrawal);
    setActionType(type);
    setActionNotes("");
    setActionDialogOpen(true);
  };

  const handleViewDetails = (withdrawal: WithdrawalRow) => {
    setViewWithdrawal(withdrawal);
    setViewDialogOpen(true);
  };

  const handleSubmitAction = async () => {
    if (actionType === "reject" && !actionNotes.trim()) {
      toast.error("Please provide a reason for rejection");
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
      toast.error(e?.message || 'Action failed');
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
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
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
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
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
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${withdrawal.withdrawalType === 'crypto'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                      }`}>
                      {withdrawal.withdrawalType === 'crypto' ? 'USDT' : 'Bank'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm max-w-[200px]">
                      {withdrawal.withdrawalType === 'crypto' ? (
                        <>
                          <p className="text-orange-600 font-medium">{withdrawal.network}</p>
                          <div className="flex items-center gap-1">
                            <p className="text-gray-500 truncate flex-1" title={withdrawal.walletAddress}>
                              {withdrawal.walletAddress}
                            </p>
                            <button
                              onClick={() => handleCopy(withdrawal.walletAddress)}
                              className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                              title="Copy Address"
                            >
                              <Copy className="w-3 h-3 text-gray-400 hover:text-blue-500" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-900">{withdrawal.bankName}</p>
                          <div className="flex items-center gap-1">
                            <p className="text-gray-500 truncate flex-1">{withdrawal.accountNumber}</p>
                            <button
                              onClick={() => handleCopy(withdrawal.accountNumber)}
                              className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                              title="Copy Account"
                            >
                              <Copy className="w-3 h-3 text-gray-400 hover:text-blue-500" />
                            </button>
                          </div>
                        </>
                      )}
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
                        <button
                          onClick={() => handleViewDetails(withdrawal)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
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
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                {/* Withdrawal Type Badge */}
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-900 font-medium">
                    {selectedWithdrawal.withdrawalType === 'crypto' ? 'Crypto Details:' : 'Bank Details:'}
                  </p>
                  <span className={`px-2 py-1 text-xs rounded-full ${selectedWithdrawal.withdrawalType === 'crypto'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
                    }`}>
                    {selectedWithdrawal.withdrawalType === 'crypto' ? 'USDT' : 'Bank'}
                  </span>
                </div>

                {/* Bank Card Info */}
                {selectedWithdrawal.withdrawalType === 'bank' && (
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
                )}

                {/* Crypto Wallet Info */}
                {selectedWithdrawal.withdrawalType === 'crypto' && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network:</span>
                      <span className="text-orange-600 font-medium">{selectedWithdrawal.network}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Wallet Address:</span>
                      <div className="flex items-center gap-2 mt-1 bg-white p-2 rounded border">
                        <span className="text-gray-900 text-xs break-all flex-1">{selectedWithdrawal.walletAddress}</span>
                        <button
                          onClick={() => handleCopy(selectedWithdrawal.walletAddress)}
                          className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* VietQR Code for Bank Transfer Only */}
                {selectedWithdrawal.withdrawalType === 'bank' && selectedWithdrawal.bankName && selectedWithdrawal.accountNumber && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm text-gray-700 font-medium mb-2 text-center">Scan to Transfer</p>
                    <div className="flex justify-center">
                      <img
                        src={`https://qr.sepay.vn/img?acc=${selectedWithdrawal.accountNumber}&bank=${selectedWithdrawal.bankName}&amount=${Math.round(selectedWithdrawal.amount)}&des=Withdrawal%20${selectedWithdrawal.id.slice(-6)}&template=compact`}
                        alt="VietQR Code"
                        className="w-48 h-48 rounded-lg border border-gray-200 bg-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Amount: ${selectedWithdrawal.amount.toFixed(2)}
                    </p>
                  </div>
                )}
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
                  className={`flex-1 ${actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                  {actionType === "approve" ? "Approve & Transfer" : "Reject"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
          </DialogHeader>
          {viewWithdrawal && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">User:</span>
                  <span className="text-gray-900 font-medium">{viewWithdrawal.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-gray-900">{viewWithdrawal.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-gray-900 font-medium">${viewWithdrawal.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fee:</span>
                  <span className="text-red-600">-${viewWithdrawal.fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total:</span>
                  <span className="text-green-600 font-medium">${viewWithdrawal.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge
                    variant="secondary"
                    className={
                      viewWithdrawal.status === "Approved"
                        ? "bg-green-100 text-green-700"
                        : viewWithdrawal.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                    }
                  >
                    {viewWithdrawal.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Request Date:</span>
                  <span className="text-gray-900">{viewWithdrawal.requestDate}</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-900 font-medium">
                    {viewWithdrawal.withdrawalType === 'crypto' ? 'Crypto Details:' : 'Bank Details:'}
                  </p>
                  <span className={`px-2 py-1 text-xs rounded-full ${viewWithdrawal.withdrawalType === 'crypto'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700'
                    }`}>
                    {viewWithdrawal.withdrawalType === 'crypto' ? 'USDT' : 'Bank'}
                  </span>
                </div>

                {/* Bank Card Info */}
                {viewWithdrawal.withdrawalType === 'bank' && (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank:</span>
                      <span className="text-gray-900">{viewWithdrawal.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Account:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{viewWithdrawal.accountNumber}</span>
                        <button
                          onClick={() => handleCopy(viewWithdrawal.accountNumber)}
                          className="p-1 hover:bg-blue-100 rounded"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="text-gray-900">{viewWithdrawal.accountName}</span>
                    </div>
                  </div>
                )}

                {/* Crypto Wallet Info */}
                {viewWithdrawal.withdrawalType === 'crypto' && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network:</span>
                      <span className="text-orange-600 font-medium">{viewWithdrawal.network}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Wallet Address:</span>
                      <div className="flex items-center gap-2 mt-1 bg-white p-2 rounded border">
                        <span className="text-gray-900 text-xs break-all flex-1">{viewWithdrawal.walletAddress}</span>
                        <button
                          onClick={() => handleCopy(viewWithdrawal.walletAddress)}
                          className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* VietQR Code for Bank Only */}
                {viewWithdrawal.withdrawalType === 'bank' && viewWithdrawal.bankName && viewWithdrawal.accountNumber && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm text-gray-700 font-medium mb-2 text-center">VietQR Code</p>
                    <div className="flex justify-center">
                      <img
                        src={`https://qr.sepay.vn/img?acc=${viewWithdrawal.accountNumber}&bank=${viewWithdrawal.bankName}&amount=${Math.round(viewWithdrawal.amount)}&des=Withdrawal%20${viewWithdrawal.id.slice(-6)}&template=compact`}
                        alt="VietQR Code"
                        className="w-40 h-40 rounded-lg border border-gray-200 bg-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setViewDialogOpen(false)} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
