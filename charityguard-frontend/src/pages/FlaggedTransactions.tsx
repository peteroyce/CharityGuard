import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  Tooltip,
  LinearProgress,
  keyframes
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  Warning,
  Visibility,
  Edit,
  TrendingUp,
  Flag,
  AccountBalance,
  Schedule,
  Block
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

interface FlaggedTransaction {
  _id: string;
  transactionHash: string;
  donorAddress: string;
  nonprofitName: string;
  nonprofitEIN: string;
  amount: number;
  timestamp: string;
  fraudScore: number;
  riskFlags: string[];
  status: 'flagged' | 'under_review' | 'cleared' | 'blocked';
  reviewerNotes?: string;
  lastUpdated?: string;
}

interface StatsData {
  total: number;
  underReview: number;
  blocked: number;
  totalAmount: number;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const FlaggedTransactions: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminAuth();

  const [transactions, setTransactions] = useState<FlaggedTransaction[]>([]);
  const [stats, setStats] = useState<StatsData>({ total: 0, underReview: 0, blocked: 0, totalAmount: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<FlaggedTransaction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);

  // Edit states
  const [editStatus, setEditStatus] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchFlaggedTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`${API_BASE_URL}/api/transactions/flagged?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch flagged transactions');
      }

      const data = await response.json();
      
      if (data.success) {
        const txData = data.data || data.transactions || [];
        setTransactions(txData);
        
        setStats({
          total: data.stats?.total || txData.length,
          underReview: data.stats?.underReview || txData.filter((t: FlaggedTransaction) => t.status === 'under_review').length,
          blocked: data.stats?.blocked || txData.filter((t: FlaggedTransaction) => t.status === 'blocked').length,
          totalAmount: data.stats?.totalAmount || txData.reduce((sum: number, t: FlaggedTransaction) => sum + t.amount, 0)
        });
        setError('');
      } else {
        throw new Error(data.message || 'Failed to load transactions');
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error fetching flagged transactions:', err);
      setError(err.message || 'Failed to fetch flagged transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchFlaggedTransactions();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchFlaggedTransactions();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchFlaggedTransactions]);

  const handleViewDetails = (transaction: FlaggedTransaction) => {
    setSelectedTransaction(transaction);
    setEditStatus(transaction.status);
    setEditNotes(transaction.reviewerNotes || '');
    setDetailsOpen(true);
  };

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;

    setUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/${selectedTransaction._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          reviewerNotes: editNotes
        })
      });

      const data = await response.json();

      if (data.success) {
        setDetailsOpen(false);
        fetchFlaggedTransactions();
        setError('');
      } else {
        throw new Error(data.message || 'Failed to update transaction');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update transaction');
    } finally {
      setUpdating(false);
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'flagged': return 'Flagged';
      case 'under_review': return 'Under Review';
      case 'cleared': return 'Cleared';
      case 'blocked': return 'Blocked';
      default: return status;
    }
  };

  const getFraudScoreColor = (score: number) => {
    if (score >= 0.8) return '#dc2626';
    if (score >= 0.6) return '#ef4444';
    if (score >= 0.4) return '#f59e0b';
    if (score >= 0.2) return '#eab308';
    return '#10b981';
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={() => navigate('/')} 
              sx={{ 
                color: '#14b8a6',
                bgcolor: 'rgba(20, 184, 166, 0.1)',
                '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.2)' }
              }}
            >
              <ArrowBack />
            </IconButton>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Warning sx={{ color: '#ef4444', fontSize: 40 }} />
                <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 800 }}>
                  Flagged Transactions
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: '#94a3b8', mt: 0.5 }}>
                Suspicious activities detected by AI fraud detection system
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
            <Tooltip title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}>
              <IconButton 
                onClick={() => setAutoRefresh(!autoRefresh)}
                sx={{ 
                  color: autoRefresh ? '#10b981' : '#64748b',
                  animation: autoRefresh ? `${pulseAnimation} 2s infinite` : 'none'
                }}
              >
                <Schedule />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh Now">
              <IconButton 
                onClick={fetchFlaggedTransactions} 
                disabled={loading}
                sx={{ 
                  color: '#14b8a6', 
                  bgcolor: 'rgba(20, 184, 166, 0.1)',
                  '&:hover': { 
                    bgcolor: 'rgba(20, 184, 166, 0.2)',
                    transform: 'rotate(180deg)',
                    transition: 'transform 0.6s ease'
                  }
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(15, 23, 42, 0.95))',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 4
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" sx={{ color: '#ef4444', fontWeight: 800 }}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                      Total Flagged
                    </Typography>
                  </Box>
                  <Flag sx={{ fontSize: 48, color: '#ef4444', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(15, 23, 42, 0.95))',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 4
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" sx={{ color: '#f59e0b', fontWeight: 800 }}>
                      {stats.underReview}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                      Under Review
                    </Typography>
                  </Box>
                  <Visibility sx={{ fontSize: 48, color: '#f59e0b', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(15, 23, 42, 0.95))',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: 4
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" sx={{ color: '#dc2626', fontWeight: 800 }}>
                      {stats.blocked}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                      Blocked
                    </Typography>
                  </Box>
                  <Block sx={{ fontSize: 48, color: '#dc2626', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(15, 23, 42, 0.95))',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              borderRadius: 4
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h3" sx={{ color: '#14b8a6', fontWeight: 800 }}>
                      {stats.totalAmount.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                      Total Flagged Amount (ETH)
                    </Typography>
                  </Box>
                  <AccountBalance sx={{ fontSize: 48, color: '#14b8a6', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter Chips */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          {['all', 'flagged', 'under_review', 'cleared', 'blocked'].map((status) => (
            <Chip
              key={status}
              label={status === 'all' ? 'All' : getStatusLabel(status)}
              onClick={() => setFilterStatus(status)}
              sx={{
                bgcolor: filterStatus === status ? getStatusColor(status) : 'rgba(15, 23, 42, 0.9)',
                color: '#ffffff',
                border: `2px solid ${filterStatus === status ? getStatusColor(status) : 'rgba(148, 163, 184, 0.3)'}`,
                fontWeight: 700,
                fontSize: '1rem',
                px: 3,
                py: 2,
                '&:hover': {
                  bgcolor: filterStatus === status ? getStatusColor(status) : 'rgba(20, 184, 166, 0.2)'
                }
              }}
            />
          ))}
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 4, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5' }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && transactions.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
            <CircularProgress sx={{ color: '#14b8a6' }} size={60} />
          </Box>
        ) : transactions.length === 0 ? (
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            borderRadius: 4,
            p: 8,
            textAlign: 'center'
          }}>
            <TrendingUp sx={{ fontSize: 80, color: '#10b981', mb: 2 }} />
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700, mb: 2 }}>
              No Flagged Transactions
            </Typography>
            <Typography variant="body1" sx={{ color: '#94a3b8' }}>
              All transactions are clean! Our AI fraud detection system is monitoring continuously.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {transactions.map((transaction) => (
              <Grid item xs={12} key={transaction._id}>
                <Card sx={{
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
                  border: `2px solid ${getStatusColor(transaction.status)}40`,
                  borderRadius: 4,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 20px 60px ${getStatusColor(transaction.status)}30`,
                    border: `2px solid ${getStatusColor(transaction.status)}`
                  }
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={3}>
                      {/* Left Section */}
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                          <Avatar sx={{ 
                            width: 60, 
                            height: 60, 
                            bgcolor: getStatusColor(transaction.status),
                            fontSize: '1.5rem'
                          }}>
                            {transaction.nonprofitName.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 700, mb: 0.5 }}>
                              {transaction.nonprofitName}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                              EIN: {transaction.nonprofitEIN}
                            </Typography>
                          </Box>
                          <Chip 
                            label={getStatusLabel(transaction.status)}
                            sx={{ 
                              bgcolor: getStatusColor(transaction.status),
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.9rem'
                            }}
                          />
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                            Transaction Hash
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            color: '#14b8a6', 
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            wordBreak: 'break-all'
                          }}>
                            {transaction.transactionHash}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                            Donor Address
                          </Typography>
                          <Typography variant="body1" sx={{ 
                            color: '#cbd5e1', 
                            fontFamily: 'monospace',
                            fontSize: '0.9rem'
                          }}>
                            {transaction.donorAddress}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                            Timestamp
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#cbd5e1' }}>
                            {new Date(transaction.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Right Section */}
                      <Grid item xs={12} md={6}>
                        <Box sx={{ 
                          bgcolor: 'rgba(15, 23, 42, 0.8)',
                          p: 3,
                          borderRadius: 3,
                          border: '1px solid rgba(20, 184, 166, 0.2)',
                          mb: 3
                        }}>
                          <Typography variant="h3" sx={{ color: '#14b8a6', fontWeight: 800, mb: 1 }}>
                            {transaction.amount.toFixed(4)} ETH
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            Transaction Amount
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                              Fraud Score
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              color: getFraudScoreColor(transaction.fraudScore),
                              fontWeight: 700
                            }}>
                              {(transaction.fraudScore * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={transaction.fraudScore * 100}
                            sx={{
                              height: 10,
                              borderRadius: 5,
                              bgcolor: 'rgba(148, 163, 184, 0.2)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getFraudScoreColor(transaction.fraudScore),
                                borderRadius: 5
                              }
                            }}
                          />
                        </Box>

                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, mb: 1 }}>
                            Risk Flags ({transaction.riskFlags.length})
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {transaction.riskFlags.map((flag, idx) => (
                              <Chip
                                key={idx}
                                label={flag}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(251, 146, 60, 0.15)',
                                  color: '#fb923c',
                                  border: '1px solid rgba(251, 146, 60, 0.3)',
                                  fontSize: '0.8rem'
                                }}
                              />
                            ))}
                          </Box>
                        </Box>

                        {isAdmin && (
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Edit />}
                            onClick={() => handleViewDetails(transaction)}
                            sx={{
                              background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                              fontWeight: 700,
                              py: 1.5,
                              fontSize: '1rem',
                              borderRadius: 3,
                              '&:hover': {
                                background: 'linear-gradient(135deg, #0d9488, #0f766e)'
                              }
                            }}
                          >
                            Review & Update Status
                          </Button>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Details/Edit Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(20, 184, 166, 0.3)',
            borderRadius: 4
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff', fontWeight: 700, fontSize: '1.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
          Review Transaction
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedTransaction && (
            <Box>
              <Box sx={{ 
                bgcolor: 'rgba(20, 184, 166, 0.1)',
                p: 3,
                borderRadius: 3,
                mb: 3,
                border: '1px solid rgba(20, 184, 166, 0.3)'
              }}>
                <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
                  {selectedTransaction.nonprofitName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  EIN: {selectedTransaction.nonprofitEIN}
                </Typography>
                <Divider sx={{ my: 2, borderColor: 'rgba(148, 163, 184, 0.2)' }} />
                <Typography variant="h4" sx={{ color: '#14b8a6', fontWeight: 800 }}>
                  {selectedTransaction.amount.toFixed(4)} ETH
                </Typography>
              </Box>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ color: '#94a3b8', '&.Mui-focused': { color: '#14b8a6' } }}>
                  Status
                </InputLabel>
                <Select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  sx={{
                    bgcolor: 'rgba(15, 23, 42, 0.8)',
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(20, 184, 166, 0.3)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#14b8a6'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#14b8a6'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        bgcolor: 'rgba(15, 23, 42, 0.98)',
                        border: '1px solid rgba(20, 184, 166, 0.3)',
                        '& .MuiMenuItem-root': {
                          color: '#ffffff',
                          '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.2)' }
                        }
                      }
                    }
                  }}
                >
                  <MenuItem value="flagged">Flagged</MenuItem>
                  <MenuItem value="under_review">Under Review</MenuItem>
                  <MenuItem value="cleared">Cleared</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Reviewer Notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add your review comments here..."
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

              {selectedTransaction.reviewerNotes && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(148, 163, 184, 0.1)', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                    Previous Notes:
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#cbd5e1' }}>
                    {selectedTransaction.reviewerNotes}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
          <Button 
            onClick={() => setDetailsOpen(false)}
            sx={{ color: '#94a3b8' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateTransaction}
            variant="contained"
            disabled={updating}
            sx={{
              background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
              fontWeight: 700,
              '&:hover': {
                background: 'linear-gradient(135deg, #0d9488, #0f766e)'
              }
            }}
          >
            {updating ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Update Transaction'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FlaggedTransactions;
