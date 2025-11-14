import React, { useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Container,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  Avatar
} from "@mui/material";
import {
  Search,
  History,
  TrendingUp,
  Person,
  Flag,
  CheckCircle
} from "@mui/icons-material";
import axios from "axios";
import { toast } from 'react-toastify';
import AnimatedCounter from '../components/AnimatedCounter';
import { TableSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

interface ActivityLog {
  _id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
  metadata?: any;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AdminActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, searchTerm]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.append('action', actionFilter);

      const response = await axios.get(`${API_BASE_URL}/api/activity-logs?${params.toString()}`);
      
      if (response.data.success) {
        setLogs(response.data.data || []);
        setStats(response.data.stats || {});
      }
    } catch (err: any) {
      toast.error('Failed to load activity logs');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    if (action.includes('block')) return '#dc2626';
    if (action.includes('clear')) return '#10b981';
    if (action.includes('suspend')) return '#f59e0b';
    if (action.includes('activate')) return '#3b82f6';
    return '#14b8a6';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('block')) return <Flag />;
    if (action.includes('clear')) return <CheckCircle />;
    if (action.includes('user')) return <Person />;
    return <TrendingUp />;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Box className="page-transition" sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', py: 4 }}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 800, mb: 1 }}>
              Activity Logs
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
            <History sx={{ color: '#14b8a6', fontSize: 40 }} />
            <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 800 }}>
              Activity Logs
            </Typography>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} className="stagger-children" sx={{ mb: 4 }}>
          {Object.entries(stats).slice(0, 4).map(([action, count]: any, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card className="hover-lift" sx={{
                background: `linear-gradient(135deg, ${getActionColor(action)}20, rgba(15, 23, 42, 0.95))`,
                border: `1px solid ${getActionColor(action)}50`,
                borderRadius: 3
              }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <AnimatedCounter
                      value={count}
                      variant="h4"
                      sx={{ color: getActionColor(action), fontWeight: 800 }}
                      duration={1200}
                    />
                    <Typography variant="body2" sx={{ color: '#cbd5e1', textTransform: 'capitalize' }}>
                      {action.replace(/_/g, ' ')}
                    </Typography>
                  </Box>
                  <Box sx={{ color: getActionColor(action), opacity: 0.3, fontSize: 48 }}>
                    {getActionIcon(action)}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Search and Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search activity logs..."
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
            {['all', 'transaction_blocked', 'transaction_cleared', 'user_suspended', 'bulk_action'].map((action) => (
              <Chip
                key={action}
                label={action === 'all' ? 'All' : action.replace(/_/g, ' ').toUpperCase()}
                onClick={() => setActionFilter(action)}
                sx={{
                  bgcolor: actionFilter === action ? getActionColor(action) : 'rgba(15, 23, 42, 0.9)',
                  color: '#ffffff',
                  border: `2px solid ${actionFilter === action ? getActionColor(action) : 'rgba(148, 163, 184, 0.3)'}`,
                  fontWeight: 700,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: actionFilter === action ? getActionColor(action) : 'rgba(20, 184, 166, 0.2)',
                    transform: 'translateY(-2px)'
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Activity Logs */}
        <Card className="hover-lift" sx={{ 
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
          border: '1px solid rgba(20, 184, 166, 0.3)',
          borderRadius: 4
        }}>
          <CardContent sx={{ p: 0 }}>
            {filteredLogs.length === 0 ? (
              <EmptyState
                type="no-activity"
                title="No activity logs found"
                description={searchTerm ? 'Try adjusting your search terms' : 'Admin actions will be tracked here'}
              />
            ) : (
              <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {filteredLogs.map((log, idx) => (
                  <Box
                    key={log._id}
                    className="fade-in"
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 3,
                      p: 3,
                      borderBottom: idx < filteredLogs.length - 1 ? '1px solid rgba(148, 163, 184, 0.1)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        bgcolor: 'rgba(20, 184, 166, 0.05)',
                        transform: 'translateX(5px)'
                      }
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        bgcolor: `${getActionColor(log.action)}30`,
                        color: getActionColor(log.action),
                        width: 48,
                        height: 48,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1) rotate(5deg)'
                        }
                      }}
                    >
                      {getActionIcon(log.action)}
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 600 }}>
                            {log.adminName}
                          </Typography>
                          <Chip 
                            label={log.action.replace(/_/g, ' ').toUpperCase()}
                            size="small"
                            sx={{ 
                              bgcolor: `${getActionColor(log.action)}30`,
                              color: getActionColor(log.action),
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              mt: 0.5
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {formatTimestamp(log.timestamp)}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 1 }}>
                        {log.details}
                      </Typography>
                      
                      {log.metadata && (
                        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Target: <span style={{ color: '#94a3b8' }}>{log.targetType}</span>
                          </Typography>
                          {log.metadata.transactionHash && (
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              TX: <span style={{ color: '#14b8a6', fontFamily: 'monospace' }}>
                                {log.metadata.transactionHash.slice(0, 10)}...
                              </span>
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
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

export default AdminActivityLogs;
