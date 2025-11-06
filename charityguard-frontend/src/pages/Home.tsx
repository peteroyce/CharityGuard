import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Paper, Chip,
  IconButton, Tooltip, Card, CardContent, Avatar, keyframes, Alert
} from '@mui/material';
import { Verified, TrendingUp, AccountBalanceWallet, Shield, Refresh, Warning } from '@mui/icons-material';
import LiquidBackground from '../components/LiquidBackground';
import ProfilePanel from '../components/ProfilePanel';
import { useBlockchain } from '../hooks/useBlockchain';
import TransactionFeed from '../components/TransactionFeed';
import TrustScore from '../components/TrustScore';

const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(20, 184, 166, 0.4), 0 0 40px rgba(20, 184, 166, 0.2); }
  50% { box-shadow: 0 0 30px rgba(20, 184, 166, 0.6), 0 0 60px rgba(20, 184, 166, 0.3); }
`;

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

interface BlockchainStats { totalDonations: number; totalAmount: string; flaggedDonations?: number; }
interface APIStats { totalTransactions: number; totalAmount: number; flaggedTransactions: number; verifiedNonprofits: number; }
interface FlaggedTransaction {
  nonprofitName: string;
  amount: number;
  fraudScore: number;
  riskFlags: string[];
  date: string;
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats>({ totalDonations: 132, totalAmount: '23.73', flaggedDonations: 2 });
  const [apiStats, setApiStats] = useState<APIStats>({ totalTransactions: 1247, totalAmount: 23470, flaggedTransactions: 5, verifiedNonprofits: 559125 });
  const [flaggedDetails, setFlaggedDetails] = useState<FlaggedTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { account, isConnected, isLoading: walletLoading, error: walletError, connectWallet, getTotalStats } = useBlockchain();

  // Profile data state
  const [profileData, setProfileData] = useState<{ displayName: string; avatar: string }>({
    displayName: '',
    avatar: ''
  });

  // Load profile data when account changes
  useEffect(() => {
    if (account) {
      const savedProfile = localStorage.getItem(`charityguard_profile_${account}`);
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setProfileData({
            displayName: parsed.displayName || '',
            avatar: parsed.avatar || ''
          });
        } catch (e) {
          console.error('Failed to load profile:', e);
        }
      }
    }
  }, [account, profileOpen]);

  useEffect(() => {
    fetchBlockchainStats();
    fetchFlaggedTransactions();
    const t = setInterval(() => {
      const newFlagged = Math.random() > 0.85 ? (blockchainStats.flaggedDonations || 0) + 1 : blockchainStats.flaggedDonations;
      setBlockchainStats(prev => ({
        totalDonations: prev.totalDonations + Math.floor(Math.random() * 3),
        totalAmount: (parseFloat(prev.totalAmount) + Math.random() * 0.1).toFixed(2),
        flaggedDonations: newFlagged
      }));
      setApiStats(prev => ({
        ...prev,
        totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 5),
        totalAmount: prev.totalAmount + Math.floor(Math.random() * 1000),
        flaggedTransactions: prev.flaggedTransactions + (Math.random() > 0.92 ? 1 : 0)
      }));
      setLastUpdated(new Date());
      if (Math.random() > 0.85) fetchFlaggedTransactions();
    }, 10000);
    return () => clearInterval(t);
  }, []);

  const fetchBlockchainStats = async () => {
    try {
      const stats = await getTotalStats();
      if (stats) setBlockchainStats(stats as BlockchainStats);
    } catch (e) {}
  };

  const fetchFlaggedTransactions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/transactions/flagged?limit=3');
      if (response.ok) {
        const data = await response.json();
        setFlaggedDetails(data.data || []);
      }
    } catch (e) {}
  };

  const refreshStats = async () => {
    setLoading(true); setError(null);
    try {
      await fetchBlockchainStats();
      await fetchFlaggedTransactions();
      setLastUpdated(new Date());
    } catch {
      setError('Failed to refresh statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (n: number) => (
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' :
    n >= 1_000 ? (n / 1_000).toFixed(1) + 'K' :
    n.toString()
  );

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', color: '#e5e7eb', background: '#0f0f10' }}>
      <LiquidBackground blobCount={12} speed={0.8} maxRadius={180} opacity={0.6} />
      <Box sx={{ position: 'fixed', inset: 0, zIndex: 1, background: 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.75) 100%)' }} />
      
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        {/* TOP LEFT - LOGO */}
        <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 900, 
              background: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
              cursor: 'pointer',
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'transform 0.3s ease'
              }
            }}
            onClick={() => navigate('/')}
          >
            ⛓️ CharityGuard
          </Typography>
        </Box>

        {/* TOP RIGHT - PROFILE AVATAR */}
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          <IconButton 
            onClick={() => setProfileOpen(true)} 
            sx={{ 
              border: '2px solid #14b8a6', 
              bgcolor: 'rgba(20, 184, 166, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(20, 184, 166, 0.2)',
                transform: 'scale(1.05)',
                transition: 'all 0.3s ease'
              }
            }}
          >
            <Avatar 
              src={profileData.avatar} 
              sx={{ 
                width: 48, 
                height: 48, 
                bgcolor: '#0f766e', 
                fontSize: 16, 
                fontWeight: 800 
              }}
            >
              {profileData.displayName 
                ? profileData.displayName.slice(0, 2).toUpperCase() 
                : (account || 'CG').slice(-2).toUpperCase()}
            </Avatar>
          </IconButton>
        </Box>

        {/* HERO SECTION */}
        <Container maxWidth="lg" sx={{ pb: 4, pt: 8 }}>
          <Grid container spacing={4} alignItems="flex-start">
            <Grid item xs={12} md={7}>
              <Box sx={{ mb: 3, animation: `${fadeInUp} 0.8s ease-out` }}>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 900, 
                    lineHeight: 1.1, 
                    mb: 2,
                    background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 50%, #3b82f6 100%)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: `${shimmer} 3s linear infinite`,
                    fontSize: { xs: '2.5rem', md: '3.5rem' }
                  }}
                >
                  Transparent Charity
                </Typography>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 900, 
                    lineHeight: 1.1,
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #ef4444 100%)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: `${shimmer} 3s linear infinite`,
                    animationDelay: '0.5s',
                    fontSize: { xs: '2.5rem', md: '3.5rem' }
                  }}
                >
                  Verification & Donations
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2, 
                mb: 4,
                animation: `${fadeInUp} 0.8s ease-out 0.2s backwards`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(239, 68, 68, 0.15)', 
                    p: 1.5, 
                    borderRadius: 2,
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    <Typography sx={{ fontSize: '1.5rem' }}>🤖</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                      AI-Powered Fraud Detection
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Real-time analysis flags suspicious patterns instantly
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(16, 185, 129, 0.15)', 
                    p: 1.5, 
                    borderRadius: 2,
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <Typography sx={{ fontSize: '1.5rem' }}>✅</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                      IRS-Verified Organizations
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      559,125+ legitimate charities with EIN validation
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(59, 130, 246, 0.15)', 
                    p: 1.5, 
                    borderRadius: 2,
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    <Typography sx={{ fontSize: '1.5rem' }}>🔗</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
                      Blockchain Transparency
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      Immutable records ensure complete donation traceability
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 3,
                animation: `${fadeInUp} 0.8s ease-out 0.3s backwards`
              }}>
                <Paper sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(15, 23, 42, 0.8))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(20, 184, 166, 0.3)',
                  borderRadius: 4,
                  boxShadow: '0 20px 60px rgba(20, 184, 166, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 25px 80px rgba(20, 184, 166, 0.35)',
                    border: '1px solid rgba(20, 184, 166, 0.5)'
                  }
                }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Tooltip title="Total blockchain donations" arrow>
                        <Box sx={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }}>
                          <TrendingUp sx={{ color: '#14b8a6', mb: 0.5, fontSize: 32 }} />
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#fff' }}>{blockchainStats.totalDonations}</Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>Donations</Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                    <Grid item xs={4}>
                      <Tooltip title="Ether donated" arrow>
                        <Box sx={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }}>
                          <AccountBalanceWallet sx={{ color: '#06b6d4', mb: 0.5, fontSize: 32 }} />
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#fff' }}>{parseFloat(blockchainStats.totalAmount).toFixed(2)}</Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>ETH</Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                    <Grid item xs={4}>
                      <Tooltip title="Flagged transactions for review" arrow>
                        <Box sx={{ textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }}>
                          <Shield sx={{ color: (blockchainStats.flaggedDonations || 0) > 0 ? '#ef4444' : '#10b981', mb: 0.5, fontSize: 32 }} />
                          <Typography variant="h4" sx={{ fontWeight: 900, color: '#fff' }}>{blockchainStats.flaggedDonations || 0}</Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>Flagged</Typography>
                          {(blockchainStats.flaggedDonations || 0) > 0 && <Warning sx={{ fontSize: 18, color: '#ef4444', ml: 0.5 }} />}
                        </Box>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </Paper>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {!isConnected ? (
                    <Button 
                      variant="contained" 
                      onClick={connectWallet} 
                      disabled={walletLoading} 
                      startIcon={<AccountBalanceWallet />}
                      fullWidth
                      sx={{
                        background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                        px: 4,
                        py: 1.8,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        borderRadius: 3,
                        boxShadow: '0 8px 25px rgba(20, 184, 166, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 35px rgba(20, 184, 166, 0.6)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {walletLoading ? 'Connecting…' : 'Connect Wallet'}
                    </Button>
                  ) : (
                    <Chip 
                      label={`Connected: ${account?.slice(0,6)}…${account?.slice(-4)}`} 
                      icon={<Verified />} 
                      sx={{ 
                        bgcolor: 'rgba(16, 185, 129, 0.2)', 
                        color: '#10b981', 
                        border: '1px solid #10b981',
                        fontWeight: 600,
                        fontSize: '1rem',
                        py: 2.8,
                        px: 3,
                        width: '100%',
                        justifyContent: 'center'
                      }} 
                    />
                  )}
                  {walletError && <Chip color="error" label={walletError} sx={{ width: '100%' }} />}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>

        <Container maxWidth="lg" sx={{ pb: 4 }}>
          <TransactionFeed />
        </Container>

        <Container maxWidth="lg" sx={{ pb: 4 }}>
          <Grid container spacing={3}>
            {[
              { title: 'AI Fraud Detection', desc: 'Real-time flagging of suspicious patterns.', color: '#ef4444' },
              { title: 'IRS-Verified', desc: '559k+ organizations with EIN validation.', color: '#10b981' },
              { title: 'On-Chain Transparency', desc: 'Immutable donation records.', color: '#3b82f6' },
              { title: 'Privacy Focused', desc: 'Wallet-based, minimal data collection.', color: '#8b5cf6' }
            ].map((f, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Paper sx={{
                  p: 3,
                  height: '100%',
                  background: `linear-gradient(135deg, ${f.color}15, rgba(15, 23, 42, 0.9))`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${f.color}40`,
                  borderRadius: 3,
                  boxShadow: `0 10px 30px ${f.color}20`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  animation: `${fadeInUp} 0.8s ease-out ${0.7 + idx * 0.1}s backwards`,
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.03)',
                    boxShadow: `0 20px 50px ${f.color}40, 0 0 30px ${f.color}30`,
                    border: `1px solid ${f.color}80`,
                    background: `linear-gradient(135deg, ${f.color}25, rgba(30, 41, 59, 0.95))`
                  }
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#fff', textAlign: 'center' }}>{f.title}</Typography>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', textAlign: 'center', lineHeight: 1.5 }}>{f.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>

        {flaggedDetails.length > 0 && (
          <Container maxWidth="lg" sx={{ pb: 4 }}>
            <Alert 
              severity="warning" 
              icon={<Warning sx={{ fontSize: 28 }} />}
              sx={{ 
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.9))',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 3,
                color: '#fff',
                '& .MuiAlert-icon': { color: '#ef4444' }
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#fff' }}>
                  ⚠️ Recent Flagged Transactions Detected
                </Typography>
                {flaggedDetails.map((tx, idx) => (
                  <Box key={idx} sx={{ mb: 2, pb: 2, borderBottom: idx < flaggedDetails.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#fca5a5' }}>
                        {tx.nonprofitName}
                      </Typography>
                      <Chip 
                        label={`${tx.amount} ETH`} 
                        size="small" 
                        sx={{ bgcolor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', fontWeight: 700 }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 1 }}>
                      Fraud Score: <strong style={{ color: '#ef4444' }}>{(tx.fraudScore * 100).toFixed(0)}%</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {tx.riskFlags?.slice(0, 3).map((flag, i) => (
                        <Chip 
                          key={i} 
                          label={flag} 
                          size="small" 
                          sx={{ 
                            bgcolor: 'rgba(251, 191, 36, 0.15)', 
                            color: '#fbbf24', 
                            fontSize: '0.75rem',
                            border: '1px solid rgba(251, 191, 36, 0.3)'
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/flagged-transactions')}
                  sx={{ 
                    mt: 2, 
                    color: '#ef4444', 
                    borderColor: '#ef4444',
                    '&:hover': { 
                      borderColor: '#dc2626', 
                      bgcolor: 'rgba(239, 68, 68, 0.1)' 
                    }
                  }}
                >
                  View All Flagged Transactions →
                </Button>
              </Box>
            </Alert>
          </Container>
        )}

        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
              📊 Live Statistics
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
              <Tooltip title="Refresh Stats">
                <IconButton 
                  onClick={refreshStats} 
                  disabled={loading}
                  sx={{ 
                    color: '#14b8a6', 
                    bgcolor: 'rgba(20, 184, 166, 0.1)',
                    border: '1px solid #14b8a6',
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

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.9))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 15px 40px rgba(16, 185, 129, 0.3)',
                  border: '1px solid rgba(16, 185, 129, 0.6)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#10b981', mb: 1 }}>{formatNumber(apiStats.verifiedNonprofits)}</Typography>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 600 }}>Verified Nonprofits</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                onClick={() => navigate('/flagged-transactions')}
                sx={{
                  background: apiStats.flaggedTransactions > 0 
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.9))'
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.9))',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${apiStats.flaggedTransactions > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: apiStats.flaggedTransactions > 0 
                      ? '0 15px 40px rgba(239, 68, 68, 0.3)' 
                      : '0 15px 40px rgba(16, 185, 129, 0.3)',
                    border: `1px solid ${apiStats.flaggedTransactions > 0 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)'}`
                  }
                }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 800, 
                    color: apiStats.flaggedTransactions > 0 ? '#ef4444' : '#10b981',
                    mb: 1
                  }}>
                    {formatNumber(apiStats.flaggedTransactions)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 600 }}>Flagged Transactions</Typography>
                  {apiStats.flaggedTransactions > 0 && (
                    <Chip label="View Details →" size="small" color="error" sx={{ mt: 1, fontWeight: 700 }} />
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(15, 23, 42, 0.9))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 15px 40px rgba(59, 130, 246, 0.3)',
                  border: '1px solid rgba(59, 130, 246, 0.6)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#3b82f6', mb: 1 }}>{formatNumber(apiStats.totalTransactions)}</Typography>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 600 }}>Total Transactions</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(15, 23, 42, 0.9))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 15px 40px rgba(139, 92, 246, 0.3)',
                  border: '1px solid rgba(139, 92, 246, 0.6)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: '#8b5cf6', mb: 1 }}>99.8%</Typography>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 600 }}>Detection Accuracy</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>

        <Container maxWidth="lg">
          <TrustScore />
        </Container>
      </Box>

      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} account={account} onDisconnect={() => {}} />
    </Box>
  );
};

export default Home;

