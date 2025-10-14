import React, { useState, useEffect } from "react";
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

  // Load order stats
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

  // Load data on component mount and when filters change
  useEffect(() => {
    loadOrders();
    loadStats();
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
        alert(`Order status updated to: ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">Order Management</h1>
          <p className="text-gray-600">Track and manage all customer orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-4 py-2">
            <Package className="w-4 h-4 mr-2" />
            {stats?.totalOrders || 0} Total Orders
          </Badge>
          {stats && (
            <>
              <Badge variant="secondary" className="bg-green-100 text-green-700 px-4 py-2">
                Today: {stats.todayOrders}
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 px-4 py-2">
                Revenue: ${stats.totalRevenue.toFixed(2)}
              </Badge>
            </>
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
              placeholder="Search by order ID, user, or product..."
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
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Shipped">Shipped</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading orders...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <code className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {order.orderId}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {order.user.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-gray-900">{order.user.name}</p>
                          <p className="text-sm text-gray-500">{order.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-gray-900">{order.product.name}</p>
                        {order.product.brand && (
                          <p className="text-xs text-gray-500">{order.product.brand}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900">${order.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600">+${order.commission.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">{order.orderDate}</TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleView(order)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
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
            Showing {orders.length} of {pagination.total} orders
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    currentPage === pageNum
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
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View/Edit Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Order ID:</span>
                  <code className="text-sm text-blue-600">{selectedOrder.orderId}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Order Date:</span>
                  <span className="text-gray-900">{selectedOrder.orderDate}</span>
                </div>
                {selectedOrder.deliveryDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Delivery Date:</span>
                    <span className="text-gray-900">{selectedOrder.deliveryDate}</span>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div>
                <p className="text-sm text-gray-600 mb-3">Customer Information</p>
                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {selectedOrder.user.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-gray-900 font-medium">{selectedOrder.user.name}</p>
                      <p className="text-sm text-gray-500">{selectedOrder.user.email}</p>
                      {selectedOrder.user.phoneNumber && (
                        <p className="text-sm text-gray-500">{selectedOrder.user.phoneNumber}</p>
                      )}
                    </div>
                  </div>
                  {selectedOrder.user.balance !== undefined && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Balance:</span>
                        <span className="ml-2 font-medium">${selectedOrder.user.balance.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">VIP Level:</span>
                        <span className="ml-2 font-medium">{selectedOrder.user.vipLevel || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div>
                <p className="text-sm text-gray-600 mb-3">Product Details</p>
                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <p className="text-gray-900 font-medium">{selectedOrder.product.name}</p>
                  {selectedOrder.product.brand && (
                    <p className="text-sm text-gray-600">Brand: {selectedOrder.product.brand}</p>
                  )}
                  {selectedOrder.product.category && (
                    <p className="text-sm text-gray-600">Category: {selectedOrder.product.category}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <span className="ml-2 font-medium">${selectedOrder.amount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Commission:</span>
                      <span className="ml-2 font-medium text-green-600">+${selectedOrder.commission.toFixed(2)}</span>
                    </div>
                    {selectedOrder.commissionRate && (
                      <div>
                        <span className="text-gray-600">Rate:</span>
                        <span className="ml-2 font-medium">{selectedOrder.commissionRate}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Progress */}
              <div>
                <p className="text-sm text-gray-600 mb-3">Order Progress</p>
                <Progress value={getProgressPercentage(selectedOrder.status)} className="mb-2" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Pending</span>
                  <span>Processing</span>
                  <span>Shipped</span>
                  <span>Delivered</span>
                </div>
              </div>

              {/* Update Status */}
              <div>
                <Label>Update Order Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Shipped">Shipped</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setViewDialogOpen(false)} variant="outline" className="flex-1">
                  Close
                </Button>
                <Button 
                  onClick={handleUpdateStatus} 
                  className="flex-1 bg-blue-600"
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
