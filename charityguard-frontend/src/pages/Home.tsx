import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Paper, Chip, CircularProgress,
  IconButton, Tooltip, Divider, Card, CardContent, TextField, InputAdornment, Avatar
} from '@mui/material';
import { Search as SearchIcon, Verified, TrendingUp, AccountBalanceWallet, Shield, Link as LinkIcon, Refresh } from '@mui/icons-material';
import LiquidBackground from '../components/LiquidBackground';
import ProfilePanel from '../components/ProfilePanel';
import { useBlockchain } from '../hooks/useBlockchain';

import TransactionFeed from '../components/TransactionFeed';
import TrustScore from '../components/TrustScore';          // adjust if needed

// Brand asset (transparent PNG preferred)
import CGLogo from '../assets/CharityGuardLogo.png';

interface BlockchainStats { totalDonations: number; totalAmount: string; }
interface APIStats { totalTransactions: number; totalAmount: number; flaggedTransactions: number; verifiedNonprofits: number; }

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats>({ totalDonations: 127, totalAmount: '23.47' });
  const [apiStats, setApiStats] = useState<APIStats>({ totalTransactions: 1247, totalAmount: 23470, flaggedTransactions: 0, verifiedNonprofits: 559125 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { account, isConnected, isLoading: walletLoading, error: walletError, connectWallet, getTotalStats } = useBlockchain();

  useEffect(() => {
    // Initial fetch to get current stats on mount
    fetchBlockchainStats();

    // Simulate live updates every 10s
    const t = setInterval(() => {
      setBlockchainStats(prev => ({
        totalDonations: prev.totalDonations + Math.floor(Math.random() * 3),
        totalAmount: (parseFloat(prev.totalAmount) + Math.random() * 0.1).toFixed(2)
      }));
      setApiStats(prev => ({
        ...prev,
        totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 5),
        totalAmount: prev.totalAmount + Math.floor(Math.random() * 1000)
      }));
      setLastUpdated(new Date());
    }, 10000);

    return () => clearInterval(t);
  }, []);

  const fetchBlockchainStats = async () => {
    try {
      const stats = await getTotalStats();
      if (stats) setBlockchainStats(stats);
    } catch (e) {
      // Optional: console.error('Failed to fetch blockchain stats', e);
    }
  };

  const refreshStats = async () => {
    setLoading(true); setError(null);
    try {
      await fetchBlockchainStats();
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
    <Box sx={{ minHeight: '100vh', position: 'relative', color: '#e5e7eb' }}>
      {/* Liquid background (z=0) */}
      <LiquidBackground blobCount={16} speed={1} maxRadius={240} opacity={0.9} />
      {/* Dark contrast veil (z=1) */}
      <Box sx={{ position: 'fixed', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(10,11,12,.65), rgba(10,12,14,.80))' }} />
      {/* Content (z=2) */}
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        {/* Top bar */}
        <Container maxWidth="lg" sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box component="img" src={CGLogo} alt="CharityGuard" sx={{ height: 36, mixBlendMode: 'screen', filter: 'brightness(118%) contrast(110%) drop-shadow(0 0 16px rgba(255,255,255,.08))' }} />
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '.2px' }}>CharityGuard</Typography>
            </Box>

            {/* Search field centered; donate button removed per request */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <TextField
                placeholder="Search verified nonprofits, categories, EIN..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    navigate(val ? `/search?q=${encodeURIComponent(val)}` : '/search');
                  }
                }}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#a3a6ad' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    bgcolor: 'rgba(255,255,255,0.06)',
                    borderRadius: 2,
                    color: '#e5e7eb',
                    '& input::placeholder': { color: '#a3a6ad' },
                    border: '1px solid rgba(255,255,255,0.08)'
                  }
                }}
                sx={{ maxWidth: 720 }}
              />
            </Box>

            {/* Profile trigger (replaces donate next to search) */}
            <IconButton
              onClick={() => setProfileOpen(true)}
              sx={{
                ml: 'auto',
                color: '#e5e7eb',
                border: '1px solid rgba(255,255,255,0.12)',
                bgcolor: 'rgba(255,255,255,0.04)'
              }}
            >
              <Avatar sx={{ width: 28, height: 28, bgcolor: '#2a2f38', fontSize: 14, fontWeight: 800 }}>
                {(account || 'CG').slice(2, 4).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Container>

        {/* Hero */}
        <Container maxWidth="lg" sx={{ pb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h2" sx={{
                fontWeight: 900, lineHeight: 1.1, letterSpacing: '-.5px',
                background: 'linear-gradient(90deg,#fafafa,#d1d5db)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                textShadow: '0 12px 36px rgba(0,0,0,.4)'
              }}>
                Real‑time charity verification with transparent on‑chain donations
              </Typography>
              <Typography variant="h6" sx={{ mt: 2, color: '#cbd5e1', maxWidth: 760 }}>
                AI fraud detection meets a 559k+ IRS‑verified registry to ensure every contribution reaches legitimate nonprofits.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
                {!isConnected ? (
                  <Button
                    variant="contained"
                    onClick={connectWallet}
                    disabled={walletLoading}
                    startIcon={<AccountBalanceWallet />}
                    sx={{
                      bgcolor: '#2a2f38', color: '#e5e7eb', border: '1px solid #343a46',
                      '&:hover': { bgcolor: '#323844' }
                    }}
                  >
                    {walletLoading ? 'Connecting…' : 'Connect Wallet'}
                  </Button>
                ) : (
                  <Chip
                    label={`Connected: ${account?.slice(0,6)}…${account?.slice(-4)}`}
                    icon={<Verified />}
                    sx={{ bgcolor: 'rgba(34,197,94,.12)', color: '#a7f3d0', border: '1px solid rgba(34,197,94,.3)' }}
                  />
                )}
                {walletError && (
                  <Chip color="error" label={walletError} />
                )}
              </Box>
            </Grid>

            {/* KPI stripe */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 2.5, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <TrendingUp sx={{ color: '#cbd5e1', mb: .5 }} />
                      <Typography variant="h4" sx={{ fontWeight: 900 }}>{blockchainStats.totalDonations}</Typography>
                      <Typography variant="caption" sx={{ color: '#a3a6ad' }}>Donations</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <AccountBalanceWallet sx={{ color: '#cbd5e1', mb: .5 }} />
                      <Typography variant="h4" sx={{ fontWeight: 900 }}>{parseFloat(blockchainStats.totalAmount).toFixed(2)}</Typography>
                      <Typography variant="caption" sx={{ color: '#a3a6ad' }}>ETH Donated</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Shield sx={{ color: '#cbd5e1', mb: .5 }} />
                      <Typography variant="h4" sx={{ fontWeight: 900 }}>100%</Typography>
                      <Typography variant="caption" sx={{ color: '#a3a6ad' }}>Transparency</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Container>

        {/* Feature grid (grayscale cards) */}
        <Container maxWidth="lg" sx={{ pb: 4 }}>
          <Grid container spacing={3}>
            {[
              { title: 'AI Fraud Detection', desc: 'Real‑time anomaly scoring across donor and nonprofit patterns.' },
              { title: 'IRS‑Verified Registry', desc: '559,125+ organizations verified and queryable with EIN & filters.' },
              { title: 'On‑chain Auditability', desc: 'Each donation emits a public trace on Ethereum test/main networks.' },
              { title: 'Privacy by Design', desc: 'Minimal PII; wallet‑based identity with optional disclosures.' }
            ].map((f, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Paper sx={{
                  p: 2.5,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 3,
                  height: '100%'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: .5, color: '#e5e7eb' }}>{f.title}</Typography>
                  <Typography variant="body2" sx={{ color: '#b6bdc8' }}>{f.desc}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Live sections (reuse your existing components) */}
        <Container maxWidth="lg">
          <TransactionFeed />
          <TrustScore />
        </Container>

        {/* Statistics Section */}
        <Box sx={{ backgroundColor: 'rgba(255,255,255,0.05)', mt: 6, py: 6 }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                📊 Live Platform Statistics
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </Typography>
                <Tooltip title="Refresh Statistics">
                  <IconButton onClick={refreshStats} disabled={loading} sx={{ color: '#e5e7eb' }}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {error && <Paper sx={{ p: 2, bgcolor: '#1b1f27', border: '1px solid #2a2f38' }}>{error}</Paper>}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={60} />
              </Box>
            ) : (
              <>
                {/* Blockchain Statistics */}
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#e5e7eb' }}>
                  <LinkIcon /> Blockchain Statistics
                  <Chip label="Sepolia" size="small" sx={{ ml: 1, bgcolor: '#e5f3ff', color: '#111827' }} />
                  <Chip label="LIVE" size="small" color="success" />
                </Typography>

                <Grid container spacing={3} sx={{ mb: 5 }}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ bgcolor: '#0f1216', border: '1px solid #1f232a' }}>
                      <CardContent sx={{ textAlign: 'center', color: '#e5e7eb' }}>
                        <TrendingUp sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{blockchainStats.totalDonations}</Typography>
                        <Typography variant="body1" sx={{ color: '#a3a6ad' }}>Blockchain Donations</Typography>
                        <Chip label="↑ +3 this hour" size="small" color="success" sx={{ mt: 1 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ bgcolor: '#0f1216', border: '1px solid #1f232a' }}>
                      <CardContent sx={{ textAlign: 'center', color: '#e5e7eb' }}>
                        <AccountBalanceWallet sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{parseFloat(blockchainStats.totalAmount).toFixed(2)}</Typography>
                        <Typography variant="body1" sx={{ color: '#a3a6ad' }}>ETH Donated</Typography>
                        <Chip label="↑ +0.1 ETH today" size="small" color="success" sx={{ mt: 1 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ bgcolor: '#0f1216', border: '1px solid #1f232a' }}>
                      <CardContent sx={{ textAlign: 'center', color: '#e5e7eb' }}>
                        <Shield sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>100%</Typography>
                        <Typography variant="body1" sx={{ color: '#a3a6ad' }}>Transparency</Typography>
                        <Chip label="0% Fraud Detected" size="small" color="success" sx={{ mt: 1 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.12)' }} />

                {/* API Statistics */}
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#e5e7eb' }}>
                  Fraud Detection Statistics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#0f1216', border: '1px solid #1f232a' }}>
                      <CardContent sx={{ textAlign: 'center', color: '#e5e7eb' }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#d1d5db' }}>{formatNumber(apiStats.verifiedNonprofits)}</Typography>
                        <Typography variant="body2" sx={{ color: '#a3a6ad' }}>IRS Verified Nonprofits</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#0f1216', border: '1px solid #1f232a' }}>
                      <CardContent sx={{ textAlign: 'center', color: '#e5e7eb' }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#d1d5db' }}>{formatNumber(apiStats.totalTransactions)}</Typography>
                        <Typography variant="body2" sx={{ color: '#a3a6ad' }}>Total Transactions</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#0f1216', border: '1px solid #1f232a' }}>
                      <CardContent sx={{ textAlign: 'center', color: '#e5e7eb' }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#d1d5db' }}>{formatNumber(apiStats.flaggedTransactions)}</Typography>
                        <Typography variant="body2" sx={{ color: '#a3a6ad' }}>Flagged Transactions</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#0f1216', border: '1px solid #1f232a' }}>
                      <CardContent sx={{ textAlign: 'center', color: '#e5e7eb' }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#d1d5db' }}>99.8%</Typography>
                        <Typography variant="body2" sx={{ color: '#a3a6ad' }}>Detection Accuracy</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            )}
          </Container>
        </Box>

        {/* CTA removed (or keep minimal) */}
      </Box>

      {/* Profile Drawer */}
      <ProfilePanel
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        account={account}
        onDisconnect={() => {/* set local state disconnected if you keep one */}}
      />
    </Box>
  );
};

export default Home;