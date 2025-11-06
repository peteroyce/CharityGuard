import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Divider,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  Analytics,
  People,
  Flag,
  History,
  Logout,
  AccountCircle,
  Dashboard,
  Notifications,
  NotificationsActive,
  CheckCircle,
  Block,
  PersonOff
} from '@mui/icons-material';
import axios from 'axios';
import CGLogo from '../assets/CharityGuardLogo.png';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface ActivityLog {
  _id: string;
  adminName: string;
  action: string;
  details: string;
  timestamp: string;
}

const AdminNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchRecentActivities();
    const interval = setInterval(fetchRecentActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentActivities = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/activity-logs/recent`);
      if (response.data.success) {
        setRecentActivities(response.data.data.slice(0, 5));
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
    setUnreadCount(0);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { label: 'Analytics', path: '/admin/analytics', icon: <Analytics /> },
    { label: 'Users', path: '/admin/users', icon: <People /> },
    { label: 'Flagged Transactions', path: '/admin/flagged-transactions', icon: <Flag /> },
    { label: 'Activity Logs', path: '/admin/activity', icon: <History /> }
  ];

  const getActionIcon = (action: string) => {
    if (action.includes('clear')) return <CheckCircle sx={{ color: '#10b981', fontSize: 20 }} />;
    if (action.includes('block')) return <Block sx={{ color: '#ef4444', fontSize: 20 }} />;
    if (action.includes('suspend')) return <PersonOff sx={{ color: '#f59e0b', fontSize: 20 }} />;
    return <History sx={{ color: '#14b8a6', fontSize: 20 }} />;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(20, 184, 166, 0.2)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1600px',
          mx: 'auto',
          px: 4,
          py: 2,
        }}
      >
        {/* Logo/Brand */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/admin')}
        >
          <Box
            component="img"
            src={CGLogo}
            alt="CharityGuard"
            sx={{
              height: 50,
              width: 'auto',
              borderRadius: 2,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.08)'
              }
            }}
          />
          <Typography
            variant="h5"
            sx={{
              color: '#ffffff',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Admin
          </Typography>
        </Box>

        {/* Navigation Items */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                color: isActive(item.path) ? '#14b8a6' : 'rgba(255, 255, 255, 0.8)',
                bgcolor: isActive(item.path) ? 'rgba(20, 184, 166, 0.15)' : 'transparent',
                px: 2.5,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: '0.95rem',
                textTransform: 'none',
                border: isActive(item.path) ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid transparent',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#14b8a6',
                  bgcolor: 'rgba(20, 184, 166, 0.15)',
                  border: '1px solid rgba(20, 184, 166, 0.3)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}

          {/* Notification Bell */}
          <IconButton
            onClick={handleNotifOpen}
            sx={{
              ml: 1,
              color: '#14b8a6',
              bgcolor: 'rgba(20, 184, 166, 0.1)',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              '&:hover': {
                bgcolor: 'rgba(20, 184, 166, 0.2)',
                transform: 'scale(1.05)',
              }
            }}
          >
            <Badge 
              badgeContent={unreadCount} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: '#ef4444',
                  animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                  }
                }
              }}
            >
              {unreadCount > 0 ? <NotificationsActive /> : <Notifications />}
            </Badge>
          </IconButton>

          {/* Notifications Menu */}
          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleNotifClose}
            PaperProps={{
              sx: {
                mt: 1,
                width: 400,
                maxHeight: 500,
                bgcolor: 'rgba(15, 23, 42, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(20, 184, 166, 0.3)',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              }
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700 }}>
                Recent Activity
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Last 24 hours
              </Typography>
            </Box>
            <List sx={{ py: 0 }}>
              {recentActivities.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No recent activity"
                    primaryTypographyProps={{ sx: { color: '#94a3b8', textAlign: 'center' } }}
                  />
                </ListItem>
              ) : (
                recentActivities.map((activity) => (
                  <ListItem
                    key={activity._id}
                    sx={{
                      borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                      '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.05)' },
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      navigate('/admin/activity');
                      handleNotifClose();
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'rgba(20, 184, 166, 0.2)' }}>
                        {getActionIcon(activity.action)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                          {activity.adminName}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block' }}>
                            {activity.action.replace(/_/g, ' ')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {formatTime(activity.timestamp)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))
              )}
            </List>
            <Box sx={{ p: 1.5, borderTop: '1px solid rgba(148, 163, 184, 0.2)', textAlign: 'center' }}>
              <Button
                fullWidth
                onClick={() => {
                  navigate('/admin/activity');
                  handleNotifClose();
                }}
                sx={{
                  color: '#14b8a6',
                  '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.1)' }
                }}
              >
                View All Activity
              </Button>
            </Box>
          </Menu>

          {/* Admin Profile Menu */}
          <Box sx={{ ml: 1 }}>
            <IconButton
              onClick={handleMenuOpen}
              sx={{
                bgcolor: 'rgba(20, 184, 166, 0.15)',
                border: '1px solid rgba(20, 184, 166, 0.3)',
                '&:hover': {
                  bgcolor: 'rgba(20, 184, 166, 0.25)',
                  transform: 'scale(1.05)',
                }
              }}
            >
              <Avatar
                sx={{
                  bgcolor: '#14b8a6',
                  width: 36,
                  height: 36,
                  fontSize: '1rem'
                }}
              >
                A
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 200,
                  bgcolor: 'rgba(15, 23, 42, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(20, 184, 166, 0.3)',
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Signed in as
                </Typography>
                <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600 }}>
                  Admin
                </Typography>
              </Box>
              <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.2)' }} />
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  navigate('/admin');
                }}
                sx={{
                  color: '#ffffff',
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(20, 184, 166, 0.15)',
                  }
                }}
              >
                <Dashboard sx={{ mr: 1.5, fontSize: 20 }} />
                Dashboard
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                }}
                sx={{
                  color: '#ffffff',
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(20, 184, 166, 0.15)',
                  }
                }}
              >
                <AccountCircle sx={{ mr: 1.5, fontSize: 20 }} />
                Profile
              </MenuItem>
              <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.2)' }} />
              <MenuItem
                onClick={handleLogout}
                sx={{
                  color: '#ef4444',
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(239, 68, 68, 0.15)',
                  }
                }}
              >
                <Logout sx={{ mr: 1.5, fontSize: 20 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminNavbar;



