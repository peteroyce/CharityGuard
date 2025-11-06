import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Divider,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  People,
  Flag,
  CheckCircle,
  ArrowForward,
  Block,
  Timeline,
  Notifications,
  Analytics,
  History
} from '@mui/icons-material';
import axios from 'axios';
import AnimatedCounter from '../components/AnimatedCounter';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  flaggedTransactions: number;
  clearedTransactions: number;
  recentActivities: any[];
  transactionStats: any;
  userStats: any;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    flaggedTransactions: 0,
    clearedTransactions: 0,
    recentActivities: [],
    transactionStats: {},
    userStats: {}
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [users, transactions, activities] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/users`),
        axios.get(`${API_BASE_URL}/api/transactions`),
        axios.get(`${API_BASE_URL}/api/activity-logs/recent`)
      ]);

      setStats({
        totalUsers: users.data.stats?.total || 0,
        activeUsers: users.data.stats?.active || 0,
        flaggedTransactions: transactions.data.stats?.flagged || 0,
        clearedTransactions: transactions.data.stats?.cleared || 0,
        recentActivities: activities.data.data || [],
        transactionStats: transactions.data.stats || {},
        userStats: users.data.stats || {}
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'View Analytics',
      description: 'Check charts and trends',
      icon: <Analytics sx={{ fontSize: 40 }} />,
      color: '#14b8a6',
      path: '/admin/analytics'
    },
    {
      title: 'Manage Users',
      description: 'User accounts & permissions',
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#3b82f6',
      path: '/admin/users'
    },
    {
      title: 'Review Flagged',
      description: 'Check suspicious transactions',
      icon: <Flag sx={{ fontSize: 40 }} />,
      color: '#f59e0b',
      path: '/admin/flagged-transactions'
    },
    {
      title: 'Activity Logs',
      description: 'Audit trail & history',
      icon: <History sx={{ fontSize: 40 }} />,
      color: '#8b5cf6',
      path: '/admin/activity'
    }
  ];

  const getActionColor = (action: string) => {
    if (action.includes('clear')) return '#10b981';
    if (action.includes('block')) return '#ef4444';
    if (action.includes('suspend')) return '#f59e0b';
    return '#14b8a6';
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

  if (loading) {
    return (
      <Box className="page-transition" sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
        <DashboardSkeleton />
      </Box>
    );
  }

  return (
    <Box className="page-transition fade-in" sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', py: 4 }}>
      <Container maxWidth="xl">
        {/* Welcome Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 800, mb: 1 }}>
            Welcome back, Admin! 👋
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8' }}>
            Here's what's happening with CharityGuard today
          </Typography>
        </Box>

        {/* Stats Overview */}
        <Grid container spacing={3} className="stagger-children" sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="hover-lift" sx={{
              background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(15, 23, 42, 0.95))',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              borderRadius: 3
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Total Users</Typography>
                    <AnimatedCounter
                      value={stats.totalUsers}
                      variant="h3"
                      sx={{ color: '#14b8a6', fontWeight: 800 }}
                      duration={1500}
                    />
                    <Chip 
                      label={`${stats.activeUsers} active`}
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        mt: 1,
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  <People sx={{ color: '#14b8a6', fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="hover-lift" sx={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(15, 23, 42, 0.95))',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 3
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Flagged</Typography>
                    <AnimatedCounter
                      value={stats.flaggedTransactions}
                      variant="h3"
                      sx={{ color: '#ef4444', fontWeight: 800 }}
                      duration={1500}
                    />
                    <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1 }}>
                      Needs review
                    </Typography>
                  </Box>
                  <Flag sx={{ color: '#ef4444', fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="hover-lift" sx={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(15, 23, 42, 0.95))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 3
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Cleared</Typography>
                    <AnimatedCounter
                      value={stats.clearedTransactions}
                      variant="h3"
                      sx={{ color: '#10b981', fontWeight: 800 }}
                      duration={1500}
                    />
                    <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1 }}>
                      Verified safe
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ color: '#10b981', fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card className="hover-lift" sx={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.95))',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 3
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Under Review</Typography>
                    <AnimatedCounter
                      value={stats.transactionStats.under_review || 0}
                      variant="h3"
                      sx={{ color: '#f59e0b', fontWeight: 800 }}
                      duration={1500}
                    />
                    <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1 }}>
                      Pending decision
                    </Typography>
                  </Box>
                  <Timeline sx={{ color: '#f59e0b', fontSize: 48, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 700, mb: 3 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={3} className="stagger-children">
            {quickActions.map((action, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card
                  className="hover-lift"
                  onClick={() => navigate(action.path)}
                  sx={{
                    background: `linear-gradient(135deg, ${action.color}20, rgba(15, 23, 42, 0.95))`,
                    border: `1px solid ${action.color}50`,
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 10px 30px ${action.color}40`,
                      border: `1px solid ${action.color}`
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ color: action.color, opacity: 0.8 }}>
                        {action.icon}
                      </Box>
                      <IconButton
                        size="small"
                        sx={{ color: action.color }}
                      >
                        <ArrowForward />
                      </IconButton>
                    </Box>
                    <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700, mb: 0.5 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Recent Activity */}
        <Card className="hover-lift" sx={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
          border: '1px solid rgba(20, 184, 166, 0.3)',
          borderRadius: 4
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications sx={{ color: '#14b8a6', fontSize: 28 }} />
                <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 700 }}>
                  Recent Activity
                </Typography>
              </Box>
              <Button
                endIcon={<ArrowForward />}
                onClick={() => navigate('/admin/activity')}
                sx={{ color: '#14b8a6' }}
              >
                View All
              </Button>
            </Box>

            {stats.recentActivities.length === 0 ? (
              <EmptyState
                type="no-activity"
                title="No recent activity"
                description="Admin actions will appear here"
              />
            ) : (
              <Box>
                {stats.recentActivities.slice(0, 5).map((activity, idx) => (
                  <Box key={idx} className="fade-in">
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        py: 2,
                        '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.05)' },
                        borderRadius: 2,
                        px: 1,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => navigate('/admin/activity')}
                    >
                      <Avatar
                        sx={{
                          bgcolor: `${getActionColor(activity.action)}30`,
                          color: getActionColor(activity.action)
                        }}
                      >
                        {activity.adminName.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600 }}>
                          {activity.adminName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                          {activity.action.replace(/_/g, ' ')} • {activity.details.slice(0, 50)}...
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {formatTime(activity.timestamp)}
                      </Typography>
                    </Box>
                    {idx < stats.recentActivities.length - 1 && (
                      <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.1)' }} />
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default AdminDashboard;

