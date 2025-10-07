import React from 'react';
import styles from './DepositsPage.module.css';
import api from '../../../services/api';
import { FaCheck, FaTimes, FaDollarSign, FaClock, FaUser, FaSearch, FaFilter, FaEye } from 'react-icons/fa';

type DepositRequest = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  notes?: string;
};

export function DepositsPage() {
  const [deposits, setDeposits] = React.useState<DepositRequest[]>([]);
  const [requestType, setRequestType] = React.useState<'deposit' | 'withdrawal'>('deposit');
  const [status, setStatus] = React.useState('pending');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState('requestDate');
  const [sortOrder, setSortOrder] = React.useState('desc');
  const [loading, setLoading] = React.useState(false);
  const [selectedDeposit, setSelectedDeposit] = React.useState<DepositRequest | null>(null);
  const [showModal, setShowModal] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      // Hiện tại chỉ có API duyệt nạp tiền cho admin; phần rút tiền sẽ bổ sung sau
      let listRaw: any[] = [];
      if (requestType === 'withdrawal') {
        const res = await api.adminListWithdrawalRequests({ status });
        listRaw = (res.data?.requests || res.data?.data?.requests || []);
      } else {
        const res = await api.adminListDepositRequests({ status });
        listRaw = (res.data?.requests || res.data?.data?.requests || []);
      }
      const list = listRaw.map((r: any) => ({
        id: r._id,
        userId: r.userId?._id || r.userId,
        userName: r.userId?.fullName || r.userId?.username || 'Unknown User',
        userEmail: r.userId?.email || '',
        userPhone: r.userId?.phoneNumber || '',
        amount: r.amount,
        status: r.status,
        requestDate: r.requestDate,
        approvedAt: r.approvedAt,
        approvedBy: r.approvedBy?.username || r.approvedBy,
        rejectionReason: r.rejectionReason,
        notes: r.notes,
      }));
      setDeposits(list);
    } catch (error) {
      console.error('Error loading deposits:', error);
    } finally {
      setLoading(false);
    }
  }, [status, requestType]);

  React.useEffect(() => { load(); }, [load]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FaClock />;
      case 'approved': return <FaCheck />;
      case 'rejected': return <FaTimes />;
      default: return <FaEye />;
    }
  };

  // Filter and sort deposits
  const filteredDeposits = React.useMemo(() => {
    let filtered = deposits.filter(deposit => {
      const matchesSearch = 
        deposit.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposit.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposit.userPhone.includes(searchTerm) ||
        deposit.amount.toString().includes(searchTerm);
      
      return matchesSearch;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'userName':
          aValue = a.userName.toLowerCase();
          bValue = b.userName.toLowerCase();
          break;
        case 'requestDate':
        default:
          aValue = new Date(a.requestDate).getTime();
          bValue = new Date(b.requestDate).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [deposits, searchTerm, sortBy, sortOrder]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const pending = deposits.filter(d => d.status === 'pending');
    const approved = deposits.filter(d => d.status === 'approved');
    const rejected = deposits.filter(d => d.status === 'rejected');
    const totalAmount = approved.reduce((sum, d) => sum + d.amount, 0);

    return {
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      totalAmount
    };
  }, [deposits]);

  const approve = async (id: string) => {
    try {
      if (requestType === 'withdrawal') {
        await api.adminApproveWithdrawal(id, 'Approved via admin dashboard');
      } else {
        await api.adminApproveDeposit(id, 'Approved via admin dashboard');
      }
      load();
    } catch (error) {
      console.error('Error approving deposit:', error);
    }
  };

  const reject = async (id: string) => {
    const reason = prompt('Lý do từ chối?');
    if (!reason) return;
    try {
      if (requestType === 'withdrawal') {
        await api.adminRejectWithdrawal(id, reason);
      } else {
        await api.adminRejectDeposit(id, reason, 'Rejected via admin dashboard');
      }
      load();
    } catch (error) {
      console.error('Error rejecting deposit:', error);
    }
  };

  const viewDetails = (deposit: DepositRequest) => {
    setSelectedDeposit(deposit);
    setShowModal(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Quản lý nạp / rút tiền</h1>
          <p className={styles.subtitle}>Phê duyệt và quản lý các yêu cầu giao dịch từ người dùng</p>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại hoặc số tiền..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterControls}>
          <select 
            value={requestType}
            onChange={(e) => setRequestType(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="deposit">Nạp tiền</option>
            <option value="withdrawal">Rút tiền</option>
          </select>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="pending">Đang chờ</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Đã từ chối</option>
            <option value="all">Tất cả</option>
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="requestDate">Sắp xếp theo ngày</option>
            <option value="amount">Sắp xếp theo số tiền</option>
            <option value="userName">Sắp xếp theo tên</option>
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
          <div className={styles.statIcon}><FaClock /></div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{stats.pending}</div>
            <div className={styles.statLabel}>Đang chờ duyệt</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaCheck /></div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{stats.approved}</div>
            <div className={styles.statLabel}>Đã duyệt</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaTimes /></div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{stats.rejected}</div>
            <div className={styles.statLabel}>Đã từ chối</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaDollarSign /></div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{formatCurrency(stats.totalAmount)}</div>
            <div className={styles.statLabel}>Tổng đã duyệt ({requestType === 'deposit' ? 'nạp' : 'rút'})</div>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Người dùng</th>
              <th className={styles.th}>Số tiền</th>
              <th className={styles.th}>Trạng thái</th>
              <th className={styles.th}>Ngày yêu cầu</th>
              <th className={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className={styles.loadingCell}>
                  <div className={styles.loading}>Đang tải dữ liệu...</div>
                </td>
              </tr>
            ) : filteredDeposits.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  <div className={styles.emptyState}>
                    <FaSearch />
                    <p>
                      {requestType === 'deposit' 
                        ? 'Không tìm thấy yêu cầu nạp tiền nào'
                        : 'Chưa có yêu cầu rút tiền hoặc tính năng quản trị rút tiền đang được bổ sung'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDeposits.map(deposit => (
                <tr key={deposit.id} className={styles.row}>
                  <td className={styles.td}>
                    <div className={styles.userInfo}>
                      <div className={styles.avatar}>
                        {deposit.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.userDetails}>
                        <div className={styles.userName}>{deposit.userName}</div>
                        <div className={styles.userContact}>
                          <div className={styles.userEmail}>{deposit.userEmail}</div>
                          <div className={styles.userPhone}>{deposit.userPhone}</div>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className={styles.td}>
                    <div className={styles.amount}>
                      <span className={styles.amountValue}>{formatCurrency(deposit.amount)}</span>
                    </div>
                  </td>
                  
                  <td className={styles.td}>
                    <div 
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(deposit.status) }}
                    >
                      {getStatusIcon(deposit.status)}
                      <span className={styles.statusText}>
                        {deposit.status === 'pending' ? 'Chờ duyệt' : 
                         deposit.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                      </span>
                    </div>
                  </td>
                  
                  <td className={styles.td}>
                    <div className={styles.dateInfo}>
                      <div className={styles.requestDate}>{formatDate(deposit.requestDate)}</div>
                      {deposit.approvedAt && (
                        <div className={styles.approvedDate}>
                          Duyệt: {formatDate(deposit.approvedAt)}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <button 
                        className={styles.viewBtn}
                        onClick={() => viewDetails(deposit)}
                        title="Xem chi tiết"
                      >
                        <FaEye />
                      </button>
                      
                      {deposit.status === 'pending' && (
                        <>
                          <button 
                            className={styles.approveBtn}
                            onClick={() => approve(deposit.id)}
                            title="Duyệt"
                          >
                            <FaCheck />
                          </button>
                          <button 
                            className={styles.rejectBtn}
                            onClick={() => reject(deposit.id)}
                            title="Từ chối"
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showModal && selectedDeposit && (
        <div className={styles.modalBackdrop} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Chi tiết yêu cầu nạp tiền</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.detailSection}>
                <h4>Thông tin người dùng</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <label>Tên:</label>
                    <span>{selectedDeposit.userName}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Email:</label>
                    <span>{selectedDeposit.userEmail}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Số điện thoại:</label>
                    <span>{selectedDeposit.userPhone}</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.detailSection}>
                <h4>Thông tin yêu cầu</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <label>Số tiền:</label>
                    <span className={styles.amountDetail}>{formatCurrency(selectedDeposit.amount)}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Trạng thái:</label>
                    <span 
                      className={styles.statusDetail}
                      style={{ color: getStatusColor(selectedDeposit.status) }}
                    >
                      {selectedDeposit.status === 'pending' ? 'Chờ duyệt' : 
                       selectedDeposit.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Ngày yêu cầu:</label>
                    <span>{formatDate(selectedDeposit.requestDate)}</span>
                  </div>
                  {selectedDeposit.approvedAt && (
                    <div className={styles.detailItem}>
                      <label>Ngày duyệt:</label>
                      <span>{formatDate(selectedDeposit.approvedAt)}</span>
                    </div>
                  )}
                  {selectedDeposit.approvedBy && (
                    <div className={styles.detailItem}>
                      <label>Người duyệt:</label>
                      <span>{selectedDeposit.approvedBy}</span>
                    </div>
                  )}
                  {selectedDeposit.rejectionReason && (
                    <div className={styles.detailItem}>
                      <label>Lý do từ chối:</label>
                      <span className={styles.rejectionReason}>{selectedDeposit.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.closeModalBtn}
                onClick={() => setShowModal(false)}
              >
                Đóng
              </button>
              {selectedDeposit.status === 'pending' && (
                <>
                  <button 
                    className={styles.approveModalBtn}
                    onClick={() => {
                      approve(selectedDeposit.id);
                      setShowModal(false);
                    }}
                  >
                    Duyệt
                  </button>
                  <button 
                    className={styles.rejectModalBtn}
                    onClick={() => {
                      reject(selectedDeposit.id);
                      setShowModal(false);
                    }}
                  >
                    Từ chối
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


