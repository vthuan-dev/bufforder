import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Filter, User, Phone, Mail, DollarSign, Shield, Target, TrendingUp, Calendar, Lock, CheckCircle2, XCircle, Loader2, X } from "lucide-react";
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
import { Switch } from "../ui/switch";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
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
  isFrozen?: boolean;
  frozenBalance?: number;
  frozenReason?: string;
  completedToday?: number;
  totalDailyTasks?: number;
}

// VIP Level max orders mapping
const VIP_MAX_ORDERS: Record<string, number> = {
  'vip-0': 0,
  'vip-1': 60,
  'vip-2': 100,
  'vip-3': 120,
  'vip-4': 150,
  'vip-5': 180,
  'vip-6': 220,
  'vip-7': 250,
  'svip': 280,
  'royal-vip': 330,
};

export function AdminUsersPage() {
  const { t } = useTranslation('adminUsers');
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

  // Freeze Threshold Dialog
  const [freezeThresholdDialogOpen, setFreezeThresholdDialogOpen] = useState(false);
  const [freezeThresholdUser, setFreezeThresholdUser] = useState<UserRow | null>(null);
  const [freezeThresholdValue, setFreezeThresholdValue] = useState("");
  const [freezeThresholdCurrentOrders, setFreezeThresholdCurrentOrders] = useState(0);
  const [freezeThresholdLoading, setFreezeThresholdLoading] = useState(false);

  // NEW: Freeze Enable and Mode
  const [freezeEnabled, setFreezeEnabled] = useState(false);
  const [freezeMode, setFreezeMode] = useState<'random' | 'custom'>('custom');

  // Target Product for Freeze
  const [targetProductPrice, setTargetProductPrice] = useState("");
  const [targetProduct, setTargetProduct] = useState<any>(null);
  const [searchingProduct, setSearchingProduct] = useState(false);
  const [productSearchError, setProductSearchError] = useState("");
  const [productList, setProductList] = useState<any[]>([]); // List of products from search
  const [showProductDropdown, setShowProductDropdown] = useState(false); // Show/hide dropdown

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
    isFrozen: Boolean(u.isFrozen),
    frozenBalance: Number(u.frozenBalance || 0),
    frozenReason: u.frozenReason || '',
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
        toast.error(t('notifications.sessionExpired'));
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
      toast.error(t('notifications.validAmount'));
      return;
    }
    const currentBalance = Number(formBalance) || 0;
    const amount = Number(addBalanceAmount);
    let newBalance = currentBalance;
    let message = '';

    switch (balanceOperation) {
      case 'add':
        newBalance = currentBalance + amount;
        message = t('notifications.addedBalance', { amount });
        break;
      case 'set':
        newBalance = amount;
        message = t('notifications.setBalance', { amount });
        break;
      case 'subtract':
        newBalance = Math.max(0, currentBalance - amount); // Prevent negative balance
        message = t('notifications.subtractedBalance', { amount });
        break;
    }

    setFormBalance(String(newBalance));
    setShowAddBalanceInput(false);
    setAddBalanceAmount("");
    setBalanceOperation('add'); // Reset to default
    toast.success(message, {
      description: t('notifications.rememberToSave'),
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
      toast.success(t('notifications.userUpdated'));

      // Auto close after success
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (e: any) {
      clearInterval(countdownInterval);
      toast.error(e?.message || t('notifications.updateFailed'));
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
    if (!confirm(t('notifications.deleteConfirm', { name: user.name }))) return;
    try {
      await api.adminDeleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast.success(t('notifications.userDeleted'));
    } catch (e: any) {
      toast.error(e?.message || t('notifications.deleteFailed'));
    }
  };

  const handleUnlock = async (user: UserRow) => {
    if (!confirm(t('notifications.unlockConfirm', { name: user.name }))) return;
    try {
      await api.adminUnlockUser(user.id);
      toast.success(t('notifications.userUnlocked'));
      // Reload page to reflect changes immediately
      setTimeout(() => window.location.reload(), 500);
    } catch (e: any) {
      toast.error(e?.message || t('notifications.unlockFailed'));
    }
  };

  const handleFreeze = async (user: UserRow) => {
    const reason = prompt(t('notifications.freezeReasonPrompt'));
    if (reason === null) return; // User cancelled

    if (!confirm(t('notifications.freezeConfirm', { name: user.name }))) return;
    try {
      await api.adminFreezeUser(user.id, reason || undefined);
      toast.success(t('notifications.userFrozen'));
      // Reload page to reflect changes immediately
      setTimeout(() => window.location.reload(), 500);
    } catch (e: any) {
      toast.error(e?.message || t('notifications.freezeFailed'));
    }
  };

  const handleSetFreezeThreshold = async (user: UserRow) => {
    setFreezeThresholdUser(user);
    setFreezeThresholdValue("");
    setFreezeThresholdCurrentOrders(0);
    setTargetProduct(null); // Reset
    setTargetProductPrice(""); // Reset
    setFreezeEnabled(false); // Reset
    setFreezeMode('custom'); // Reset to custom mode
    setFreezeThresholdLoading(true);
    setFreezeThresholdDialogOpen(true);

    try {
      // Fetch today's order count and saved target product for this user
      const statsRes = await api.adminGetUserOrderStats(user.id);

      if (statsRes?.success && statsRes?.data) {
        const todayOrders = Number(statsRes.data.todayOrders || 0);
        console.log('[FreezeThreshold] Today orders:', todayOrders);
        setFreezeThresholdCurrentOrders(todayOrders);

        // Load saved freeze enabled state
        const isEnabled = statsRes.data.autoFreezeEnabled === true ||
          (statsRes.data.autoFreezeThreshold != null && statsRes.data.autoFreezeThreshold > 0);
        setFreezeEnabled(isEnabled);

        // Load saved freeze mode
        const savedMode = statsRes.data.autoFreezeMode || 'custom';
        setFreezeMode(savedMode as 'random' | 'custom');

        // Load saved freeze threshold if exists
        if (statsRes.data.autoFreezeThreshold) {
          console.log('[FreezeThreshold] Loaded saved threshold:', statsRes.data.autoFreezeThreshold);
          setFreezeThresholdValue(String(statsRes.data.autoFreezeThreshold));
        }

        // Load saved target product if exists
        if (statsRes.data.targetProduct) {
          console.log('[FreezeThreshold] Loaded saved target product:', statsRes.data.targetProduct);
          setTargetProduct(statsRes.data.targetProduct);
          setTargetProductPrice(statsRes.data.targetProduct.price.toString());
        }
      } else {
        console.log('[FreezeThreshold] No stats data, using 0');
        setFreezeThresholdCurrentOrders(0);
      }
    } catch (e: any) {
      console.error('[FreezeThreshold] Failed to load stats:', e);
      setFreezeThresholdCurrentOrders(0);
    } finally {
      setFreezeThresholdLoading(false);
    }
  };

  // Auto-search products when price changes (with debounce)
  useEffect(() => {
    // Don't search if a product is already selected
    if (targetProduct) {
      return;
    }

    const price = parseFloat(targetProductPrice);

    if (isNaN(price) || price <= 0) {
      setProductList([]);
      setShowProductDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingProduct(true);
        setProductSearchError('');

        const response = await api.adminFindProductByPrice(price);

        if (response.success && response.data && Array.isArray(response.data)) {
          setProductList(response.data);
          setShowProductDropdown(response.data.length > 0);
        } else {
          setProductList([]);
          setShowProductDropdown(false);
        }
      } catch (error: any) {
        setProductSearchError(error?.message || 'Lỗi khi tìm sản phẩm');
        setProductList([]);
        setShowProductDropdown(false);
      } finally {
        setSearchingProduct(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [targetProductPrice, targetProduct]);

  // Search for target product by price
  const handleSearchProductByPrice = async () => {
    const price = parseFloat(targetProductPrice);

    if (isNaN(price) || price <= 0) {
      setProductSearchError('Vui lòng nhập giá hợp lệ');
      return;
    }

    try {
      setSearchingProduct(true);
      setProductSearchError('');
      setTargetProduct(null);

      const response = await api.adminFindProductByPrice(price);

      if (response.success && response.data && Array.isArray(response.data)) {
        setProductList(response.data);
        setShowProductDropdown(response.data.length > 0);
      } else {
        setProductSearchError('Không tìm thấy sản phẩm phù hợp trong khoảng giá này');
        setProductList([]);
        setShowProductDropdown(false);
      }
    } catch (error: any) {
      setProductSearchError(error?.message || 'Lỗi khi tìm sản phẩm');
      setProductList([]);
      setShowProductDropdown(false);
    } finally {
      setSearchingProduct(false);
    }
  };

  // Select product from dropdown
  const handleSelectProduct = (product: any) => {
    setTargetProduct(product);
    setShowProductDropdown(false);
    // Don't update price to avoid triggering search again
    // setTargetProductPrice(product.price.toString());
  };

  const handleConfirmFreezeThreshold = async () => {
    if (!freezeThresholdUser) return;

    try {
      const maxOrders = VIP_MAX_ORDERS[freezeThresholdUser.vipLevel] || 0;

      // Validate only when enabled and custom mode
      if (freezeEnabled && freezeMode === 'custom') {
        const threshold = freezeThresholdValue === '' ? null : parseInt(freezeThresholdValue);

        if (threshold === null || isNaN(threshold) || threshold < 1) {
          toast.error('Vui lòng nhập số đơn hợp lệ khi chọn mode "Số đơn cụ thể"');
          return;
        }

        // Validate: threshold must be > current orders and < max orders
        if (threshold <= freezeThresholdCurrentOrders) {
          toast.error(t('freezeThresholdDialog.errorTooLow', { current: freezeThresholdCurrentOrders }));
          return;
        }

        if (threshold >= maxOrders) {
          toast.error(t('freezeThresholdDialog.errorTooHigh', { max: maxOrders }));
          return;
        }
      }

      // Validate: target product price must be > user balance (only when enabled)
      if (freezeEnabled && targetProduct && targetProduct.price <= freezeThresholdUser.balance) {
        toast.error(t('freezeThresholdDialog.errorProductPriceTooLow', {
          price: targetProduct.price.toFixed(2),
          balance: freezeThresholdUser.balance.toFixed(2)
        }));
        return;
      }

      // Build commission config with freeze settings
      const config: any = {
        autoFreezeEnabled: freezeEnabled,
        autoFreezeMode: freezeMode,
        autoFreezeThreshold: freezeMode === 'custom' ? parseInt(freezeThresholdValue) || null : null
      };

      // Add target product if specified
      if (targetProduct) {
        config.freezeTargetProductId = targetProduct.id;
        config.freezeTargetPrice = targetProduct.price;
      }

      await api.adminSetFreezeThreshold(freezeThresholdUser.id, config.autoFreezeThreshold, config);

      // Show appropriate success message
      if (!freezeEnabled) {
        toast.success('Đã TẮT đóng băng tự động cho user này');
      } else if (freezeMode === 'random') {
        toast.success('Đã BẬT đóng băng tự động (80-90% random)');
      } else {
        toast.success(`Đã BẬT đóng băng ở đơn thứ ${freezeThresholdValue}${targetProduct ? ` với sản phẩm ${targetProduct.name}` : ''}`);
      }

      setFreezeThresholdDialogOpen(false);
      setTimeout(() => window.location.reload(), 500);
    } catch (e: any) {
      toast.error(e?.message || t('freezeThresholdDialog.errorFailed'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">{t('title')}</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>
        <button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" />
          {t('addUser')}
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatus')}</SelectItem>
              <SelectItem value="Active">{t('active')}</SelectItem>
              <SelectItem value="Pending">{t('pending')}</SelectItem>
              <SelectItem value="Suspended">{t('suspended')}</SelectItem>
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
                <TableHead>{t('table.user')}</TableHead>
                <TableHead>{t('table.phone')}</TableHead>
                <TableHead>{t('table.vipLevel')}</TableHead>
                <TableHead>{t('table.balance')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.joinDate')}</TableHead>
                <TableHead className="text-right">{t('table.actions')}</TableHead>
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
                  <TableCell className="text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>${user.balance.toFixed(2)}</span>
                      {user.isFrozen && (
                        <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                          <Lock className="w-3 h-3 mr-1" />
                          Frozen
                        </Badge>
                      )}
                    </div>
                  </TableCell>
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

                        {user.isFrozen ? (
                          <DropdownMenuItem onClick={() => handleUnlock(user)} className="text-green-600">
                            <Lock className="w-4 h-4 mr-2" />
                            {t('actions.unlock')}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleFreeze(user)} className="text-orange-600">
                            <Lock className="w-4 h-4 mr-2" />
                            {t('actions.freeze')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleSetFreezeThreshold(user)} className="text-purple-600">
                          <Target className="w-4 h-4 mr-2" />
                          {t('actions.setFreezeThreshold')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Edit className="w-4 h-4 mr-2" />
                          {t('actions.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(user)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('actions.delete')}
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
          <p className="text-sm text-gray-600">{t('pagination.showing')} {filteredUsers.length} {t('pagination.of')} {totalUsers} {t('pagination.users')}</p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => loadUsers(page - 1)}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {t('pagination.previous')}
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
              {t('pagination.next')}
            </button>
          </div>
        </div>
      </div>

      {/* Edit User Dialog - Redesigned */}
      <Dialog open={editDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 overflow-hidden [&>button]:text-white [&>button]:hover:text-white">
          <DialogTitle className="sr-only">{t('editDialog.title')}</DialogTitle>
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
                    {t('editDialog.personalInfo')}
                  </h3>
                  <div className="space-y-3">
                    <div className="relative">
                      <Label className="text-xs text-gray-500 mb-1 block">{t('editDialog.fullName')}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          value={formFullName}
                          onChange={(e) => setFormFullName(e.target.value)}
                          className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                          placeholder={t('editDialog.fullNamePlaceholder')}
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <Label className="text-xs text-gray-500 mb-1 block">{t('editDialog.phoneNumber')}</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                          placeholder={t('editDialog.phoneNumberPlaceholder')}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Section */}
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-500" />
                    {t('editDialog.accountSettings')}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">{t('editDialog.balance')}</Label>
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
                            title={t('editDialog.addBalance')}
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                            <p className="text-xs text-blue-600 mb-1">{t('editDialog.current')}: ${formBalance}</p>

                            {/* Operation Selector */}
                            <div className="mb-2">
                              <Select value={balanceOperation} onValueChange={(v: any) => setBalanceOperation(v)}>
                                <SelectTrigger className="h-8 text-xs bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="add">{t('editDialog.balanceOperations.add')}</SelectItem>
                                  <SelectItem value="set">{t('editDialog.balanceOperations.set')}</SelectItem>
                                  <SelectItem value="subtract">{t('editDialog.balanceOperations.subtract')}</SelectItem>
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
                                  balanceOperation === 'add' ? t('editDialog.balancePlaceholders.add') :
                                    balanceOperation === 'set' ? t('editDialog.balancePlaceholders.set') :
                                      t('editDialog.balancePlaceholders.subtract')
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
                                {t('editDialog.new')}: ${
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
                              {t('editDialog.cancel')}
                            </button>
                            <button
                              onClick={handleAddBalance}
                              className="flex-1 h-8 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              {balanceOperation === 'add' ? t('editDialog.add') : balanceOperation === 'set' ? t('editDialog.set') : t('editDialog.subtract')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">{t('editDialog.status')}</Label>
                      <Select value={formStatus} onValueChange={(v: any) => setFormStatus(v)}>
                        <SelectTrigger className="h-11 bg-gray-50 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">
                            <span className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              {t('active')}
                            </span>
                          </SelectItem>
                          <SelectItem value="Suspended">
                            <span className="flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-500" />
                              {t('suspended')}
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
                    {t('editDialog.commissionSettings')}
                  </h3>
                  <p className="text-xs text-gray-400 mb-3">{t('editDialog.commissionHint')}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 block">{t('editDialog.numberOfOrders')}</Label>
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
                      <Label className="text-xs text-gray-500 mb-1 block">{t('editDialog.dailyTarget')}</Label>
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
                      <Label className="text-xs text-gray-500 mb-1 block">{t('editDialog.perOrder')}</Label>
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
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{t('editDialog.auto')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Today Stats Card */}
                  <div className="mt-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {t('editDialog.todayPerformance')}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-green-600">{t('editDialog.earned')}</p>
                        <p className="text-lg font-bold text-green-700">${dailyEarnedSoFar || '0'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">{t('editDialog.orders')}</p>
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
                  {t('editDialog.cancel')}
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('editDialog.saving')} {saveTime !== null && saveTime > 0 ? `${saveTime}s` : ''}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {t('editDialog.saveChanges')}
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
          <DialogTitle className="sr-only">{t('createDialog.title')}</DialogTitle>
          {/* Header */}
          <div className="bg-blue-600 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Plus className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-white text-lg font-semibold">{t('createDialog.title')}</h2>
                <p className="text-white/80 text-sm">{t('createDialog.subtitle')}</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 py-4 max-h-[55vh] overflow-y-auto">
            {/* Personal Info Section */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                {t('createDialog.personalInfo')}
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">
                    {t('createDialog.fullName')} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={createFullName}
                      onChange={(e) => setCreateFullName(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      placeholder={t('createDialog.fullNamePlaceholder')}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">
                    {t('createDialog.email')} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      placeholder={t('createDialog.emailPlaceholder')}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">{t('createDialog.phoneNumber')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={createPhone}
                      onChange={(e) => setCreatePhone(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      placeholder={t('createDialog.phoneNumberPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-500" />
                {t('createDialog.security')}
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">
                    {t('createDialog.password')} <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="password"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      placeholder={t('createDialog.passwordPlaceholder')}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">
                    {t('createDialog.confirmPassword')} <span className="text-red-500">*</span>
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
                      placeholder={t('createDialog.confirmPasswordPlaceholder')}
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
                    <p className="text-xs text-red-500 mt-1">{t('createDialog.passwordsDoNotMatch')}</p>
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
              {t('createDialog.cancel')}
            </Button>
            <Button
              onClick={async () => {
                if (!createFullName || !createEmail || !createPassword) {
                  toast.error(t('notifications.fillRequired'));
                  return;
                }
                if (createPassword !== createConfirmPassword) {
                  toast.error(t('notifications.passwordsNotMatch'));
                  return;
                }
                try {
                  setCreating(true);
                  await api.adminCreateUser({ fullName: createFullName, email: createEmail, phoneNumber: createPhone, password: createPassword });
                  setCreateDialogOpen(false);
                  const createdName = createFullName;
                  setCreateFullName(''); setCreateEmail(''); setCreatePhone(''); setCreatePassword(''); setCreateConfirmPassword('');
                  await loadUsers();
                  toast.success(t('notifications.userCreated', { name: createdName }), {
                    description: t('notifications.userCreatedDesc'),
                    duration: 4000,
                  });
                } catch (e: any) {
                  toast.error(e?.message || t('notifications.createFailed'));
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
                  {t('createDialog.creating')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {t('createDialog.createUser')}
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Freeze Threshold Dialog */}
      <Dialog open={freezeThresholdDialogOpen} onOpenChange={setFreezeThresholdDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-lg font-semibold text-gray-900 mb-4">
            {t('freezeThresholdDialog.title')}
          </DialogTitle>

          {freezeThresholdUser && (
            <div className="space-y-4">
              {/* User Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 text-xs mb-1">{t('freezeThresholdDialog.user')}</p>
                    <p className="font-semibold text-gray-900">{freezeThresholdUser.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs mb-1">{t('freezeThresholdDialog.vipLevel')}</p>
                    <p className="font-semibold text-purple-600">{freezeThresholdUser.vipLevel.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs mb-1">{t('freezeThresholdDialog.maxOrdersPerDay')}</p>
                    <p className="font-semibold text-gray-900">{VIP_MAX_ORDERS[freezeThresholdUser.vipLevel] || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs mb-1">{t('freezeThresholdDialog.todaysProgress')}</p>
                    {freezeThresholdLoading ? (
                      <p className="text-gray-400 text-xs">{t('freezeThresholdDialog.loading')}</p>
                    ) : (
                      <p className="font-semibold text-blue-600">
                        {freezeThresholdCurrentOrders}/{VIP_MAX_ORDERS[freezeThresholdUser.vipLevel] || 0}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-gray-600">
                    📱 {t('freezeThresholdDialog.phone')}: <span className="font-medium">{freezeThresholdUser.phone}</span>
                  </p>
                </div>
              </div>

              {/* Enable/Disable Freeze Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <Label className="text-sm font-medium text-gray-900">🔒 {t('freezeThresholdDialog.enableAutoFreeze')}</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('freezeThresholdDialog.enableAutoFreezeHint')}
                  </p>
                </div>
                <Switch
                  checked={freezeEnabled}
                  onCheckedChange={setFreezeEnabled}
                />
              </div>

              {/* Freeze Mode Selection - Only show when enabled */}
              {freezeEnabled && (
                <>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">📊 {t('freezeThresholdDialog.selectFreezeMode')}</Label>
                    <RadioGroup value={freezeMode} onValueChange={(value: string) => setFreezeMode(value as 'random' | 'custom')}>
                      <div
                        className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${freezeMode === 'random'
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        onClick={() => setFreezeMode('random')}
                      >
                        <RadioGroupItem value="random" id="mode-random" className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor="mode-random" className={`text-sm font-medium cursor-pointer ${freezeMode === 'random' ? 'text-blue-700' : 'text-gray-900'}`}>
                            {t('freezeThresholdDialog.randomMode')}
                          </Label>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t('freezeThresholdDialog.randomModeHint', {
                              min: Math.floor((VIP_MAX_ORDERS[freezeThresholdUser.vipLevel] || 0) * 0.8),
                              max: Math.floor((VIP_MAX_ORDERS[freezeThresholdUser.vipLevel] || 0) * 0.9)
                            })}
                          </p>
                        </div>
                        {freezeMode === 'random' && <span className="text-blue-500 font-bold">✓</span>}
                      </div>
                      <div
                        className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${freezeMode === 'custom'
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        onClick={() => setFreezeMode('custom')}
                      >
                        <RadioGroupItem value="custom" id="mode-custom" className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor="mode-custom" className={`text-sm font-medium cursor-pointer ${freezeMode === 'custom' ? 'text-blue-700' : 'text-gray-900'}`}>
                            {t('freezeThresholdDialog.customMode')}
                          </Label>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t('freezeThresholdDialog.customModeHint')}
                          </p>
                        </div>
                        {freezeMode === 'custom' && <span className="text-blue-500 font-bold">✓</span>}
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Custom Threshold Input - Only show when custom mode */}
                  {freezeMode === 'custom' && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Label className="text-sm text-gray-700 mb-2 block">
                        🎯 {t('freezeThresholdDialog.freezeAtOrder')}
                      </Label>
                      <Input
                        type="number"
                        value={freezeThresholdValue}
                        onChange={(e) => setFreezeThresholdValue(e.target.value)}
                        placeholder={t('freezeThresholdDialog.enterOrderNumber', {
                          min: freezeThresholdCurrentOrders + 1,
                          max: VIP_MAX_ORDERS[freezeThresholdUser.vipLevel] - 1
                        })}
                        className="h-11 bg-white"
                        min={freezeThresholdCurrentOrders + 1}
                        max={VIP_MAX_ORDERS[freezeThresholdUser.vipLevel] - 1}
                      />
                      <p className="text-xs text-blue-600 mt-2 font-medium">
                        ✓ {t('freezeThresholdDialog.validRange', {
                          min: freezeThresholdCurrentOrders + 1,
                          max: VIP_MAX_ORDERS[freezeThresholdUser.vipLevel] - 1
                        })}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Status indicator when disabled */}
              {!freezeEnabled && (
                <div className="p-4 bg-gray-100 rounded-lg border border-gray-200 text-center">
                  <p className="text-sm text-gray-600">
                    ℹ️ {t('freezeThresholdDialog.autoFreezeDisabled')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('freezeThresholdDialog.autoFreezeDisabledHint')}
                  </p>
                </div>
              )}

              {/* Target Product Selection - Only show when freeze is enabled */}
              {freezeEnabled && (
                <div className="border-t border-gray-200 pt-4 mt-4 relative">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-gray-700">
                      {t('freezeThresholdDialog.targetProductPrice')}
                    </Label>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                      {t('freezeThresholdDialog.currentBalance')}: ${(freezeThresholdUser.balance || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      value={targetProductPrice}
                      onChange={(e) => {
                        setTargetProductPrice(e.target.value);
                        setProductSearchError('');
                        setTargetProduct(null); // Clear selected product when typing
                      }}
                      onFocus={() => {
                        if (productList.length > 0) {
                          setShowProductDropdown(true);
                        }
                      }}
                      placeholder={t('freezeThresholdDialog.enterProductPrice')}
                      className="w-full"
                      min={0}
                    />
                    {searchingProduct && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    )}

                    {/* Dropdown Product List */}
                    {showProductDropdown && productList.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {productList.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleSelectProduct(product)}
                            className="w-full px-3 py-2 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors text-left"
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded border border-gray-200"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.brand}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-600">${product.price}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('freezeThresholdDialog.productPriceHint')}
                  </p>

                  {/* Product Search Error */}
                  {productSearchError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                      {productSearchError}
                    </div>
                  )}

                  {/* Target Product Display */}
                  {targetProduct && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-800 font-medium mb-2">✓ {t('freezeThresholdDialog.selectedProduct')}:</p>
                      <div className="flex gap-3">
                        <img
                          src={targetProduct.image}
                          alt={targetProduct.name}
                          className="w-16 h-16 object-cover rounded border border-green-300"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{targetProduct.name}</p>
                          <p className="text-xs text-gray-600">{targetProduct.brand}</p>
                          <p className="text-sm font-bold text-green-600 mt-1">${targetProduct.price.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => {
                            setTargetProduct(null);
                            setTargetProductPrice('');
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="freeze-modal-actions">
                <button
                  onClick={() => setFreezeThresholdDialogOpen(false)}
                  className="freeze-cancel-btn"
                >
                  {t('freezeThresholdDialog.cancel')}
                </button>
                <button
                  onClick={handleConfirmFreezeThreshold}
                  disabled={freezeThresholdLoading}
                  className="freeze-confirm-btn"
                >
                  {freezeEnabled ? t('freezeThresholdDialog.saveConfig') : t('freezeThresholdDialog.disableFreeze')}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div >
  );
}
