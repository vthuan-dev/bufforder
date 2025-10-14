import React, { useEffect, useMemo, useState } from "react";
import { Search, Filter, Check, X, Eye, Clock } from "lucide-react";
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
import api from "../../services/api";

interface DepositRow {
  id: string;
  user: { name: string; email: string };
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  requestDate: string;
}

export function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRow | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [actionNotes, setActionNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const mapBackend = (r: any): DepositRow => ({
    id: r._id,
    user: { name: r.userId?.fullName || r.userId?.phoneNumber || r.userId?.username || 'User', email: r.userId?.email || '' },
    amount: Number(r.amount || 0),
    status: (r.status || 'pending').toLowerCase() === 'approved' ? 'Approved' : (r.status || 'pending').toLowerCase() === 'rejected' ? 'Rejected' : 'Pending',
    requestDate: r.requestDate ? new Date(r.requestDate).toISOString().slice(0,16).replace('T',' ') : '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.adminListDepositRequests({ status: 'all', page: 1, limit: 50 });
      const list = (res?.data?.requests || res?.data || []).map(mapBackend);
      setDeposits(list);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filteredDeposits = useMemo(() => deposits.filter((deposit) => {
    const matchesSearch =
      deposit.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.amount.toString().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || deposit.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [deposits, searchQuery, statusFilter]);

  const handleAction = (deposit: DepositRow, type: "approve" | "reject") => {
    setSelectedDeposit(deposit);
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
      if (!selectedDeposit) return;
      if (actionType === 'approve') {
        await api.adminApproveDeposit(selectedDeposit.id, actionNotes);
      } else {
        await api.adminRejectDeposit(selectedDeposit.id, actionNotes, actionNotes);
      }
      await loadData();
    } catch (e: any) {
      alert(e?.message || 'Action failed');
    }
    setActionDialogOpen(false);
  };

  const pendingCount = deposits.filter((d) => d.status === "Pending").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">Deposit Requests</h1>
          <p className="text-gray-600">
            Review and process deposit requests ({pendingCount} pending)
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
              placeholder="Search by name, email, or transaction ID..."
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

      {/* Deposits Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeposits.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {deposit.user.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-gray-900">{deposit.user.name}</p>
                        <p className="text-sm text-gray-500">{deposit.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-900">${deposit.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        deposit.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : deposit.status === "Pending"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {deposit.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{deposit.requestDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {deposit.status === "Pending" ? (
                        <>
                          <button
                            onClick={() => handleAction(deposit, "approve")}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction(deposit, "reject")}
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
            Showing {filteredDeposits.length} of {deposits.length} requests
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
              2
            </button>
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
              {actionType === "approve" ? "Approve" : "Reject"} Deposit Request
            </DialogTitle>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">User:</span>
                  <span className="text-gray-900">{selectedDeposit.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-gray-900">${selectedDeposit.amount.toFixed(2)}</span>
                </div>
                {/* Transaction ID removed per request */}
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
                  {actionType === "approve" ? "Approve" : "Reject"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
