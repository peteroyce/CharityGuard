import React, { useMemo, useState } from 'react';
import {
  Box, Drawer, Tabs, Tab, Typography, Divider, IconButton, Avatar, Chip, Button,
  List, ListItem, ListItemText, ListItemIcon, TextField, Grid, Paper
} from '@mui/material';
import {
  Person, Settings, Payment, History, Logout, Security, AccountBalanceWallet, CreditCard
} from '@mui/icons-material';

type Props = {
  open: boolean;
  onClose: () => void;
  account?: string | null;
  onDisconnect?: () => void; // clears cached wallet credentials in app
};

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="h6" sx={{ color: '#e5e7eb', fontWeight: 700 }}>{title}</Typography>
    {subtitle && <Typography variant="body2" sx={{ color: '#9ca3af' }}>{subtitle}</Typography>}
  </Box>
);

const Mask = (addr?: string | null) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'Not connected');

const ProfilePanel: React.FC<Props> = ({ open, onClose, account, onDisconnect }) => {
  const [tab, setTab] = useState(0);
  const [subTabPayments, setSubTabPayments] = useState(0); // 0 Methods, 1 History
  const [subTabSettings, setSubTabSettings] = useState(0); // 0 Security, 1 Notifications, 2 Preferences

  const avatarHue = useMemo(() => (account ? (parseInt(account.slice(2, 6), 16) % 360) : 200), [account]);

  const handleLogout = () => {
    try {
      // Common cached keys across web3 libs
      const keys = [
        'wagmi.store', 'walletconnect', 'WALLETCONNECT_DEEPLINK_CHOICE',
        'WEB3_CONNECT_CACHED_PROVIDER', 'cachedProvider', 'metaMask:connected'
      ];
      keys.forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {}
    onDisconnect?.();
    onClose();
    window.location.reload();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 480, md: 560 },
          background: 'linear-gradient(180deg,#0e1013,#121417)',
          borderLeft: '1px solid #1f232a',
          color: '#e5e7eb'
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: 52, height: 52,
              bgcolor: `hsl(${avatarHue} 70% 45%)`,
              fontWeight: 800,
              border: '2px solid #2a2f38'
            }}
          >
            {(account || 'CG').slice(2, 4).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Profile</Typography>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>{Mask(account)}</Typography>
          </Box>
          <Chip
            label={account ? 'Connected' : 'Disconnected'}
            color={account ? 'success' : 'default'}
            variant="outlined"
            sx={{ ml: 'auto', borderColor: '#2a2f38', color: account ? '#22c55e' : '#9ca3af' }}
          />
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          sx={{
            mb: 2,
            '& .MuiTab-root': { color: '#9ca3af', textTransform: 'none', fontWeight: 600, minHeight: 44 },
            '& .Mui-selected': { color: '#e5e7eb' },
            '& .MuiTabs-indicator': { backgroundColor: '#6b7280' }
          }}
        >
          <Tab icon={<Person />} iconPosition="start" label="Your Profile" />
          <Tab icon={<AccountBalanceWallet />} iconPosition="start" label="Your Account" />
          <Tab icon={<Payment />} iconPosition="start" label="Payments" />
          <Tab icon={<Settings />} iconPosition="start" label="Settings" />
          <Tab icon={<History />} iconPosition="start" label="Payment History" />
        </Tabs>

        <Divider sx={{ borderColor: '#1f232a', mb: 2 }} />

        {/* Tab 0: Profile */}
        {tab === 0 && (
          <Box>
            <SectionTitle title="Profile Overview" subtitle="Basic details and public preferences" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Display Name" placeholder="CharityGuardian"
                  variant="filled"
                  InputProps={{ disableUnderline: true }}
                  sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Email" placeholder="you@example.com"
                  variant="filled"
                  InputProps={{ disableUnderline: true }}
                  sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Bio" placeholder="Short description..."
                  multiline minRows={3}
                  variant="filled"
                  InputProps={{ disableUnderline: true }}
                  sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 1: Account */}
        {tab === 1 && (
          <Box>
            <SectionTitle title="Wallet & Account" subtitle="Manage your connected wallet and identity" />
            <List dense sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}>
              <ListItem>
                <ListItemIcon><AccountBalanceWallet sx={{ color: '#9ca3af' }} /></ListItemIcon>
                <ListItemText primary="Connected Wallet" secondary={Mask(account)} />
              </ListItem>
              <ListItem>
                <ListItemIcon><Security sx={{ color: '#9ca3af' }} /></ListItemIcon>
                <ListItemText primary="Chain" secondary="Ethereum (auto)" />
              </ListItem>
              <ListItem>
                <ListItemIcon><Person sx={{ color: '#9ca3af' }} /></ListItemIcon>
                <ListItemText primary="KYC" secondary="Not required for on-chain donations" />
              </ListItem>
            </List>

            <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleLogout}
                startIcon={<Logout />}
                sx={{ borderColor: '#343a46', color: '#e5e7eb' }}
              >
                Log out (clear wallet cache)
              </Button>
            </Box>
          </Box>
        )}

        {/* Tab 2: Payments (Methods / History sub-tabs inside) */}
        {tab === 2 && (
          <Box>
            <SectionTitle title="Payments" subtitle="Cards, wallets and on-chain methods" />
            <Tabs
              value={subTabPayments}
              onChange={(_, v) => setSubTabPayments(v)}
              sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', color: '#9ca3af' }, '& .Mui-selected': { color: '#e5e7eb' } }}
            >
              <Tab label="Methods" />
              <Tab label="History" />
            </Tabs>

            {subTabPayments === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: '#0d0f12', border: '1px solid #1f232a' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CreditCard sx={{ color: '#9ca3af' }} /><Typography>Visa •••• 4242</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>Expires 10/27</Typography>
                    <Button size="small" sx={{ mt: 1 }} variant="outlined">Remove</Button>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: '#0d0f12', border: '1px solid #1f232a' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AccountBalanceWallet sx={{ color: '#9ca3af' }} /><Typography>MetaMask</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#9ca3af' }}>{Mask(account)}</Typography>
                    <Button size="small" sx={{ mt: 1 }} variant="outlined">Disconnect</Button>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {subTabPayments === 1 && (
              <Box sx={{ bgcolor: '#0d0f12', borderRadius: 1, p: 2, border: '1px solid #1f232a' }}>
                <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1 }}>
                  Recent on-chain donations (sample)
                </Typography>
                <List dense>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <ListItem key={i} sx={{ px: 0 }}>
                      <ListItemText
                        primary={`0x${(Math.random().toString(16).slice(2, 10))}...`}
                        secondary="0.05 ETH • UNICEF • 2 days ago"
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}

        {/* Tab 3: Settings (Security / Notifications / Preferences) */}
        {tab === 3 && (
          <Box>
            <SectionTitle title="Settings" subtitle="Security, notifications and preferences" />
            <Tabs
              value={subTabSettings}
              onChange={(_, v) => setSubTabSettings(v)}
              sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', color: '#9ca3af' }, '& .Mui-selected': { color: '#e5e7eb' } }}
            >
              <Tab label="Security" />
              <Tab label="Notifications" />
              <Tab label="Preferences" />
            </Tabs>

            {subTabSettings === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="2FA (App Code)" placeholder="Enable via authenticator"
                    variant="filled" InputProps={{ disableUnderline: true }}
                    sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Session Timeout (mins)" placeholder="30"
                    variant="filled" InputProps={{ disableUnderline: true }}
                    sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}
                  />
                </Grid>
              </Grid>
            )}

            {subTabSettings === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Email Alerts" placeholder="All donations"
                    variant="filled" InputProps={{ disableUnderline: true }}
                    sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Push Notifications" placeholder="Important updates"
                    variant="filled" InputProps={{ disableUnderline: true }}
                    sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}
                  />
                </Grid>
              </Grid>
            )}

            {subTabSettings === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Theme" placeholder="System"
                    variant="filled" InputProps={{ disableUnderline: true }}
                    sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Currency" placeholder="USD"
                    variant="filled" InputProps={{ disableUnderline: true }}
                    sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        )}

        {/* Tab 4: Payment History (standalone view) */}
        {tab === 4 && (
          <Box>
            <SectionTitle title="Payment History" subtitle="Your complete on-chain and off-chain records" />
            <Box sx={{ bgcolor: '#0d0f12', borderRadius: 1, p: 2, border: '1px solid #1f232a' }}>
              <Grid container spacing={1.5}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Grid item xs={12} sm={6} key={i}>
                    <Paper sx={{ p: 2, bgcolor: '#0c0e11', border: '1px solid #1f232a' }}>
                      <Typography variant="subtitle2" sx={{ color: '#e5e7eb' }}>0.10 ETH • American Red Cross</Typography>
                      <Typography variant="caption" sx={{ color: '#9ca3af' }}>TX: 0x{Math.random().toString(16).slice(2, 10)}… • 2025‑09‑12</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default ProfilePanel;