import { useEffect, useState } from "react";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Filter, User, Phone, Mail, DollarSign, Shield, Target, TrendingUp, Calendar, Lock, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { formatSafeDate } from "../ui/utils";
import api from "../../services/api";

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  vipLevel: string;
  balance: number;
  status: "Active" | "Suspended" | "Pending";
  joinDate: string;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [formFullName, setFormFullName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formBalance, setFormBalance] = useState<string>("0");
  const [formStatus, setFormStatus] = useState<"Active" | "Suspended" | "Pending">("Active");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFullName, setCreateFullName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [createConfirmPassword, setCreateConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveTime, setSaveTime] = useState<number | null>(null);
  // Commission settings state (simplified)
  const [commissionPerOrder, setCommissionPerOrder] = useState<string>("");
  const [commissionDailyTarget, setCommissionDailyTarget] = useState<string>("");
  const [commissionNumberOfOrders, setCommissionNumberOfOrders] = useState<string>("");
  // Today's stats (read-only)
  const [dailyEarnedSoFar, setDailyEarnedSoFar] = useState<string>('');
  const [dailyOrdersCount, setDailyOrdersCount] = useState<string>('');
  // Add balance inline state
  const [showAddBalanceInput, setShowAddBalanceInput] = useState(false);
  const [addBalanceAmount, setAddBalanceAmount] = useState<string>("");
  const [balanceOperation, setBalanceOperation] = useState<'add' | 'set' | 'subtract'>('add');

  const mapBackendUser = (u: any): UserRow => ({
    id: u.id || u._id, // Support both Prisma (id) and MongoDB (_id)
    name: u.fullName || u.username || "Unknown",
    email: u.email || "",
    phone: u.phoneNumber || "",
    vipLevel: u.vipLevel || "vip-0",
    balance: Number(u.balance || 0),
    status: u.isActive === false ? "Suspended" : "Active",
    joinDate: formatSafeDate(u.createdAt),
  });

  const loadUsers = async (p: number = page, query: string = searchQuery, status: string = statusFilter) => {
    try {
      setLoading(true);
      const res = await api.adminListUsers({
        page: p,
        limit: 20,
        q: query,
        status: status
      });

      const resData = res?.data || {};
      const list = (resData.users || []).map(mapBackendUser);
      setUsers(list);
      setTotalPages(resData.pagination?.pages || 1);
      setTotalUsers(resData.pagination?.total || list.length);
      setPage(p);
    } catch (e) {
      const msg = (e as any)?.message || '';
      if (msg.toLowerCase().includes('unauthorized')) {
        toast.error('Your admin session expired. Please sign in again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = '/admin';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1, searchQuery, statusFilter);
  }, [statusFilter]); // Reload on status change

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(1, searchQuery, statusFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // No frontend filtering needed anymore as we do it on server
  const filteredUsers = users;

  const loadCommissionConfig = async (userId: string) => {
    try {
      const res = await api.adminGetUserCommissionConfig(userId);
      const cfg = res?.data?.commissionConfig || {};
      // Load simplified fields
      setCommissionPerOrder(cfg.perOrderAmount != null ? String(cfg.perOrderAmount) : "");
      setCommissionDailyTarget(cfg.dailyTarget != null ? String(cfg.dailyTarget) : "");
      setCommissionNumberOfOrders(cfg.numberOfOrders != null ? String(cfg.numberOfOrders) : "");
      // Load today's read-only stats
      const de = res?.data?.dailyEarnings || {};
      setDailyEarnedSoFar(de.totalCommission != null ? String(de.totalCommission) : '');
      setDailyOrdersCount(de.ordersCount != null ? String(de.ordersCount) : '');
    } catch { }
  };

  const handleEdit = (user: UserRow) => {
    setSelectedUser(user);
    setFormFullName(user.name || "");
    setFormPhone(user.phone || "");
    setFormBalance(String(user.balance ?? 0));
    setFormStatus(user.status);
    setEditDialogOpen(true);
    setShowAddBalanceInput(false);
    setAddBalanceAmount("");
    setBalanceOperation('add'); // Reset to default operation
    loadCommissionConfig(user.id);
  };

  const handleAddBalance = () => {
    if (!addBalanceAmount || Number(addBalanceAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    const currentBalance = Number(formBalance) || 0;
    const amount = Number(addBalanceAmount);
    let newBalance = currentBalance;
    let message = '';

    switch (balanceOperation) {
      case 'add':
        newBalance = currentBalance + amount;
        message = `Added $${amount} to balance`;
        break;
      case 'set':
        newBalance = amount;
        message = `Set balance to $${amount}`;
        break;
      case 'subtract':
        newBalance = Math.max(0, currentBalance - amount); // Prevent negative balance
        message = `Subtracted $${amount} from balance`;
        break;
    }

    setFormBalance(String(newBalance));
    setShowAddBalanceInput(false);
    setAddBalanceAmount("");
    setBalanceOperation('add'); // Reset to default
    toast.success(message, {
      description: '⚠️ Remember to click "Save Changes" to apply!',
      duration: 5000,
    });
  };
  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setSaveTime(null);

    // Start countdown from 3
    let countdown = 3;
    setSaveTime(countdown);
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown >= 0) {
        setSaveTime(countdown);
      }
    }, 1000);

    try {
      const payload: any = {
        fullName: formFullName,
        phoneNumber: formPhone,
        balance: Number(formBalance),
        isActive: formStatus === "Active",
      };

      // Run API calls in parallel with minimum 3s delay
      const [, ,] = await Promise.all([
        api.adminUpdateUser(selectedUser.id, payload),
        api.adminUpdateUserCommissionConfig(selectedUser.id, {
          perOrderAmount: commissionPerOrder !== '' ? Number(commissionPerOrder) : null,
          dailyTarget: commissionDailyTarget !== '' ? Number(commissionDailyTarget) : null,
          numberOfOrders: commissionNumberOfOrders !== '' ? Number(commissionNumberOfOrders) : null,
        }),
        new Promise(resolve => setTimeout(resolve, 3000)) // Minimum 3s delay
      ]);

      clearInterval(countdownInterval);
      setSaveTime(0);

      // refresh list
      await loadUsers();
      toast.success('User updated successfully!');

      // Auto close after success
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (e: any) {
      clearInterval(countdownInterval);
      toast.error(e?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseEditDialog = (open: boolean) => {
    if (!open) {
      // Reload page when closing modal
      window.location.reload();
    }
    setEditDialogOpen(open);
  };



  const handleDelete = async (user: UserRow) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    try {
      await api.adminDeleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast.success('User deleted successfully!');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">User Management</h1>
          <p className="text-gray-600">Manage all registered users</p>
        </div>
        <button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
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
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>VIP Level</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {user.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{user.phone}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                      {user.vipLevel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-900">${user.balance.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        user.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : user.status === "Pending"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{user.joinDate}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <MoreHorizontal className="w-4 h-4 text-gray-600" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">

                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(user)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-600">Showing {filteredUsers.length} of {totalUsers} users</p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => loadUsers(page - 1)}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1; // Simplified for now
                return (
                  <button
                    key={pageNum}
                    onClick={() => loadUsers(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm ${page === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="px-1">...</span>}
            </div>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => loadUsers(page + 1)}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Edit User Dialog - Redesigned */}
      <Dialog open={editDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 overflow-hidden [&>button]:text-white [&>button]:hover:text-white">
          <DialogTitle className="sr-only">Edit User</DialogTitle>
          {selectedUser && (
            <>
              {/* Header */}
              <div className="bg-blue-600 px-6 py-5">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-3 border-white/30 shadow-lg">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-white/20 text-white text-xl font-semibold">
                      {selectedUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-white text-lg font-semibold">{selectedUser.name}</h2>
                    <p className="text-white/80 text-sm">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-white/20 text-white text-xs border-0">
                        {selectedUser.vipLevel.toUpperCase()}
                      </Badge>
                      <Badge className={`text-xs border-0 ${selectedUser.status === 'Active' ? 'bg-green-400/30 text-green-100' : 'bg-red-400/30 text-red-100'}`}>
                        {selectedUser.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="px-6 py-4 max-h-[55vh] overflow-y-auto">
                {/* Personal Info Section */}
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="relative">
                      <Label className="text-xs text-gray-500 mb-1 block">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          value={formFullName}
                          onChange={(e) => setFormFullName(e.target.value)}
                          className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                          placeholder="Enter full name"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <Label className="text-xs text-gray-500 mb-1 block">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Section */}
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-500" />
                    Account Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Balance ($)</Label>
                      {!showAddBalanceInput ? (
                        <div className="relative flex gap-2">
                          <div className="relative flex-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              type="number"
                              value={formBalance}
                              onChange={(e) => setFormBalance(e.target.value)}
                              className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                              readOnly
                            />
                          </div>
                          <button
                            onClick={() => setShowAddBalanceInput(true)}
                            className="h-11 w-11 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex-shrink-0"
                            title="Add balance"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                            <p className="text-xs text-blue-600 mb-1">Current: ${formBalance}</p>
                            
                            {/* Operation Selector */}
                            <div className="mb-2">
                              <Select value={balanceOperation} onValueChange={(v: any) => setBalanceOperation(v)}>
                                <SelectTrigger className="h-8 text-xs bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="add">Add to Balance</SelectItem>
                                  <SelectItem value="set">Set Balance</SelectItem>
                                  <SelectItem value="subtract">Subtract from Balance</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="relative">
                              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                type="number"
                                value={addBalanceAmount}
                                onChange={(e) => setAddBalanceAmount(e.target.value)}
                                className="pl-8 h-9 text-sm"
                                placeholder={
                                  balanceOperation === 'add' ? 'Amount to add' :
                                  balanceOperation === 'set' ? 'New balance' :
                                  'Amount to subtract'
                                }
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddBalance();
                                  } else if (e.key === 'Escape') {
                                    setShowAddBalanceInput(false);
                                    setAddBalanceAmount("");
                                    setBalanceOperation('add');
                                  }
                                }}
                              />
                            </div>
                            {addBalanceAmount && Number(addBalanceAmount) > 0 && (
                              <p className="text-xs text-blue-700 mt-1 font-medium">
                                New: ${
                                  balanceOperation === 'add' ? (Number(formBalance) + Number(addBalanceAmount)).toFixed(2) :
                                  balanceOperation === 'set' ? Number(addBalanceAmount).toFixed(2) :
                                  Math.max(0, Number(formBalance) - Number(addBalanceAmount)).toFixed(2)
                                }
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setShowAddBalanceInput(false);
                                setAddBalanceAmount("");
                                setBalanceOperation('add');
                              }}
                              className="flex-1 h-8 text-xs border border-gray-200 rounded hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAddBalance}
                              className="flex-1 h-8 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              {balanceOperation === 'add' ? 'Add' : balanceOperation === 'set' ? 'Set' : 'Subtract'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Status</Label>
                      <Select value={formStatus} onValueChange={(v: any) => setFormStatus(v)}>
                        <SelectTrigger className="h-11 bg-gray-50 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">
                            <span className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              Active
                            </span>
                          </SelectItem>
                          <SelectItem value="Suspended">
                            <span className="flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-500" />
                              Suspended
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Commission Section */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Commission Settings
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">Leave empty to use VIP level defaults</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Number of Orders</Label>
                      <div className="relative">
                        <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="50"
                          value={commissionNumberOfOrders}
                          onChange={(e) => setCommissionNumberOfOrders(e.target.value)}
                          className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Daily Target ($)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="100"
                          value={commissionDailyTarget}
                          onChange={(e) => setCommissionDailyTarget(e.target.value)}
                          className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">Per Order ($)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="Auto"
                          value={commissionPerOrder}
                          onChange={(e) => setCommissionPerOrder(e.target.value)}
                          className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                          disabled
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Auto</span>
                      </div>
                    </div>
                  </div>

                  {/* Today Stats Card */}
                  <div className="mt-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Today's Performance
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-green-600">Earned</p>
                        <p className="text-lg font-bold text-green-700">${dailyEarnedSoFar || '0'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">Orders</p>
                        <p className="text-lg font-bold text-green-700">{dailyOrdersCount || '0'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
                <Button
                  onClick={() => handleCloseEditDialog(false)}
                  variant="outline"
                  className="flex-1 h-11"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving... {saveTime !== null && saveTime > 0 ? `${saveTime}s` : ''}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Save Changes
                    </span>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User Dialog - Redesigned */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 overflow-hidden [&>button]:text-white [&>button]:hover:text-white">
          <DialogTitle className="sr-only">Create New User</DialogTitle>
          {/* Header */}
          <div className="bg-blue-600 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Plus className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-white text-lg font-semibold">Create New User</h2>
                <p className="text-white/80 text-sm">Add a new user to the system</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 py-4 max-h-[55vh] overflow-y-auto">
            {/* Personal Info Section */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                Personal Information
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={createFullName}
                      onChange={(e) => setCreateFullName(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={createPhone}
                      onChange={(e) => setCreatePhone(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-500" />
                Security
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="password"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      placeholder="Enter password"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="password"
                      value={createConfirmPassword}
                      onChange={(e) => setCreateConfirmPassword(e.target.value)}
                      className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors ${createConfirmPassword && createPassword !== createConfirmPassword
                        ? 'border-red-300 focus:ring-red-500'
                        : createConfirmPassword && createPassword === createConfirmPassword
                          ? 'border-green-300 focus:ring-green-500'
                          : ''
                        }`}
                      placeholder="Confirm password"
                    />
                    {createConfirmPassword && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {createPassword === createConfirmPassword ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {createConfirmPassword && createPassword !== createConfirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
            <Button
              onClick={() => setCreateDialogOpen(false)}
              variant="outline"
              className="flex-1 h-11"
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!createFullName || !createEmail || !createPassword) {
                  toast.error('Please fill required fields');
                  return;
                }
                if (createPassword !== createConfirmPassword) {
                  toast.error('Passwords do not match');
                  return;
                }
                try {
                  setCreating(true);
                  await api.adminCreateUser({ fullName: createFullName, email: createEmail, phoneNumber: createPhone, password: createPassword });
                  setCreateDialogOpen(false);
                  const createdName = createFullName;
                  setCreateFullName(''); setCreateEmail(''); setCreatePhone(''); setCreatePassword(''); setCreateConfirmPassword('');
                  await loadUsers();
                  toast.success(`User "${createdName}" created successfully!`, {
                    description: 'The new user can now login to the system.',
                    duration: 4000,
                  });
                } catch (e: any) {
                  toast.error(e?.message || 'Failed to create user');
                } finally {
                  setCreating(false);
                }
              }}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={creating || !createFullName || !createEmail || !createPassword || createPassword !== createConfirmPassword}
            >
              {creating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create User
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
