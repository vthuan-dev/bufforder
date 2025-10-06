import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaUsers, 
  FaComments, 
  FaDollarSign, 
  FaSignOutAlt, 
  FaChevronLeft, 
  FaChevronRight,
  FaCog,
  FaChartBar,
  FaLock
} from 'react-icons/fa';
import styles from './Sidebar.module.css';
import { ChangePasswordPopup } from '../../components/ChangePasswordPopup';

interface SidebarProps {
  onLogout?: () => void;
  adminData?: any;
}

export function Sidebar({ onLogout, adminData }: SidebarProps) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Fallback: clear storage and navigate
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      navigate('/');
    }
  };

  // Get admin info from props or localStorage
  const adminInfo = adminData || JSON.parse(localStorage.getItem('adminData') || '{}');
  const adminName = adminInfo.username || adminInfo.fullName || 'Admin';
  const adminEmail = adminInfo.email || 'admin@gm.local';

  return (
    <div className={`${styles.wrapper} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logoSection}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>GM</div>
            {!isCollapsed && <span className={styles.logoText}>Admin</span>}
          </div>
          <button className={styles.toggleBtn} onClick={toggleSidebar}>
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navSection}>
          <div className={styles.navLabel}>Main</div>
          <NavLink 
            to="/admin/dashboard" 
            className={({ isActive }) => 
              `${styles.link} ${isActive ? styles.active : ''}`
            }
            title="Dashboard"
          >
            <FaHome className={styles.linkIcon} />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>
          
          <NavLink 
            to="/admin/users" 
            className={({ isActive }) => 
              `${styles.link} ${isActive ? styles.active : ''}`
            }
            title="Users"
          >
            <FaUsers className={styles.linkIcon} />
            {!isCollapsed && <span>Users</span>}
          </NavLink>
          
          <NavLink 
            to="/admin/deposits" 
            className={({ isActive }) => 
              `${styles.link} ${isActive ? styles.active : ''}`
            }
            title="Deposits"
          >
            <FaDollarSign className={styles.linkIcon} />
            {!isCollapsed && <span>Deposits</span>}
          </NavLink>
          
          <NavLink 
            to="/admin/chat" 
            className={({ isActive }) => 
              `${styles.link} ${isActive ? styles.active : ''}`
            }
            title="Chat"
          >
            <FaComments className={styles.linkIcon} />
            {!isCollapsed && <span>Chat</span>}
          </NavLink>
        </div>

        <div className={styles.navSection}>
          <div className={styles.navLabel}>Tools</div>
          <button className={styles.link} title="Analytics">
            <FaChartBar className={styles.linkIcon} />
            {!isCollapsed && <span>Analytics</span>}
          </button>
          
          <button className={styles.link} title="Settings">
            <FaCog className={styles.linkIcon} />
            {!isCollapsed && <span>Settings</span>}
          </button>
        </div>
      </nav>

      {/* User Section */}
      <div className={styles.userSection}>
        <div className={styles.user}>
          <div 
            className={styles.userInfo}
            onClick={() => setShowPasswordPopup(true)}
            style={{ cursor: 'pointer' }}
            title="Click to change password"
          >
            <div className={styles.avatar}>
              <span>A</span>
            </div>
            {!isCollapsed && (
              <div className={styles.userDetails}>
                <div className={styles.userName}>{adminName}</div>
                <div className={styles.userEmail}>{adminEmail}</div>
              </div>
            )}
            {!isCollapsed && (
              <div className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
                <FaLock className="w-3 h-3" />
              </div>
            )}
          </div>
          <button 
            className={styles.logoutBtn} 
            onClick={handleLogout}
            title="Logout"
          >
            <FaSignOutAlt />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Change Password Popup */}
      <ChangePasswordPopup
        isOpen={showPasswordPopup}
        onClose={() => setShowPasswordPopup(false)}
      />
    </div>
  );
}


