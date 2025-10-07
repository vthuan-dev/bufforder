import React, { useEffect, useMemo, useState } from 'react';
import styles from './UserManagementPage.module.css';
import { FaEdit, FaTrash, FaEye, FaEyeSlash, FaCrown, FaDollarSign, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import api from '../../../services/api';

type User = {
  id: string;
  phoneNumber: string;
  fullName: string;
  email: string;
  vipLevel: string;
  totalDeposited: number;
  balance: number;
  freezeBalance: number;
  commission: number;
  isActive: boolean;
  addresses: Array<{
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    city: string;
    postalCode: string;
    isDefault: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
};

const mapBackendUser = (u: any): User => ({
  id: u._id || u.id,
  phoneNumber: u.phoneNumber || '',
  fullName: u.fullName || 'Unknown',
  email: u.email || '',
  vipLevel: u.vipLevel || 'vip-0',
  totalDeposited: u.totalDeposited || 0,
  balance: u.balance || 0,
  freezeBalance: u.freezeBalance || 0,
  commission: u.commission || 0,
  isActive: u.isActive !== undefined ? u.isActive : true,
  addresses: u.addresses || [],
  createdAt: u.createdAt || '',
  updatedAt: u.updatedAt || '',
});

type UserFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<User>;
  onSubmit: (data: Partial<User>, id?: string) => void;
};

function UserFormModal({ isOpen, onClose, initialData, onSubmit }: UserFormModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber ?? '');
  const [fullName, setFullName] = useState(initialData?.fullName ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [vipLevel, setVipLevel] = useState(initialData?.vipLevel ?? 'vip-0');
  const [balance, setBalance] = useState(initialData?.balance ?? 0);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  React.useEffect(() => {
    setPhoneNumber(initialData?.phoneNumber ?? '');
    setFullName(initialData?.fullName ?? '');
    setEmail(initialData?.email ?? '');
    setVipLevel(initialData?.vipLevel ?? 'vip-0');
    setBalance(initialData?.balance ?? 0);
    setIsActive(initialData?.isActive ?? true);
  }, [initialData]);

  if (!isOpen) return null;

  const vipLevels = [
    { value: 'vip-0', label: 'VIP 0 - New member' },
    { value: 'vip-1', label: 'VIP 1 - Silver member' },
    { value: 'vip-2', label: 'VIP 2 - Gold member' },
    { value: 'vip-3', label: 'VIP 3 - Diamond member' },
    { value: 'vip-4', label: 'VIP 4 - Platinum member' },
    { value: 'vip-5', label: 'VIP 5 - Ruby member' },
    { value: 'vip-6', label: 'VIP 6 - Emerald member' },
    { value: 'vip-7', label: 'VIP 7 - Sapphire member' },
    { value: 'svip', label: 'SVIP - Super member' },
    { value: 'royal-vip', label: 'ROYAL VIP - Royal member' },
  ];

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <h3 className={styles.modalTitle}>
          {initialData?.id ? 'Edit user' : 'Add new user'}
        </h3>
        
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>Phone number *</label>
            <input 
              className={styles.input} 
              value={phoneNumber} 
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          
          <div className={styles.field}>
            <label>Full name *</label>
            <input 
              className={styles.input} 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
            />
          </div>
          
          <div className={styles.field}>
            <label>Email</label>
            <input 
              className={styles.input} 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>
          
          <div className={styles.field}>
            <label>VIP Level</label>
            <select className={styles.select} value={vipLevel} onChange={(e) => setVipLevel(e.target.value)}>
              {vipLevels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.field}>
            <label>Balance ($)</label>
            <input 
              className={styles.input} 
              type="number"
              value={balance} 
              onChange={(e) => setBalance(Number(e.target.value))}
              placeholder="0"
            />
          </div>
          
          <div className={styles.field}>
            <label>Status</label>
            <div className={styles.toggleContainer}>
              <button
                className={`${styles.toggle} ${isActive ? styles.active : ''}`}
                onClick={() => setIsActive(!isActive)}
              >
                {isActive ? <FaEye /> : <FaEyeSlash />}
                {isActive ? 'Active' : 'Suspended'}
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.modalActions}>
          <button className={styles.cancel} onClick={onClose}>Cancel</button>
          <button
            className={styles.save}
            onClick={() => {
              const isEdit = !!initialData?.id;
              if (!phoneNumber.trim() || !fullName.trim()) return;
              if (!isEdit && !email.trim()) return; // tạo mới vẫn yêu cầu email
              const payload: any = { phoneNumber, fullName, vipLevel, balance, isActive };
              if (email && email.trim()) payload.email = email;
              onSubmit(payload, initialData?.id as string | undefined);
            }}
          >
            {initialData?.id ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserManagementPage() {
  const [users, setUsers] = useState([] as User[]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(undefined as User | undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVipLevel, setFilterVipLevel] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const onAdd = () => { setEditingUser(undefined); setIsModalOpen(true); };
  const onEdit = (u: User) => { setEditingUser(u); setIsModalOpen(true); };
  const onDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getVipLevelDisplay = (vipLevel: string) => {
    const vipMap: { [key: string]: string } = {
      'vip-0': 'VIP 0',
      'vip-1': 'VIP 1',
      'vip-2': 'VIP 2',
      'vip-3': 'VIP 3',
      'vip-4': 'VIP 4',
      'vip-5': 'VIP 5',
      'vip-6': 'VIP 6',
      'vip-7': 'VIP 7',
      'svip': 'SVIP',
      'royal-vip': 'ROYAL VIP',
    };
    return vipMap[vipLevel] || vipLevel;
  };

  const getVipLevelColor = (vipLevel: string) => {
    const colorMap: { [key: string]: string } = {
      'vip-0': '#6b7280',
      'vip-1': '#9ca3af',
      'vip-2': '#f59e0b',
      'vip-3': '#10b981',
      'vip-4': '#3b82f6',
      'vip-5': '#ef4444',
      'vip-6': '#8b5cf6',
      'vip-7': '#f97316',
      'svip': '#000000',
      'royal-vip': '#7c3aed',
    };
    return colorMap[vipLevel] || '#6b7280';
  };

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber.includes(searchTerm);
      
      const matchesVip = filterVipLevel === 'all' || user.vipLevel === filterVipLevel;
      
      return matchesSearch && matchesVip;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'fullName':
          aValue = a.fullName.toLowerCase();
          bValue = b.fullName.toLowerCase();
          break;
        case 'balance':
          aValue = a.balance;
          bValue = b.balance;
          break;
        case 'totalDeposited':
          aValue = a.totalDeposited;
          bValue = b.totalDeposited;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [users, searchTerm, filterVipLevel, sortBy, sortOrder]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.adminListUsers({ page: 1, limit: 100 });
        const list = (res.data?.users || []).map(mapBackendUser);
        setUsers(list);
      } catch (e) {
        console.error('Error fetching users:', e);
        // fallback to empty
      }
    })();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>User management</h1>
          <p className={styles.subtitle}>Manage user information and status</p>
        </div>
        <button className={styles.addBtn} onClick={onAdd}>
          <FaEdit />
          Add new user
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterControls}>
          <select 
            value={filterVipLevel} 
            onChange={(e) => setFilterVipLevel(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All VIP</option>
            <option value="vip-0">VIP 0</option>
            <option value="vip-1">VIP 1</option>
            <option value="vip-2">VIP 2</option>
            <option value="vip-3">VIP 3</option>
            <option value="vip-4">VIP 4</option>
            <option value="vip-5">VIP 5</option>
            <option value="vip-6">VIP 6</option>
            <option value="vip-7">VIP 7</option>
            <option value="svip">SVIP</option>
            <option value="royal-vip">ROYAL VIP</option>
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="createdAt">Sort by created date</option>
            <option value="fullName">Sort by name</option>
            <option value="balance">Sort by balance</option>
            <option value="totalDeposited">Sort by total deposit</option>
          </select>
          
          <button 
            className={styles.sortBtn}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaCrown /></div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{users.length}</div>
            <div className={styles.statLabel}>Total users</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaEye /></div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{users.filter(u => u.isActive).length}</div>
            <div className={styles.statLabel}>Active</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaDollarSign /></div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{formatCurrency(users.reduce((sum, u) => sum + u.balance, 0))}</div>
            <div className={styles.statLabel}>Total balance</div>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Info</th>
              <th className={styles.th}>Contact</th>
              <th className={styles.th}>VIP Level</th>
              <th className={styles.th}>Finance</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Created</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className={styles.row}>
                <td className={styles.td}>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.userDetails}>
                      <div className={styles.userName}>{user.fullName}</div>
                      <div className={styles.userId}>ID: {user.id.slice(-8)}</div>
                    </div>
                  </div>
                </td>
                
                <td className={styles.td}>
                  <div className={styles.contactInfo}>
                    <div className={styles.contactItem}>
                      <FaPhone />
                      {user.phoneNumber}
                    </div>
                    <div className={styles.contactItem}>
                      <span className={styles.emailIcon}>@</span>
                      {user.email}
                    </div>
                    {user.addresses.length > 0 && (
                      <div className={styles.contactItem}>
                        <FaMapMarkerAlt />
                        {user.addresses.length} addresses
                      </div>
                    )}
                  </div>
                </td>
                
                <td className={styles.td}>
                  <div 
                    className={styles.vipBadge}
                    style={{ backgroundColor: getVipLevelColor(user.vipLevel) }}
                  >
                    <FaCrown />
                    {getVipLevelDisplay(user.vipLevel)}
                  </div>
                </td>
                
                <td className={styles.td}>
                  <div className={styles.financialInfo}>
                    <div className={styles.balance}>
                      <span className={styles.balanceLabel}>Balance:</span>
                      <span className={styles.balanceAmount}>{formatCurrency(user.balance)}</span>
                    </div>
                    <div className={styles.deposited}>
                      <span className={styles.depositedLabel}>Deposited:</span>
                      <span className={styles.depositedAmount}>{formatCurrency(user.totalDeposited)}</span>
                    </div>
                    <div className={styles.commission}>
                      <span className={styles.commissionLabel}>Commission:</span>
                      <span className={styles.commissionAmount}>{formatCurrency(user.commission)}</span>
                    </div>
                  </div>
                </td>
                
                <td className={styles.td}>
                  <div className={`${styles.statusBadge} ${user.isActive ? styles.active : styles.inactive}`}>
                    {user.isActive ? <FaEye /> : <FaEyeSlash />}
                    {user.isActive ? 'Active' : 'Suspended'}
                  </div>
                </td>
                
                <td className={styles.td}>
                  <div className={styles.dateInfo}>
                    <div className={styles.createdDate}>{formatDate(user.createdAt)}</div>
                    <div className={styles.updatedDate}>Updated: {formatDate(user.updatedAt)}</div>
                  </div>
                </td>
                
                <td className={styles.td}>
                  <div className={styles.actions}>
                    <button
                      className={styles.iconBtn}
                      onClick={async () => {
                        const val = window.prompt('Top up amount (USD)');
                        if (!val) return;
                        const amount = Number(val);
                        if (!amount || isNaN(amount) || amount <= 0) return;
                        try {
                          const res = await api.adminTopupUser(user.id, amount);
                          const updated = mapBackendUser(res.data.user);
                          setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
                          alert(`Successfully topped up $${amount} for ${user.fullName}`);
                        } catch (e) {
                          console.error('Top up error', e);
                          alert('Failed to top up. Please try again.');
                        }
                      }}
                      title="Top up"
                    >
                      <FaDollarSign />
                    </button>
                    <button 
                      className={styles.iconBtn} 
                      onClick={() => onEdit(user)} 
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className={`${styles.iconBtn} ${styles.deleteBtn}`} 
                      onClick={() => onDelete(user.id)} 
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className={styles.emptyState}>
            <p>No users found</p>
          </div>
        )}
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingUser}
        onSubmit={async (data, id) => {
          try {
            if (id) {
              // Update existing user
              const resUpdated = await api.adminUpdateUser(id, { 
                fullName: data.fullName, 
                email: data.email,
                phoneNumber: data.phoneNumber,
                vipLevel: data.vipLevel,
                balance: data.balance,
                isActive: data.isActive
              });
              const updated = mapBackendUser(resUpdated.data?.user || {});
              setUsers(prev => prev.map(u => u.id === id ? updated : u));
            } else {
              // Create new user
              const created = await api.adminCreateUser({ 
                fullName: data.fullName, 
                email: data.email, 
                phoneNumber: data.phoneNumber,
                password: 'ChangeMe123!',
                vipLevel: data.vipLevel,
                balance: data.balance,
                isActive: data.isActive
              });
              const newUser = mapBackendUser(created.data?.user || {});
              setUsers(prev => [newUser, ...prev]);
            }
          } catch (e: any) {
            console.error('Error saving user:', e);
            const msg = e?.message || 'Update failed';
            window.alert(msg);
            return;
          }
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}


