import React, { useState, useEffect } from 'react';
import { FaUsers, FaDollarSign, FaClock, FaChartLine, FaExclamationTriangle, FaCheckCircle, FaComments, FaShoppingCart } from 'react-icons/fa';
import api from '../../services/api';
import styles from './DashboardPage.module.css';

interface DashboardStats {
  pendingRequests: number;
  todayApproved: number;
  totalUsers: number;
  activeUsers: number;
  todayDepositAmount: number;
  todayCommissionPaid: number;
  vipDistribution: Array<{ _id: string; count: number }>;
}

interface RecentActivity {
  id: string;
  type: 'deposit' | 'user' | 'order' | 'chat';
  message: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error';
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.adminDashboardStats();
      setStats(response.data);
      
      // Mock recent activity data
      setRecentActivity([
        {
          id: '1',
          type: 'deposit',
          message: 'New deposit request: $5,000 from NGUYEN VAN THUAN',
          timestamp: '2 minutes ago',
          status: 'warning'
        },
        {
          id: '2',
          type: 'user',
          message: 'New user registered: Nguyễn Thuần',
          timestamp: '15 minutes ago',
          status: 'success'
        },
        {
          id: '3',
          type: 'order',
          message: 'Order completed: Rolex Submariner - Commission $50',
          timestamp: '1 hour ago',
          status: 'success'
        },
        {
          id: '4',
          type: 'chat',
          message: 'New message from vthuan.dev@gmail.com',
          timestamp: '2 hours ago',
          status: 'warning'
        }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <FaDollarSign />;
      case 'user': return <FaUsers />;
      case 'order': return <FaShoppingCart />;
      case 'chat': return <FaComments />;
      default: return <FaChartLine />;
    }
  };

  const getActivityColor = (status?: string) => {
    switch (status) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.subtitle}>Welcome to the admin dashboard overview</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaUsers />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statNumber}>{stats?.totalUsers || 0}</h3>
            <p className={styles.statLabel}>Total Users</p>
            <p className={styles.statSubtext}>{stats?.activeUsers || 0} active</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaExclamationTriangle />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statNumber}>{stats?.pendingRequests || 0}</h3>
            <p className={styles.statLabel}>Pending Deposits</p>
            <p className={styles.statSubtext}>Requires review</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaCheckCircle />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statNumber}>{stats?.todayApproved || 0}</h3>
            <p className={styles.statLabel}>Approved Today</p>
            <p className={styles.statSubtext}>Deposits processed</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaDollarSign />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statNumber}>{formatCurrency(stats?.todayDepositAmount || 0)}</h3>
            <p className={styles.statLabel}>Today's Deposits</p>
            <p className={styles.statSubtext}>Total amount</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaChartLine />
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statNumber}>{formatCurrency(stats?.todayCommissionPaid || 0)}</h3>
            <p className={styles.statLabel}>Commission Paid</p>
            <p className={styles.statSubtext}>Today's rewards</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Recent Activity */}
        <div className={styles.activityCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Activity</h2>
            <button className={styles.refreshBtn} onClick={loadDashboardData}>
              <FaChartLine />
            </button>
          </div>
          <div className={styles.activityList}>
            {recentActivity.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={styles.activityIcon} style={{ color: getActivityColor(activity.status) }}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityMessage}>{activity.message}</p>
                  <span className={styles.activityTime}>{activity.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActionsCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Quick Actions</h2>
          </div>
          <div className={styles.quickActions}>
            <button className={styles.actionBtn}>
              <FaUsers />
              <span>Manage Users</span>
            </button>
            <button className={styles.actionBtn}>
              <FaDollarSign />
              <span>Review Deposits</span>
            </button>
            <button className={styles.actionBtn}>
              <FaComments />
              <span>View Chats</span>
            </button>
            <button className={styles.actionBtn}>
              <FaChartLine />
              <span>View Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className={styles.systemStatus}>
        <div className={styles.statusItem}>
          <div className={styles.statusIndicator}></div>
          <span>System Status: Online</span>
        </div>
        <div className={styles.statusItem}>
          <div className={styles.statusIndicator}></div>
          <span>Database: Connected</span>
        </div>
        <div className={styles.statusItem}>
          <div className={styles.statusIndicator}></div>
          <span>Last Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}


