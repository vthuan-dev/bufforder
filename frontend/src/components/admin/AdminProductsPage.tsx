import React, { useState, useEffect, useRef } from "react";
import { Search, Filter, Eye, Plus, Edit, Trash2, Package, Loader2, DollarSign, Tag, Image as ImageIcon, Upload, X } from "lucide-react";
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
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import api from "../../services/api";

interface Product {
    id: number;
    name: string;
    brand: string;
    category: string;
    price: number;
    image?: string;
    isActive: boolean;
    createdAt?: string;
}

export function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0
    });
    const [currentPage, setCurrentPage] = useState(1);

    // Form state
    const [formName, setFormName] = useState("");
    const [formBrand, setFormBrand] = useState("");
    const [formCategory, setFormCategory] = useState("");
    const [formPrice, setFormPrice] = useState("");
    const [formImage, setFormImage] = useState("");
    const [formIsActive, setFormIsActive] = useState(true);

    // Image upload state
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Categories for filter
    const categories = ["Electronics", "Fashion", "Luxury", "Beauty", "Jewelry", "Accessories"];

    // Handle image upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(file);

        try {
            setUploading(true);
            const response = await api.adminUploadProductImage(file);
            if (response.success) {
                const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';
                setFormImage(`${API_BASE}${response.data.imageUrl}`);
                toast.success('Image uploaded successfully');
            }
        } catch (error: any) {
            toast.error(error?.message || 'Failed to upload image');
            setPreviewUrl('');
        } finally {
            setUploading(false);
        }
    };

    const clearImage = () => {
        setFormImage('');
        setPreviewUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Load products from API
    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await api.adminListProducts({
                page: currentPage,
                limit: 20,
                q: searchQuery,
                category: categoryFilter,
                isActive: statusFilter
            });

            if (response.success) {
                setProducts(response.data.products || []);
                setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
            }
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    // Load products when filters change
    useEffect(() => {
        loadProducts();
    }, [currentPage, categoryFilter, statusFilter]);

    // Debounce search query
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (currentPage === 1) {
                loadProducts();
            } else {
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleView = (product: Product) => {
        setSelectedProduct(product);
        setViewDialogOpen(true);
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setFormName(product.name);
        setFormBrand(product.brand);
        setFormCategory(product.category);
        setFormPrice(String(product.price));
        setFormImage(product.image || "");
        setPreviewUrl("");
        setFormIsActive(product.isActive);
        setEditDialogOpen(true);
    };

    const handleCreate = () => {
        setFormName("");
        setFormBrand("");
        setFormCategory("");
        setFormPrice("");
        setFormImage("");
        setPreviewUrl("");
        setFormIsActive(true);
        setCreateDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedProduct) return;

        try {
            setSaving(true);
            const response = await api.adminUpdateProduct(selectedProduct.id, {
                name: formName,
                brand: formBrand,
                category: formCategory,
                price: Number(formPrice),
                image: formImage || undefined,
                isActive: formIsActive
            });

            if (response.success) {
                toast.success('Product updated successfully');
                setEditDialogOpen(false);
                loadProducts();
            }
        } catch (error: any) {
            toast.error(error?.message || 'Failed to update product');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveCreate = async () => {
        if (!formName || !formBrand || !formCategory || !formPrice) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            setSaving(true);
            const response = await api.adminCreateProduct({
                name: formName,
                brand: formBrand,
                category: formCategory,
                price: Number(formPrice),
                image: formImage || undefined,
                isActive: formIsActive
            });

            if (response.success) {
                toast.success('Product created successfully');
                setCreateDialogOpen(false);
                loadProducts();
            }
        } catch (error: any) {
            toast.error(error?.message || 'Failed to create product');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (product: Product) => {
        if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;

        try {
            const response = await api.adminDeleteProduct(product.id);
            if (response.success) {
                toast.success('Product deleted successfully');
                loadProducts();
            }
        } catch (error: any) {
            toast.error(error?.message || 'Failed to delete product');
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="space-y-6 w-full overflow-hidden">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl text-gray-900 mb-1">Product Management</h1>
                    <p className="text-gray-600">Manage all products in the system</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-3 py-1.5 text-sm">
                        <Package className="w-4 h-4 mr-1" />
                        {pagination.total} Products
                    </Badge>
                    <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                    </Button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-[4] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or brand..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full sm:w-36">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-28">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="min-w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="whitespace-nowrap">Product</TableHead>
                                <TableHead className="whitespace-nowrap">Brand</TableHead>
                                <TableHead className="whitespace-nowrap">Category</TableHead>
                                <TableHead className="whitespace-nowrap">Price</TableHead>
                                <TableHead className="whitespace-nowrap">Status</TableHead>
                                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Loading products...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        No products found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        <Package className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-gray-900 text-sm font-medium truncate max-w-[200px]">{product.name}</p>
                                                    <p className="text-xs text-gray-500">ID: {product.id}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-600 text-sm">{product.brand}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                                {product.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-900 font-medium">${product.price.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={product.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                                {product.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleView(product)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
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
                        Showing {products.length} of {pagination.total} products
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="px-3 py-1 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

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
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* View Product Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Product Details</DialogTitle>
                    </DialogHeader>
                    {selectedProduct && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
                                    {selectedProduct.image ? (
                                        <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover rounded-xl" />
                                    ) : (
                                        <Package className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                                    <p className="text-gray-600">{selectedProduct.brand}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <p className="text-sm text-gray-500">Category</p>
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 mt-1">
                                        {selectedProduct.category}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Price</p>
                                    <p className="text-lg font-semibold text-blue-600">${selectedProduct.price.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <Badge variant="secondary" className={selectedProduct.isActive ? "bg-green-100 text-green-700 mt-1" : "bg-red-100 text-red-700 mt-1"}>
                                        {selectedProduct.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Product ID</p>
                                    <p className="font-mono text-sm">{selectedProduct.id}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button onClick={() => { setViewDialogOpen(false); handleEdit(selectedProduct); }} className="flex-1 bg-blue-600">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Product
                                </Button>
                                <Button onClick={() => setViewDialogOpen(false)} variant="outline" className="flex-1">
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Product Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Product Name *</Label>
                            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Enter product name" className="mt-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Brand *</Label>
                                <Input value={formBrand} onChange={(e) => setFormBrand(e.target.value)} placeholder="Brand name" className="mt-1" />
                            </div>
                            <div>
                                <Label>Category *</Label>
                                <Select value={formCategory} onValueChange={setFormCategory}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Price ($) *</Label>
                                <Input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0.00" className="mt-1" />
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Select value={formIsActive ? "true" : "false"} onValueChange={(v: string) => setFormIsActive(v === "true")}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Product Image</Label>
                            <div className="mt-1 space-y-2">
                                {(previewUrl || formImage) ? (
                                    <div className="relative inline-block">
                                        <img src={previewUrl || formImage} alt="Preview" className="w-24 h-24 object-cover rounded-lg border" />
                                        <button onClick={clearImage} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : null}
                                <div className="flex gap-2">
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex-1">
                                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                        {uploading ? 'Uploading...' : 'Upload Image'}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500">Max 5MB. JPEG, PNG, WebP, GIF supported.</p>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button onClick={() => setEditDialogOpen(false)} variant="outline" className="flex-1" disabled={saving}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveEdit} className="flex-1 bg-blue-600" disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Product Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create New Product</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Product Name *</Label>
                            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Enter product name" className="mt-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Brand *</Label>
                                <Input value={formBrand} onChange={(e) => setFormBrand(e.target.value)} placeholder="Brand name" className="mt-1" />
                            </div>
                            <div>
                                <Label>Category *</Label>
                                <Select value={formCategory} onValueChange={setFormCategory}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Price ($) *</Label>
                                <Input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0.00" className="mt-1" />
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Select value={formIsActive ? "true" : "false"} onValueChange={(v: string) => setFormIsActive(v === "true")}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Product Image</Label>
                            <div className="mt-1 space-y-2">
                                {(previewUrl || formImage) ? (
                                    <div className="relative inline-block">
                                        <img src={previewUrl || formImage} alt="Preview" className="w-24 h-24 object-cover rounded-lg border" />
                                        <button onClick={clearImage} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : null}
                                <div className="flex gap-2">
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex-1">
                                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                        {uploading ? 'Uploading...' : 'Upload Image'}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500">Max 5MB. JPEG, PNG, WebP, GIF supported.</p>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button onClick={() => setCreateDialogOpen(false)} variant="outline" className="flex-1" disabled={saving}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveCreate} className="flex-1 bg-blue-600" disabled={saving || !formName || !formBrand || !formCategory || !formPrice}>
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Product
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
