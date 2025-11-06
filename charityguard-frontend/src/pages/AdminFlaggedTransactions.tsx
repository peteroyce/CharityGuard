import React, { useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CircularProgress, 
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
  Checkbox,
  IconButton,
  Tooltip,
  InputAdornment,
  LinearProgress,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from "@mui/material";
import {
  Search,
  Download,
  Visibility,
  MoreVert,
  Timeline,
  Flag,
  TrendingUp
} from "@mui/icons-material";
import axios from "axios";
import { toast } from 'react-toastify';
import AnimatedCounter from '../components/AnimatedCounter';
import { TableSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

interface Transaction {
  _id: string;
  transactionHash: string;
  donorAddress: string;
  nonprofitName: string;
  nonprofitEIN: string;
  amount: number;
  fraudScore: number;
  riskFlags: string[];
  status: 'flagged' | 'under_review' | 'cleared' | 'blocked';
  reviewerNotes?: string;
  timestamp: string;
}

interface TransactionDetails extends Transaction {
  activityLogs: any[];
  analysis: {
    riskLevel: string;
    flagCount: number;
    reviewCount: number;
  };
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AdminFlaggedTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [minFraudScore] = useState<number>(0);
  const [stats, setStats] = useState({
    total: 0,
    flagged: 0,
    underReview: 0,
    blocked: 0,
    cleared: 0,
    totalAmount: 0,
    averageFraudScore: 0
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [txDetails, setTxDetails] = useState<TransactionDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'cleared' | 'blocked' | 'under_review' | null>(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTx, setMenuTx] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm, minFraudScore]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (minFraudScore > 0) params.append('minFraudScore', minFraudScore.toString());

      const response = await axios.get(`${API_BASE_URL}/api/transactions/flagged?${params.toString()}`);
      
      if (response.data.success) {
        setTransactions(response.data.data || []);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      } else {
        toast.error('Failed to load transactions');
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status: 'cleared' | 'blocked' | 'under_review') => {
    if (!selectedTx) return;

    setUpdating(true);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/transactions/${selectedTx._id}/status`,
        {
          status,
          reviewerNotes: notes,
          adminId: 'admin',
          adminName: 'Admin'
        }
      );

      if (response.data.success) {
        toast.success('Transaction updated successfully!', { className: 'success-pulse' });
        setDialogOpen(false);
        setSelectedTx(null);
        setNotes('');
        fetchTransactions();
      } else {
        toast.error('Failed to update transaction');
      }
    } catch (err: any) {
      toast.error('Failed to update transaction', { className: 'shake' });
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkAction = async () => {
    if (selectedIds.size === 0 || !bulkActionType) return;

    setUpdating(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/transactions/bulk-update`,
        {
          transactionIds: Array.from(selectedIds),
          status: bulkActionType,
          reviewerNotes: notes,
          adminId: 'admin',
          adminName: 'Admin'
        }
      );

      if (response.data.success) {
        toast.success(`Successfully updated ${selectedIds.size} transactions!`);
        setBulkDialogOpen(false);
        setBulkActionType(null);
        setSelectedIds(new Set());
        setNotes('');
        fetchTransactions();
      } else {
        toast.error('Failed to bulk update transactions');
      }
    } catch (err: any) {
      toast.error('Failed to bulk update transactions');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewDetails = async (tx: Transaction) => {
    setSelectedTx(tx);
    setDetailsOpen(true);
    setLoadingDetails(true);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/transactions/${tx._id}/details`);
      if (response.data.success) {
        setTxDetails(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/transactions/export?status=${statusFilter}`);
      if (response.data.success) {
        const txs = response.data.data;
        const csv = convertToCSV(txs);
        downloadCSV(csv, `flagged-transactions-${statusFilter}-${new Date().toISOString()}.csv`);
        toast.success('CSV exported successfully!');
      }
    } catch (err) {
      console.error('Error exporting:', err);
      toast.error('Failed to export CSV');
    }
  };

  const convertToCSV = (data: any[]) => {
    const headers = ['Transaction Hash', 'Donor', 'Nonprofit', 'Amount', 'Fraud Score', 'Status', 'Date'];
    const rows = data.map(tx => [
      tx.transactionHash,
      tx.donorAddress,
      tx.nonprofitName,
      tx.amount,
      (tx.fraudScore * 100).toFixed(0) + '%',
      tx.status,
      new Date(tx.timestamp).toLocaleDateString()
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

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map(t => t._id)));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'flagged': return '#ef4444';
      case 'under_review': return '#f59e0b';
      case 'cleared': return '#10b981';
      case 'blocked': return '#dc2626';
      default: return '#64748b';
    }
  };

  const getFraudScoreColor = (score: number) => {
    if (score >= 0.8) return '#dc2626';
    if (score >= 0.6) return '#ef4444';
    if (score >= 0.4) return '#f59e0b';
    return '#10b981';
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tx: Transaction) => {
    setAnchorEl(event.currentTarget);
    setMenuTx(tx);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuTx(null);
  };

  const openDialog = (tx: Transaction) => {
    setSelectedTx(tx);
    setNotes(tx.reviewerNotes || '');
    setDialogOpen(true);
    handleMenuClose();
  };

  if (loading) {
    return (
      <Box className="page-transition" sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', py: 4 }}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 800, mb: 1 }}>
              Flagged Transactions
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Flag sx={{ color: '#ef4444', fontSize: 40 }} />
            <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 800 }}>
              Flagged Transactions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {selectedIds.size > 0 && (
              <Button
                variant="contained"
                onClick={() => setBulkDialogOpen(true)}
                sx={{
                  bgcolor: '#f59e0b',
                  '&:hover': { bgcolor: '#d97706', transform: 'translateY(-2px)' }
                }}
              >
                Bulk Action ({selectedIds.size})
              </Button>
            )}
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
              Export
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} className="stagger-children" sx={{ mb: 4 }}>
          {[
            { label: 'Total Flagged', value: stats.total, color: '#14b8a6', icon: <Flag /> },
            { label: 'Under Review', value: stats.underReview, color: '#f59e0b', icon: <Timeline /> },
            { label: 'Blocked', value: stats.blocked, color: '#dc2626', icon: <Flag /> },
            { label: 'Avg Fraud Score', value: stats.averageFraudScore, color: '#ef4444', icon: <TrendingUp />, isPercent: true }
          ].map((stat, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card className="hover-lift" sx={{
                background: `linear-gradient(135deg, ${stat.color}20, rgba(15, 23, 42, 0.95))`,
                border: `1px solid ${stat.color}50`,
                borderRadius: 3
              }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <AnimatedCounter
                      value={stat.isPercent ? stat.value * 100 : stat.value}
                      variant="h4"
                      sx={{ color: stat.color, fontWeight: 800 }}
                      duration={1500}
                      decimals={stat.isPercent ? 0 : 0}
                      suffix={stat.isPercent ? '%' : ''}
                    />
                    <Typography variant="body2" sx={{ color: '#cbd5e1' }}>{stat.label}</Typography>
                  </Box>
                  <Box sx={{ color: stat.color, opacity: 0.3, fontSize: 48 }}>{stat.icon}</Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search transactions..."
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
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['all', 'flagged', 'under_review', 'blocked', 'cleared'].map((status) => (
              <Chip
                key={status}
                label={status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
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

        {/* Transactions Table */}
        <Card className="hover-lift" sx={{ 
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
          border: '1px solid rgba(20, 184, 166, 0.3)',
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 0 }}>
            {transactions.length === 0 ? (
              <EmptyState
                type="no-transactions"
                title="No flagged transactions"
                description={searchTerm ? 'Try adjusting your search filters' : 'Flagged transactions will appear here'}
              />
            ) : (
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(20, 184, 166, 0.1)' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.size === transactions.length && transactions.length > 0}
                        indeterminate={selectedIds.size > 0 && selectedIds.size < transactions.length}
                        onChange={toggleSelectAll}
                        sx={{ color: '#14b8a6', '&.Mui-checked': { color: '#14b8a6' } }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Transaction</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Nonprofit</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Amount</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Fraud Score</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow 
                      key={tx._id}
                      className="fade-in"
                      sx={{ 
                        '&:hover': { 
                          bgcolor: 'rgba(20, 184, 166, 0.08)',
                          transform: 'scale(1.002)',
                          transition: 'all 0.3s ease'
                        },
                        borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.has(tx._id)}
                          onChange={() => toggleSelection(tx._id)}
                          sx={{ color: '#14b8a6', '&.Mui-checked': { color: '#14b8a6' } }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#14b8a6', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {tx.transactionHash.slice(0, 10)}...{tx.transactionHash.slice(-8)}
                      </TableCell>
                      <TableCell sx={{ color: '#cbd5e1' }}>{tx.nonprofitName}</TableCell>
                      <TableCell sx={{ color: '#10b981', fontWeight: 700 }}>
                        {tx.amount.toFixed(4)} ETH
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={`${(tx.fraudScore * 100).toFixed(0)}%`}
                            sx={{ 
                              bgcolor: `${getFraudScoreColor(tx.fraudScore)}30`,
                              color: getFraudScoreColor(tx.fraudScore),
                              fontWeight: 700,
                              fontSize: '0.85rem'
                            }}
                          />
                          <LinearProgress 
                            variant="determinate" 
                            value={tx.fraudScore * 100}
                            sx={{
                              width: 60,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'rgba(148, 163, 184, 0.2)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getFraudScoreColor(tx.fraudScore),
                                borderRadius: 3
                              }
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={tx.status.replace('_', ' ').toUpperCase()}
                          sx={{ 
                            bgcolor: `${getStatusColor(tx.status)}30`,
                            color: getStatusColor(tx.status),
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
                              onClick={() => handleViewDetails(tx)}
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
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, tx)}
                            sx={{ 
                              color: '#94a3b8',
                              '&:hover': {
                                bgcolor: 'rgba(148, 163, 184, 0.2)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
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

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            '& .MuiMenuItem-root': {
              color: '#ffffff',
              '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.2)' }
            }
          }
        }}
      >
        <MenuItem onClick={() => menuTx && openDialog(menuTx)}>
          Update Status
        </MenuItem>
        <MenuItem onClick={() => menuTx && handleViewDetails(menuTx)}>
          View Details
        </MenuItem>
      </Menu>
            {/* Single Action Dialog */}
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
          Update Transaction Status
        </DialogTitle>
        <DialogContent>
          {selectedTx && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                Transaction: {selectedTx.transactionHash.slice(0, 20)}...
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                Nonprofit: {selectedTx.nonprofitName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                Fraud Score: <span style={{ color: getFraudScoreColor(selectedTx.fraudScore), fontWeight: 700 }}>
                  {(selectedTx.fraudScore * 100).toFixed(0)}%
                </span>
              </Typography>

              {selectedTx.riskFlags && selectedTx.riskFlags.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                    Risk Flags:
                  </Typography>
                  {selectedTx.riskFlags.map((flag, idx) => (
                    <Chip 
                      key={idx}
                      label={flag}
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        mr: 1,
                        mb: 1,
                        fontSize: '0.75rem'
                      }}
                    />
                  ))}
                </Box>
              )}

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Reviewer Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this decision..."
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
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleAction('cleared')}
            disabled={updating}
            variant="contained"
            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669', transform: 'translateY(-2px)' } }}
          >
            Clear
          </Button>
          <Button 
            onClick={() => handleAction('under_review')}
            disabled={updating}
            variant="contained"
            sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706', transform: 'translateY(-2px)' } }}
          >
            Review
          </Button>
          <Button 
            onClick={() => handleAction('blocked')}
            disabled={updating}
            variant="contained"
            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c', transform: 'translateY(-2px)' } }}
          >
            Block
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog 
        open={bulkDialogOpen} 
        onClose={() => setBulkDialogOpen(false)}
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
          Bulk Update {selectedIds.size} Transactions
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
              You are about to update {selectedIds.size} transaction(s). This action will apply the same status and notes to all selected transactions.
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel sx={{ color: '#94a3b8', '&.Mui-focused': { color: '#14b8a6' } }}>
                Select Action
              </InputLabel>
              <Select
                value={bulkActionType || ''}
                onChange={(e) => setBulkActionType(e.target.value as any)}
                sx={{
                  color: '#ffffff',
                  bgcolor: 'rgba(15, 23, 42, 0.8)',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(20, 184, 166, 0.3)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#14b8a6' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#14b8a6' },
                  '& .MuiSvgIcon-root': { color: '#14b8a6' }
                }}
              >
                <MenuItem value="cleared" sx={{ color: '#10b981' }}>Clear All</MenuItem>
                <MenuItem value="under_review" sx={{ color: '#f59e0b' }}>Mark for Review</MenuItem>
                <MenuItem value="blocked" sx={{ color: '#dc2626' }}>Block All</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Bulk Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for all selected transactions..."
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
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setBulkDialogOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleBulkAction}
            disabled={updating || !bulkActionType}
            variant="contained"
            sx={{
              bgcolor: bulkActionType === 'blocked' ? '#dc2626' : bulkActionType === 'under_review' ? '#f59e0b' : '#10b981',
              '&:hover': {
                bgcolor: bulkActionType === 'blocked' ? '#b91c1c' : bulkActionType === 'under_review' ? '#d97706' : '#059669',
                transform: 'translateY(-2px)'
              }
            }}
          >
            {updating ? 'Processing...' : `Apply to ${selectedIds.size} Transaction${selectedIds.size > 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Details Dialog */}
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
          Transaction Details
        </DialogTitle>
        <DialogContent>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Box className="loading-spinner" />
            </Box>
          ) : txDetails ? (
            <Box sx={{ mt: 2 }} className="fade-in">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Transaction Hash</Typography>
                  <Typography sx={{ color: '#14b8a6', fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                    {txDetails.transactionHash}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Donor Address</Typography>
                  <Typography sx={{ color: '#ffffff', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {txDetails.donorAddress}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Nonprofit</Typography>
                  <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
                    {txDetails.nonprofitName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    EIN: {txDetails.nonprofitEIN}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Amount</Typography>
                  <Typography sx={{ color: '#10b981', fontWeight: 700, fontSize: '1.2rem' }}>
                    {txDetails.amount.toFixed(4)} ETH
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Fraud Score</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ color: getFraudScoreColor(txDetails.fraudScore), fontWeight: 700, fontSize: '1.2rem' }}>
                      {(txDetails.fraudScore * 100).toFixed(0)}%
                    </Typography>
                    <Chip 
                      label={txDetails.analysis.riskLevel}
                      sx={{ 
                        bgcolor: `${getFraudScoreColor(txDetails.fraudScore)}30`,
                        color: getFraudScoreColor(txDetails.fraudScore),
                        fontWeight: 700
                      }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>Status</Typography>
                  <Chip 
                    label={txDetails.status.replace('_', ' ').toUpperCase()}
                    sx={{ 
                      bgcolor: `${getStatusColor(txDetails.status)}30`,
                      color: getStatusColor(txDetails.status),
                      fontWeight: 700,
                      mt: 1
                    }}
                  />
                </Grid>

                {txDetails.riskFlags && txDetails.riskFlags.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                      Risk Flags ({txDetails.riskFlags.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {txDetails.riskFlags.map((flag, idx) => (
                        <Chip 
                          key={idx}
                          label={flag}
                          sx={{ 
                            bgcolor: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            fontSize: '0.8rem'
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}

                {txDetails.activityLogs && txDetails.activityLogs.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, mt: 2 }}>
                      Activity Timeline ({txDetails.activityLogs.length})
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                      {txDetails.activityLogs.map((log, idx) => (
                        <Box 
                          key={idx}
                          className="fade-in"
                          sx={{ 
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 2,
                            mb: 2,
                            pb: 2,
                            borderBottom: idx < txDetails.activityLogs.length - 1 ? '1px solid rgba(148, 163, 184, 0.1)' : 'none'
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
          <Button onClick={() => setDetailsOpen(false)} sx={{ color: '#94a3b8' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminFlaggedTransactions;



