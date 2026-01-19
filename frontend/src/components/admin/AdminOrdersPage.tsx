import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Filter, Eye, Package, Loader2 } from "lucide-react";
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
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Progress } from "../ui/progress";
import { toast } from "sonner";
import api from "../../services/api";

interface Order {
  id: string;
  orderId: string;
  user: {
    name: string;
    email: string;
    phoneNumber?: string;
    balance?: number;
    totalDeposited?: number;
    vipLevel?: string;
  };
  product: {
    name: string;
    image: string;
    brand?: string;
    category?: string;
    id?: number;
  };
  amount: number;
  commission: number;
  commissionRate?: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  orderDate: string;
  deliveryDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface OrderStats {
  totalOrders: number;
  todayOrders: number;
  ordersByStatus: Record<string, number>;
  totalRevenue: number;
  totalCommission: number;
  todayRevenue: number;
  todayCommission: number;
}

export function AdminOrdersPage() {
  const { t } = useTranslation('adminOrders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.adminListOrders({
        page: currentPage,
        limit: 20,
        q: searchQuery,
        status: statusFilter,
        sortBy: 'orderDate',
        sortOrder: 'desc'
      });

      if (response.success) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load order stats - only once on mount
  const loadStats = async () => {
    try {
      const response = await api.adminGetOrderStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // ⚡ Load stats only once on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Load orders when filters change
  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter]);

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        loadOrders();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleView = async (order: Order) => {
    try {
      const response = await api.adminGetOrder(order.id);
      if (response.success) {
        setSelectedOrder(response.data.order);
        setNewStatus(response.data.order.status);
        setViewDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading order details:', error);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      const response = await api.adminUpdateOrderStatus(selectedOrder.id, newStatus.toLowerCase());
      if (response.success) {
        // Reload orders to get updated data
        await loadOrders();
        setViewDialogOpen(false);
        toast.success(t('notifications.statusUpdated', { status: newStatus }));
      }
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(error?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-700";
      case "Shipped":
        return "bg-blue-100 text-blue-700";
      case "Processing":
        return "bg-purple-100 text-purple-700";
      case "Pending":
        return "bg-orange-100 text-orange-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "Pending":
        return 25;
      case "Processing":
        return 50;
      case "Shipped":
        return 75;
      case "Delivered":
        return 100;
      case "Cancelled":
        return 0;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6 w-full overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">{t('title')}</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-3 py-1.5 text-sm">
            <Package className="w-4 h-4 mr-1" />
            {stats?.totalOrders || 0} {t('totalOrders')}
          </Badge>
          {stats && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 px-3 py-1.5 text-sm">
              {t('today')}: {stats.todayOrders}
            </Badge>
          )}
        </div>
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
              <SelectItem value="Pending">{t('pending')}</SelectItem>
              <SelectItem value="Processing">{t('processing')}</SelectItem>
              <SelectItem value="Shipped">{t('shipped')}</SelectItem>
              <SelectItem value="Delivered">{t('delivered')}</SelectItem>
              <SelectItem value="Cancelled">{t('cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">{t('table.orderId')}</TableHead>
                <TableHead className="whitespace-nowrap min-w-[180px]">{t('table.user')}</TableHead>
                <TableHead className="whitespace-nowrap min-w-[150px]">{t('table.product')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('table.amount')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('table.commission')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('table.status')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('table.date')}</TableHead>
                <TableHead className="text-right whitespace-nowrap">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('loading')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {t('noOrders')}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <code className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[120px] block">
                        {order.orderId}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {(order.user?.name || 'U').split(" ").map((n) => n[0] || '').join("") || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-gray-900 text-sm truncate">{order.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 truncate">{order.user?.email || ''}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="text-gray-900 text-sm truncate max-w-[150px]">{order.product.name}</p>
                        {order.product.brand && (
                          <p className="text-xs text-gray-500">{order.product.brand}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900 text-sm whitespace-nowrap">${order.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600 text-sm whitespace-nowrap">+${order.commission.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${getStatusColor(order.status)} text-xs`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm whitespace-nowrap">{order.orderDate}</TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleView(order)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {t('pagination.showing')} {orders.length} {t('pagination.of')} {pagination.total} {t('pagination.orders')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('pagination.previous')}
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded-lg text-sm ${currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.pages}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('pagination.next')}
            </button>
          </div>
        </div>
      </div>

      {/* View/Edit Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('viewDialog.title')}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('viewDialog.orderId')}:</span>
                  <code className="text-sm text-blue-600">{selectedOrder.orderId}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('viewDialog.orderDate')}:</span>
                  <span className="text-gray-900">{selectedOrder.orderDate}</span>
                </div>
                {selectedOrder.deliveryDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('viewDialog.deliveryDate')}:</span>
                    <span className="text-gray-900">{selectedOrder.deliveryDate}</span>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div>
                <p className="text-sm text-gray-600 mb-3">{t('viewDialog.customerInformation')}</p>
                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {(selectedOrder.user?.name || 'U').split(" ").map((n) => n[0] || '').join("") || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-gray-900 font-medium">{selectedOrder.user?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{selectedOrder.user?.email || ''}</p>
                      {selectedOrder.user?.phoneNumber && (
                        <p className="text-sm text-gray-500">{selectedOrder.user.phoneNumber}</p>
                      )}
                    </div>
                  </div>
                  {selectedOrder.user.balance !== undefined && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">{t('viewDialog.balance')}:</span>
                        <span className="ml-2 font-medium">${selectedOrder.user.balance.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('viewDialog.vipLevel')}:</span>
                        <span className="ml-2 font-medium">{selectedOrder.user.vipLevel || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div>
                <p className="text-sm text-gray-600 mb-3">{t('viewDialog.productDetails')}</p>
                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-gray-900 font-medium">{selectedOrder.product.name}</p>
                  {selectedOrder.product.brand && (
                    <p className="text-sm text-gray-600">{t('viewDialog.brand')}: {selectedOrder.product.brand}</p>
                  )}
                  {selectedOrder.product.category && (
                    <p className="text-sm text-gray-600">{t('viewDialog.category')}: {selectedOrder.product.category}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">{t('viewDialog.amount')}:</span>
                      <span className="ml-2 font-medium">${selectedOrder.amount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('viewDialog.commission')}:</span>
                      <span className="ml-2 font-medium text-green-600">+${selectedOrder.commission.toFixed(2)}</span>
                    </div>
                    {selectedOrder.commissionRate && (
                      <div>
                        <span className="text-gray-600">{t('viewDialog.rate')}:</span>
                        <span className="ml-2 font-medium">{selectedOrder.commissionRate}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Progress */}
              <div>
                <p className="text-sm text-gray-600 mb-3">{t('viewDialog.orderProgress')}</p>
                <Progress value={getProgressPercentage(selectedOrder.status)} className="mb-2" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{t('pending')}</span>
                  <span>{t('processing')}</span>
                  <span>{t('shipped')}</span>
                  <span>{t('delivered')}</span>
                </div>
              </div>

              {/* Update Status */}
              <div>
                <Label>{t('viewDialog.updateStatus')}</Label>
                {(() => {
                  const allStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
                  const currentStatus = selectedOrder.status;
                  const options = allStatuses.filter(s => s !== currentStatus);

                  return (
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={currentStatus} disabled>{currentStatus} (current)</SelectItem>
                        {options.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setViewDialogOpen(false)} variant="outline" className="flex-1">
                  {t('viewDialog.close')}
                </Button>
                {(() => {
                  if (newStatus === selectedOrder.status) return null;

                  return (
                    <Button
                      onClick={handleUpdateStatus}
                      className="flex-1 bg-blue-600"
                      disabled={updating || newStatus === selectedOrder.status}
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('viewDialog.updating')}
                        </>
                      ) : (
                        t('viewDialog.updateButton')
                      )}
                    </Button>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
