import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Eye, Filter } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
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
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [formFullName, setFormFullName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formBalance, setFormBalance] = useState<string>("0");
  const [formStatus, setFormStatus] = useState<"Active" | "Suspended" | "Pending">("Active");
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFullName, setCreateFullName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [createConfirmPassword, setCreateConfirmPassword] = useState("");
  // Commission settings state
  const [commissionBaseRate, setCommissionBaseRate] = useState<string>("");
  const [commissionMode, setCommissionMode] = useState<'auto' | 'low' | 'high'>('auto');
  const [lowMin, setLowMin] = useState<string>('450');
  const [lowMax, setLowMax] = useState<string>('600');
  const [highMin, setHighMin] = useState<string>('800');
  const [highMax, setHighMax] = useState<string>('1000');
  const [dailyMode, setDailyMode] = useState<string>('');
  const [dailyTarget, setDailyTarget] = useState<string>('');
  const [dailySoFar, setDailySoFar] = useState<string>('');
  const [dailyOrders, setDailyOrders] = useState<string>('');

  const mapBackendUser = (u: any): UserRow => ({
    id: u._id,
    name: u.fullName || u.username || "Unknown",
    email: u.email || "",
    phone: u.phoneNumber || "",
    vipLevel: u.vipLevel || "vip-0",
    balance: Number(u.balance || 0),
    status: u.isActive === false ? "Suspended" : "Active",
    joinDate: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : "",
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.adminListUsers({ page: 1, limit: 100 });
      const list = (res?.data?.users || res?.data || []).map(mapBackendUser);
      setUsers(list);
    } catch (e) {
      const msg = (e as any)?.message || '';
      if (msg.toLowerCase().includes('unauthorized')) {
        alert('Your admin session expired. Please sign in again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        window.location.href = '/admin';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [users, searchQuery, statusFilter]);

  const loadCommissionConfig = async (userId: string) => {
    try {
      const res = await api.adminGetUserCommissionConfig(userId);
      const cfg = res?.data?.commissionConfig || {};
      setCommissionBaseRate(cfg.baseRate != null ? String(cfg.baseRate) : "");
      setCommissionMode((cfg.dailyProfitMode as any) || 'auto');
      const low = cfg.lowTarget || {}; const high = cfg.highTarget || {};
      setLowMin(String(low.min ?? 450)); setLowMax(String(low.max ?? 600));
      setHighMin(String(high.min ?? 800)); setHighMax(String(high.max ?? 1000));
      const de = res?.data?.dailyEarnings || {};
      setDailyMode(de.mode || '');
      setDailyTarget(de.targetTotal != null ? String(de.targetTotal) : '');
      setDailySoFar(de.totalCommission != null ? String(de.totalCommission) : '');
      setDailyOrders(de.ordersCount != null ? String(de.ordersCount) : '');
    } catch {}
  };

  const handleEdit = (user: UserRow) => {
    setSelectedUser(user);
    setFormFullName(user.name || "");
    setFormPhone(user.phone || "");
    setFormBalance(String(user.balance ?? 0));
    setFormStatus(user.status);
    setEditDialogOpen(true);
    loadCommissionConfig(user.id);
  };
  const handleSave = async () => {
    if (!selectedUser) return;
    try {
      const payload: any = {
        fullName: formFullName,
        phoneNumber: formPhone,
        balance: Number(formBalance),
        isActive: formStatus === "Active",
      };
      await api.adminUpdateUser(selectedUser.id, payload);
      // Save commission config
      const commissionConfig: any = {
        baseRate: commissionBaseRate !== '' ? Number(commissionBaseRate) : null,
        dailyProfitMode: commissionMode,
        lowTarget: { min: Number(lowMin), max: Number(lowMax) },
        highTarget: { min: Number(highMin), max: Number(highMax) },
      };
      await api.adminUpdateUserCommissionConfig(selectedUser.id, commissionConfig);
      // refresh list and close dialog
      await loadUsers();
      setEditDialogOpen(false);
    } catch (e: any) {
      alert(e?.message || 'Failed to update user');
    }
  };

  const handleView = (user: UserRow) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleDelete = async (user: UserRow) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    try {
      await api.adminDeleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (e: any) {
      alert(e?.message || 'Failed to delete user');
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
                        <DropdownMenuItem onClick={() => handleView(user)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
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

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-600">Showing {filteredUsers.length} of {users.length} users</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Previous</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">2</button>
            <button className="px-3 py-1 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
          {selectedUser && (
            <div className="space-y-4 pb-2">
              <div>
                <Label>Full Name</Label>
                <Input value={formFullName} onChange={(e) => setFormFullName(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
              </div>
              <div>
                <Label>Balance</Label>
                <Input type="number" value={formBalance} onChange={(e) => setFormBalance(e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v: any) => setFormStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Commission settings */}
              <div className="pt-2 border-t">
                <h3 className="text-gray-900 mb-2">Commission settings</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Base Rate (%) — leave blank to use VIP</Label>
                    <Input placeholder="e.g. 0.5" value={commissionBaseRate} onChange={(e) => setCommissionBaseRate(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label>Daily Profit Mode</Label>
                    <Select value={commissionMode} onValueChange={(v: any) => setCommissionMode(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto (random high days)</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Low min</Label>
                    <Input type="number" value={lowMin} onChange={(e) => setLowMin(e.target.value)} />
                  </div>
                  <div>
                    <Label>Low max</Label>
                    <Input type="number" value={lowMax} onChange={(e) => setLowMax(e.target.value)} />
                  </div>
                  <div>
                    <Label>High min</Label>
                    <Input type="number" value={highMin} onChange={(e) => setHighMin(e.target.value)} />
                  </div>
                  <div>
                    <Label>High max</Label>
                    <Input type="number" value={highMax} onChange={(e) => setHighMax(e.target.value)} />
                  </div>
                </div>

                {/* Today read-only */}
                <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="text-gray-700">Today</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="text-gray-500">Mode: </span>
                      <span className="text-gray-900">{dailyMode || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Target: </span>
                      <span className="text-gray-900">{dailyTarget || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Earned: </span>
                      <span className="text-gray-900">{dailySoFar || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Orders: </span>
                      <span className="text-gray-900">{dailyOrders || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setEditDialogOpen(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1 bg-blue-600">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Label>Full Name</Label>
              <Input value={createFullName} onChange={(e) => setCreateFullName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" value={createConfirmPassword} onChange={(e) => setCreateConfirmPassword(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => setCreateDialogOpen(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!createFullName || !createEmail || !createPassword) return alert('Please fill required fields');
                  if (createPassword !== createConfirmPassword) return alert('Passwords do not match');
                  try {
                    setCreating(true);
                    await api.adminCreateUser({ fullName: createFullName, email: createEmail, phoneNumber: createPhone, password: createPassword });
                    setCreateDialogOpen(false);
                    setCreateFullName(''); setCreateEmail(''); setCreatePhone(''); setCreatePassword(''); setCreateConfirmPassword('');
                    await loadUsers();
                  } catch (e: any) {
                    alert(e?.message || 'Failed to create user');
                  } finally {
                    setCreating(false);
                  }
                }}
                className="flex-1 bg-blue-600"
                disabled={creating || !createFullName || !createEmail || !createPassword || createPassword !== createConfirmPassword}
              >
                {creating ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-1">
          {selectedUser && (
            <div className="space-y-4 pb-2">
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                    {selectedUser.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-gray-900">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="text-gray-900">{selectedUser.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">VIP Level</p>
                  <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                    {selectedUser.vipLevel}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Balance</p>
                  <p className="text-gray-900">${selectedUser.balance.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <Badge
                    variant="secondary"
                    className={
                      selectedUser.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : selectedUser.status === "Pending"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {selectedUser.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Join Date</p>
                  <p className="text-gray-900">{selectedUser.joinDate}</p>
                </div>
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
