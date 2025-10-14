import { useEffect, useState } from "react";
import { ArrowLeft, Plus, MapPin, Trash2, Edit } from "lucide-react";
import { motion } from "motion/react";
import api from "../services/api";

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

interface ShippingAddressPageProps {
  onBack: () => void;
}

export function ShippingAddressPage({ onBack }: ShippingAddressPageProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getAddresses();
        const list = (res?.data?.addresses || []).map((a: any) => ({
          id: a._id,
          name: a.fullName,
          phone: a.phoneNumber,
          address: `${a.addressLine1}, ${a.city}, ${a.postalCode}`,
          isDefault: !!a.isDefault,
        }));
        setAddresses(list);
      } catch {}
    })();
  }, []);

  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.address) {
      alert("Please fill in all fields");
      return;
    }
    try {
      const payload = {
        fullName: newAddress.name,
        phoneNumber: newAddress.phone,
        addressLine1: newAddress.address,
        city: 'City',
        postalCode: '00000',
        isDefault: addresses.length === 0,
      };
      const res = await api.addAddress(payload);
      const added = (res?.data?.address || null);
      const list = res?.data?.addresses || [];
      if (list.length) {
        const mapped = list.map((a: any) => ({
          id: a._id,
          name: a.fullName,
          phone: a.phoneNumber,
          address: `${a.addressLine1}, ${a.city}, ${a.postalCode}`,
          isDefault: !!a.isDefault,
        }));
        setAddresses(mapped);
      } else if (added) {
        setAddresses(prev => [...prev, {
          id: added._id,
          name: added.fullName,
          phone: added.phoneNumber,
          address: `${added.addressLine1}, ${added.city}, ${added.postalCode}`,
          isDefault: !!added.isDefault,
        }]);
      }
      setNewAddress({ name: '', phone: '', address: '' });
      setShowAddForm(false);
    } catch (e: any) {
      alert(e?.message || 'Failed to add address');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteAddress(id);
      setAddresses(addresses.filter(addr => addr.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1>Shipping Address</h1>
        </div>
      </div>

      <div className="p-6">
        {/* Add Address Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full bg-white rounded-2xl p-4 shadow-md mb-4 flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Address</span>
        </motion.button>

        {/* Add Address Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white rounded-2xl p-5 shadow-md mb-4"
          >
            <h3 className="text-gray-800 mb-4">New Address</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1.5">Address</label>
                <textarea
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  placeholder="Enter full address"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAddress}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}

        {/* Address List */}
        <div className="space-y-4">
          {addresses.map((address) => (
            <motion.div
              key={address.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-800">{address.name}</span>
                  {address.isDefault && (
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="p-2 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{address.phone}</p>
              <p className="text-sm text-gray-700">{address.address}</p>
            </motion.div>
          ))}
        </div>

        {addresses.length === 0 && (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No address yet</p>
            <p className="text-sm text-gray-400 mt-2">Add your shipping address</p>
          </div>
        )}
      </div>
    </div>
  );
}
