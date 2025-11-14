import React, { useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Button, 
  Container,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Tooltip,
  InputAdornment,
  Avatar,
  Divider
} from "@mui/material";
import {
  Search,
  Download,
  Visibility,
  CheckCircle,
  Block,
  Person,
  Email,
  AccountBalanceWallet,
  TrendingUp
} from "@mui/icons-material";
import axios from "axios";
import { toast } from 'react-toastify';
import AnimatedCounter from '../components/AnimatedCounter';
import { TableSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

interface User {
  _id: string;
  walletAddress: string;
  email: string;
  username: string;
  accountStatus: 'active' | 'suspended' | 'banned';
  isVerified: boolean;
  totalDonations: number;
  donationCount: number;
  createdAt: string;
  lastActive: string;
}

interface UserDetails extends User {
  recentDonations: any[];
  activityLogs: any[];
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    banned: 0,
    verified: 0
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | 'ban' | null>(null);
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [statusFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`${API_BASE_URL}/api/users?${params.toString()}`);
      
      if (response.data.success) {
        setUsers(response.data.data || []);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      } else {
        toast.error('Failed to load users');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    setLoadingDetails(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${userId}/details`);
      if (response.data.success) {
        setUserDetails(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      toast.error('Failed to fetch user details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;

    setUpdating(true);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/users/${selectedUser._id}/status`,
        {
          action: actionType,
          reason: reason,
          adminId: 'admin',
          adminName: 'Admin'
        }
      );

      if (response.data.success) {
        toast.success(`User ${actionType}d successfully!`, {
          className: 'success-pulse'
        });
        setDialogOpen(false);
        setSelectedUser(null);
        setActionType(null);
        setReason('');
        fetchUsers();
      } else {
        toast.error('Failed to update user');
      }
    } catch (err: any) {
      toast.error('Failed to update user', {
        className: 'shake'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    setDetailsOpen(true);
    await fetchUserDetails(user._id);
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/export?status=${statusFilter}`);
      if (response.data.success) {
        const usersData = response.data.data;
        const csv = convertToCSV(usersData);
        downloadCSV(csv, `users-${statusFilter}-${new Date().toISOString()}.csv`);
        toast.success('CSV exported successfully!');
      }
    } catch (err) {
      console.error('Error exporting:', err);
      toast.error('Failed to export CSV');
    }
  };

  const convertToCSV = (data: any[]) => {
    const headers = ['Username', 'Email', 'Wallet', 'Status', 'Donations', 'Total Amount', 'Verified', 'Created'];
    const rows = data.map(user => [
      user.username,
      user.email,
      user.walletAddress,
      user.accountStatus,
      user.donationCount,
      user.totalDonations.toFixed(4) + ' ETH',
      user.isVerified ? 'Yes' : 'No',
      new Date(user.createdAt).toLocaleDateString()
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'suspended': return '#f59e0b';
      case 'banned': return '#ef4444';
      default: return '#64748b';
    }
  };

  const openActionDialog = (user: User, action: 'suspend' | 'activate' | 'ban') => {
    setSelectedUser(user);
    setActionType(action);
    setReason('');
    setDialogOpen(true);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box className="page-transition" sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', py: 4 }}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 800, mb: 1 }}>
              User Management
            </Typography>
          </Box>
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            borderRadius: 4
          }}>
            <CardContent>
              <TableSkeleton />
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box className="page-transition fade-in" sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Person sx={{ color: '#14b8a6', fontSize: 40 }} />
            <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 800 }}>
              User Management
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportCSV}
            sx={{
              background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
              '&:hover': { 
                background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(20, 184, 166, 0.3)'
              }
            }}
          >
            Export CSV
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} className="stagger-children" sx={{ mb: 4 }}>
          {[
            { label: 'Total Users', value: stats.total, color: '#14b8a6', icon: <Person /> },
            { label: 'Active', value: stats.active, color: '#10b981', icon: <CheckCircle /> },
            { label: 'Suspended', value: stats.suspended, color: '#f59e0b', icon: <Block /> },
            { label: 'Banned', value: stats.banned, color: '#ef4444', icon: <Block /> },
            { label: 'Verified', value: stats.verified, color: '#3b82f6', icon: <CheckCircle /> }
          ].map((stat, idx) => (
            <Grid item xs={12} sm={6} md={2.4} key={idx}>
              <Card className="hover-lift" sx={{
                background: `linear-gradient(135deg, ${stat.color}20, rgba(15, 23, 42, 0.95))`,
                border: `1px solid ${stat.color}50`,
                borderRadius: 3
              }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <AnimatedCounter
                      value={stat.value}
                      variant="h4"
                      sx={{ color: stat.color, fontWeight: 800 }}
                      duration={1200}
                    />
                    <Typography variant="body2" sx={{ color: '#cbd5e1' }}>{stat.label}</Typography>
                  </Box>
                  <Box sx={{ color: stat.color, opacity: 0.3, fontSize: 48 }}>{stat.icon}</Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Search and Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#14b8a6' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              minWidth: 300,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                '& fieldset': { borderColor: 'rgba(20, 184, 166, 0.3)' },
                '&:hover fieldset': { borderColor: '#14b8a6' },
                '&.Mui-focused fieldset': { borderColor: '#14b8a6' }
              }
            }}
          />
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['all', 'active', 'suspended', 'banned'].map((status) => (
              <Chip
                key={status}
                label={status.toUpperCase()}
                onClick={() => setStatusFilter(status)}
                sx={{
                  bgcolor: statusFilter === status ? getStatusColor(status) : 'rgba(15, 23, 42, 0.9)',
                  color: '#ffffff',
                  border: `2px solid ${statusFilter === status ? getStatusColor(status) : 'rgba(148, 163, 184, 0.3)'}`,
                  fontWeight: 700,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: statusFilter === status ? getStatusColor(status) : 'rgba(20, 184, 166, 0.2)',
                    transform: 'translateY(-2px)'
                  }
                }}
              />
            ))}
          </Box>
        </Box>
                {/* Users Table */}
                <Card className="hover-lift" sx={{ 
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
          border: '1px solid rgba(20, 184, 166, 0.3)',
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 0 }}>
            {filteredUsers.length === 0 ? (
              <EmptyState
                type={searchTerm ? 'no-results' : 'no-users'}
                title={searchTerm ? 'No users found' : 'No users yet'}
                description={searchTerm ? 'Try adjusting your search terms' : 'Users will appear here once they register'}
              />
            ) : (
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(20, 184, 166, 0.1)' }}>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>User</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Wallet</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Donations</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow 
                      key={user._id}
                      className="fade-in"
                      sx={{ 
                        '&:hover': { 
                          bgcolor: 'rgba(20, 184, 166, 0.08)',
                          transform: 'scale(1.005)',
                          transition: 'all 0.3s ease'
                        },
                        borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#14b8a6', width: 40, height: 40 }}>
                            {user.username.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
                              {user.username}
                            </Typography>
                            {user.isVerified && (
                              <Chip 
                                label="Verified" 
                                size="small" 
                                sx={{ 
                                  bgcolor: 'rgba(59, 130, 246, 0.2)', 
                                  color: '#3b82f6',
                                  fontSize: '0.7rem',
                                  height: 20
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#cbd5e1' }}>{user.email}</TableCell>
                      <TableCell sx={{ color: '#14b8a6', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography sx={{ color: '#10b981', fontWeight: 700 }}>
                            {(user.totalDonations || 0).toFixed(4)} ETH
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            {user.donationCount} donation{user.donationCount !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.accountStatus.toUpperCase()}
                          sx={{ 
                            bgcolor: `${getStatusColor(user.accountStatus)}30`,
                            color: getStatusColor(user.accountStatus),
                            fontWeight: 700,
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(user)}
                              sx={{ 
                                color: '#14b8a6',
                                '&:hover': {
                                  bgcolor: 'rgba(20, 184, 166, 0.2)',
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {user.accountStatus === 'active' && (
                            <Tooltip title="Suspend">
                              <IconButton
                                size="small"
                                onClick={() => openActionDialog(user, 'suspend')}
                                sx={{ 
                                  color: '#f59e0b',
                                  '&:hover': {
                                    bgcolor: 'rgba(245, 158, 11, 0.2)',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <Block fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {user.accountStatus === 'suspended' && (
                            <Tooltip title="Activate">
                              <IconButton
                                size="small"
                                onClick={() => openActionDialog(user, 'activate')}
                                sx={{ 
                                  color: '#10b981',
                                  '&:hover': {
                                    bgcolor: 'rgba(16, 185, 129, 0.2)',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {user.accountStatus !== 'banned' && (
                            <Tooltip title="Ban">
                              <IconButton
                                size="small"
                                onClick={() => openActionDialog(user, 'ban')}
                                sx={{ 
                                  color: '#ef4444',
                                  '&:hover': {
                                    bgcolor: 'rgba(239, 68, 68, 0.2)',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <Block fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Action Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        className="scale-up"
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            borderRadius: 4
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff', fontWeight: 700 }}>
          {actionType === 'suspend' && 'Suspend User'}
          {actionType === 'activate' && 'Activate User'}
          {actionType === 'ban' && 'Ban User'}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                Username: <span style={{ color: '#ffffff', fontWeight: 600 }}>{selectedUser.username}</span>
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                Email: {selectedUser.email}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                Current Status: <Chip 
                  label={selectedUser.accountStatus.toUpperCase()}
                  size="small"
                  sx={{ 
                    bgcolor: `${getStatusColor(selectedUser.accountStatus)}30`,
                    color: getStatusColor(selectedUser.accountStatus),
                    fontWeight: 600,
                    ml: 1
                  }}
                />
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a reason for this action..."
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(15, 23, 42, 0.8)',
                    color: '#ffffff',
                    '& fieldset': { borderColor: 'rgba(20, 184, 166, 0.3)' },
                    '&:hover fieldset': { borderColor: '#14b8a6' },
                    '&.Mui-focused fieldset': { borderColor: '#14b8a6' }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#94a3b8',
                    '&.Mui-focused': { color: '#14b8a6' }
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDialogOpen(false)} 
            sx={{ 
              color: '#94a3b8',
              '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.1)' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAction}
            disabled={updating || !reason.trim()}
            variant="contained"
            sx={{
              bgcolor: actionType === 'ban' ? '#ef4444' : actionType === 'suspend' ? '#f59e0b' : '#10b981',
              '&:hover': {
                bgcolor: actionType === 'ban' ? '#dc2626' : actionType === 'suspend' ? '#d97706' : '#059669',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
              },
              '&:disabled': {
                bgcolor: 'rgba(148, 163, 184, 0.3)'
              }
            }}
          >
            {updating ? 'Processing...' : `Confirm ${actionType}`}
          </Button>
        </DialogActions>
      </Dialog>
            {/* User Details Dialog */}
            <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        className="scale-up"
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            borderRadius: 4
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff', fontWeight: 700 }}>
          User Details
        </DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Box className="loading-spinner" />
            </Box>
          ) : userDetails ? (
            <Box sx={{ mt: 2 }} className="fade-in">
              <Grid container spacing={3}>
                {/* User Info */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ bgcolor: '#14b8a6', width: 60, height: 60, fontSize: '1.5rem' }}>
                      {userDetails.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700 }}>
                        {userDetails.username}
                      </Typography>
                      {userDetails.isVerified && (
                        <Chip 
                          label="Verified" 
                          size="small" 
                          sx={{ 
                            bgcolor: 'rgba(59, 130, 246, 0.2)', 
                            color: '#3b82f6',
                            mt: 0.5
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip 
                      label={userDetails.accountStatus.toUpperCase()}
                      sx={{ 
                        bgcolor: `${getStatusColor(userDetails.accountStatus)}30`,
                        color: getStatusColor(userDetails.accountStatus),
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        px: 2,
                        py: 2.5
                      }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.2)' }} />
                </Grid>

                {/* Contact Info */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Email sx={{ color: '#14b8a6' }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>Email</Typography>
                      <Typography sx={{ color: '#ffffff' }}>{userDetails.email}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AccountBalanceWallet sx={{ color: '#14b8a6' }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>Wallet Address</Typography>
                      <Typography sx={{ color: '#14b8a6', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                        {userDetails.walletAddress}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Stats */}
                <Grid item xs={12} md={4}>
                  <Card className="hover-lift" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TrendingUp sx={{ color: '#10b981' }} />
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>Total Donations</Typography>
                      </Box>
                      <AnimatedCounter
                        value={userDetails.totalDonations || 0}
                        variant="h5"
                        sx={{ color: '#10b981', fontWeight: 700 }}
                        decimals={4}
                        suffix=" ETH"
                        duration={1000}
                      />
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {userDetails.donationCount} transaction{userDetails.donationCount !== 1 ? 's' : ''}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card className="hover-lift" sx={{ bgcolor: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.3)' }}>
                    <CardContent>
                      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Member Since</Typography>
                      <Typography variant="h6" sx={{ color: '#14b8a6', fontWeight: 700 }}>
                        {new Date(userDetails.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {Math.floor((Date.now() - new Date(userDetails.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card className="hover-lift" sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <CardContent>
                      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>Last Active</Typography>
                      <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 700 }}>
                        {new Date(userDetails.lastActive).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        {Math.floor((Date.now() - new Date(userDetails.lastActive).getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Recent Donations */}
                {userDetails.recentDonations && userDetails.recentDonations.length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.2)', my: 2 }} />
                    <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 700 }}>
                      Recent Donations ({userDetails.recentDonations.length})
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {userDetails.recentDonations.map((donation: any, idx: number) => (
                        <Card 
                          key={idx}
                          className="hover-lift fade-in"
                          sx={{ 
                            bgcolor: 'rgba(15, 23, 42, 0.6)', 
                            mb: 2,
                            border: '1px solid rgba(148, 163, 184, 0.1)'
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
                                  {donation.nonprofitName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                  {new Date(donation.timestamp || donation.date).toLocaleString()}
                                </Typography>
                              </Box>
                              <Typography sx={{ color: '#10b981', fontWeight: 700, fontSize: '1.1rem' }}>
                                {(donation.amount || 0).toFixed(4)} ETH
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Grid>
                )}

                {/* Activity Logs */}
                {userDetails.activityLogs && userDetails.activityLogs.length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.2)', my: 2 }} />
                    <Typography variant="h6" sx={{ color: '#ffffff', mb: 2, fontWeight: 700 }}>
                      Activity History ({userDetails.activityLogs.length})
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                      {userDetails.activityLogs.map((log: any, idx: number) => (
                        <Box 
                          key={idx}
                          className="fade-in"
                          sx={{ 
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 2,
                            mb: 2,
                            pb: 2,
                            borderBottom: idx < userDetails.activityLogs.length - 1 ? '1px solid rgba(148, 163, 184, 0.1)' : 'none',
                            '&:hover': {
                              bgcolor: 'rgba(20, 184, 166, 0.05)',
                              borderRadius: 2,
                              px: 1
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Box 
                            sx={{ 
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: '#14b8a6',
                              mt: 0.5,
                              animation: 'pulse 2s infinite'
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                              {log.action.replace(/_/g, ' ').toUpperCase()}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                              {log.adminName} • {new Date(log.timestamp).toLocaleString()}
                            </Typography>
                            {log.details && (
                              <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block', mt: 0.5 }}>
                                {log.details}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDetailsOpen(false)} 
            sx={{ 
              color: '#94a3b8',
              '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.1)' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsers;


