import React, { useMemo, useState, useEffect } from 'react';
import {
  Box, Drawer, Tabs, Tab, Typography, Divider, IconButton, Avatar, Chip, Button,
  List, ListItem, ListItemText, ListItemIcon, TextField, Grid, Paper, Switch,
  FormControlLabel, Select, MenuItem, InputLabel, FormControl, Dialog, DialogTitle,
  DialogContent, DialogActions, Slider, LinearProgress
} from '@mui/material';
import {
  Person, Settings, Payment, History, Logout, Security, AccountBalanceWallet, CreditCard, Save,
  Phone, Language, Public, CalendarToday, Verified, PhotoCamera,
  Download, Add, Delete, Visibility, Email, NotificationsActive, Instagram, Twitter,
  Close, Timer, ContentCopy, Refresh
} from '@mui/icons-material';
import { toast } from 'react-toastify';

type Props = {
  open: boolean;
  onClose: () => void;
  account?: string | null;
  onDisconnect?: () => void;
};

interface ProfileData {
  displayName: string;
  email: string;
  bio: string;
  phone: string;
  instagram: string;
  twitter: string;
  location: string;
  taxReceiptEmail: string;
  avatar: string;
}

interface AccountSettings {
  accountType: string;
  emailVerified: boolean;
}

interface PreferencesData {
  theme: string;
  currency: string;
  language: string;
  timezone: string;
  dateFormat: string;
  defaultDonation: string;
  publicProfile: boolean;
  showDonations: boolean;
}

interface NotificationSettings {
  emailAlerts: boolean;
  pushNotifications: boolean;
  donationReceipts: boolean;
  weeklySummary: boolean;
  fraudAlerts: boolean;
  nonprofitUpdates: boolean;
  marketingEmails: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
}

interface PaymentCard {
  id: string;
  type: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
}

interface TransactionHistory {
  id: string;
  nonprofit: string;
  amount: number;
  date: string;
  txHash: string;
}

interface DonationGoal {
  target: number;
  current: number;
}

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="h6" sx={{ color: '#e5e7eb', fontWeight: 700 }}>{title}</Typography>
    {subtitle && <Typography variant="body2" sx={{ color: '#9ca3af' }}>{subtitle}</Typography>}
  </Box>
);

const Mask = (addr?: string | null) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'Not connected');

const ProfilePanel: React.FC<Props> = ({ open, onClose, account, onDisconnect }) => {
  const [tab, setTab] = useState(0);
  const [subTabPayments, setSubTabPayments] = useState(0);
  const [subTabSettings, setSubTabSettings] = useState(0);

  // Profile state
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    email: '',
    bio: '',
    phone: '',
    instagram: '',
    twitter: '',
    location: '',
    taxReceiptEmail: '',
    avatar: ''
  });

  // Account settings
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    accountType: 'Individual Donor',
    emailVerified: false
  });

  // Preferences state
  const [preferences, setPreferences] = useState<PreferencesData>({
    theme: 'dark',
    currency: 'USD',
    language: 'English',
    timezone: 'IST',
    dateFormat: 'DD/MM/YYYY',
    defaultDonation: '0.01',
    publicProfile: true,
    showDonations: true
  });

  // Notification state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailAlerts: true,
    pushNotifications: true,
    donationReceipts: true,
    weeklySummary: false,
    fraudAlerts: true,
    nonprofitUpdates: false,
    marketingEmails: false
  });

  // Security state
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30
  });

  // Payment cards
  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>([
    { id: '1', type: 'Visa', last4: '4242', expiry: '10/27', isDefault: true }
  ]);

  // Transaction history
  const [transactionHistory] = useState<TransactionHistory[]>([
    { id: '1', nonprofit: 'UNICEF', amount: 0.125, date: '2025-10-15', txHash: '0xabc123' },
    { id: '2', nonprofit: 'Red Cross', amount: 0.234, date: '2025-10-10', txHash: '0xdef456' },
    { id: '3', nonprofit: 'WWF', amount: 0.089, date: '2025-10-05', txHash: '0xghi789' },
    { id: '4', nonprofit: 'Habitat', amount: 0.156, date: '2025-09-28', txHash: '0xjkl012' },
    { id: '5', nonprofit: 'Oxfam', amount: 0.312, date: '2025-09-20', txHash: '0xmno345' },
    { id: '6', nonprofit: 'Save Children', amount: 0.098, date: '2025-09-15', txHash: '0xpqr678' },
    { id: '7', nonprofit: 'Doctors', amount: 0.267, date: '2025-09-08', txHash: '0xstu901' },
    { id: '8', nonprofit: 'Water.org', amount: 0.145, date: '2025-09-01', txHash: '0xvwx234' }
  ]);

  // Donation Goal
  const [donationGoal, setDonationGoal] = useState<DonationGoal>({
    target: 1.0,
    current: 0
  });

  // Dialogs
  const [addCardDialogOpen, setAddCardDialogOpen] = useState(false);
  const [newCard, setNewCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [hasChanges, setHasChanges] = useState(false);

  const avatarHue = useMemo(() => (account ? (parseInt(account.slice(2, 6), 16) % 360) : 200), [account]);

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    let completed = 0;
    let total = 7;
    
    if (profileData.displayName) completed++;
    if (profileData.email) completed++;
    if (profileData.bio) completed++;
    if (profileData.phone) completed++;
    if (profileData.location) completed++;
    if (profileData.avatar) completed++;
    if (profileData.taxReceiptEmail) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  // Load all data from localStorage
  useEffect(() => {
    if (account) {
      const savedProfile = localStorage.getItem(`charityguard_profile_${account}`);
      const savedAccount = localStorage.getItem(`charityguard_account_${account}`);
      const savedPreferences = localStorage.getItem(`charityguard_preferences_${account}`);
      const savedNotifications = localStorage.getItem(`charityguard_notifications_${account}`);
      const savedSecurity = localStorage.getItem(`charityguard_security_${account}`);
      const savedCards = localStorage.getItem(`charityguard_cards_${account}`);
      const savedGoal = localStorage.getItem(`charityguard_goal_${account}`);

      if (savedProfile) try { setProfileData(JSON.parse(savedProfile)); } catch (e) {}
      if (savedAccount) try { setAccountSettings(JSON.parse(savedAccount)); } catch (e) {}
      if (savedPreferences) try { setPreferences(JSON.parse(savedPreferences)); } catch (e) {}
      if (savedNotifications) try { setNotifications(JSON.parse(savedNotifications)); } catch (e) {}
      if (savedSecurity) try { setSecurity(JSON.parse(savedSecurity)); } catch (e) {}
      if (savedCards) try { setPaymentCards(JSON.parse(savedCards)); } catch (e) {}
      if (savedGoal) try { 
        setDonationGoal(JSON.parse(savedGoal)); 
      } catch (e) {
        // Calculate from transaction history if no saved goal
        setDonationGoal({
          target: 1.0,
          current: transactionHistory.reduce((sum, tx) => sum + tx.amount, 0)
        });
      }
    }
  }, [account, transactionHistory]);

  // Apply theme change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.theme);
  }, [preferences.theme]);
    // Handle changes
    const handleProfileChange = (field: keyof ProfileData, value: string) => {
      setProfileData(prev => ({ ...prev, [field]: value }));
      setHasChanges(true);
    };
  
    const handleAccountChange = (field: keyof AccountSettings, value: any) => {
      setAccountSettings(prev => ({ ...prev, [field]: value }));
      setHasChanges(true);
    };
  
    const handlePreferenceChange = (field: keyof PreferencesData, value: any) => {
      setPreferences(prev => ({ ...prev, [field]: value }));
      setHasChanges(true);
    };
  
    const handleNotificationChange = (field: keyof NotificationSettings, value: boolean) => {
      setNotifications(prev => ({ ...prev, [field]: value }));
      setHasChanges(true);
    };
  
    const handleSecurityChange = (field: keyof SecuritySettings, value: any) => {
      setSecurity(prev => ({ ...prev, [field]: value }));
      setHasChanges(true);
    };
  
    // Avatar upload
    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          handleProfileChange('avatar', reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
  
    // Add payment card
    const handleAddCard = () => {
      if (!newCard.number || !newCard.expiry || !newCard.cvv || !newCard.name) {
        toast.error('Please fill all card details');
        return;
      }
      const card: PaymentCard = {
        id: Date.now().toString(),
        type: 'Visa',
        last4: newCard.number.slice(-4),
        expiry: newCard.expiry,
        isDefault: paymentCards.length === 0
      };
      setPaymentCards([...paymentCards, card]);
      setNewCard({ number: '', expiry: '', cvv: '', name: '' });
      setAddCardDialogOpen(false);
      setHasChanges(true);
      toast.success('Card added successfully!');
    };
  
    // Remove card
    const handleRemoveCard = (id: string) => {
      setPaymentCards(paymentCards.filter(c => c.id !== id));
      setHasChanges(true);
      toast.success('Card removed');
    };
  
    // Export CSV
    const handleExportCSV = () => {
      const csv = ['Date,Nonprofit,Amount (ETH),Transaction Hash',
        ...transactionHistory.map(tx => `${tx.date},${tx.nonprofit},${tx.amount},${tx.txHash}`)
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `charityguard-transactions-${new Date().toISOString()}.csv`;
      a.click();
      toast.success('CSV exported successfully!');
    };
  
    // Tax summary
    const handleTaxSummary = () => {
      const totalAmount = transactionHistory.reduce((sum, tx) => sum + tx.amount, 0);
      const summary = `CharityGuard Tax Summary 2025\n\nTotal Donated: ${totalAmount.toFixed(4)} ETH\nTotal Transactions: ${transactionHistory.length}\n\nItemized Donations:\n${transactionHistory.map(tx => `${tx.date} - ${tx.nonprofit}: ${tx.amount} ETH`).join('\n')}`;
      const blob = new Blob([summary], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-summary-2025.txt`;
      a.click();
      toast.success('Tax summary downloaded!');
    };
  
    // Save all data
    const handleSaveProfile = () => {
      if (account) {
        try {
          localStorage.setItem(`charityguard_profile_${account}`, JSON.stringify(profileData));
          localStorage.setItem(`charityguard_account_${account}`, JSON.stringify(accountSettings));
          localStorage.setItem(`charityguard_preferences_${account}`, JSON.stringify(preferences));
          localStorage.setItem(`charityguard_notifications_${account}`, JSON.stringify(notifications));
          localStorage.setItem(`charityguard_security_${account}`, JSON.stringify(security));
          localStorage.setItem(`charityguard_cards_${account}`, JSON.stringify(paymentCards));
          localStorage.setItem(`charityguard_goal_${account}`, JSON.stringify(donationGoal));
          toast.success('Profile saved successfully!');
          setHasChanges(false);
        } catch (e) {
          toast.error('Failed to save profile');
        }
      }
    };
  
    const handleLogout = () => {
      try {
        const keys = ['wagmi.store', 'walletconnect', 'WALLETCONNECT_DEEPLINK_CHOICE', 'WEB3_CONNECT_CACHED_PROVIDER', 'cachedProvider', 'metaMask:connected'];
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
          {/* HEADER */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={profileData.avatar}
                sx={{
                  width: 52, height: 52,
                  bgcolor: `hsl(${avatarHue} 70% 45%)`,
                  fontWeight: 800,
                  border: '2px solid #2a2f38'
                }}
              >
                {profileData.displayName ? profileData.displayName.slice(0, 2).toUpperCase() : (account || 'CG').slice(2, 4).toUpperCase()}
              </Avatar>
              <IconButton
                component="label"
                sx={{
                  position: 'absolute', bottom: -4, right: -4, width: 24, height: 24,
                  bgcolor: '#14b8a6', '&:hover': { bgcolor: '#0d9488' }
                }}
              >
                <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} />
                <PhotoCamera sx={{ fontSize: 14, color: '#fff' }} />
              </IconButton>
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {profileData.displayName || 'Profile'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#9ca3af' }}>{Mask(account)}</Typography>
            </Box>
            <Chip
              label={account ? 'Connected' : 'Disconnected'}
              color={account ? 'success' : 'default'}
              variant="outlined"
              sx={{ ml: 'auto', borderColor: '#2a2f38', color: account ? '#22c55e' : '#9ca3af' }}
            />
          </Box>
  
          {/* PROFILE COMPLETION PROGRESS */}
          <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(20, 184, 166, 0.1)', borderRadius: 2, border: '1px solid rgba(20, 184, 166, 0.3)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#e5e7eb', fontWeight: 600 }}>
                Profile Completion
              </Typography>
              <Typography variant="h6" sx={{ color: '#14b8a6', fontWeight: 800 }}>
                {profileCompletion}%
              </Typography>
            </Box>
            <Box sx={{ 
              width: '100%', 
              height: 8, 
              bgcolor: '#0d0f12', 
              borderRadius: 1, 
              overflow: 'hidden',
              position: 'relative'
            }}>
              <Box sx={{ 
                width: `${profileCompletion}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #14b8a6, #06b6d4)',
                transition: 'width 0.5s ease',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shimmer 2s infinite'
                },
                '@keyframes shimmer': {
                  '0%': { transform: 'translateX(-100%)' },
                  '100%': { transform: 'translateX(100%)' }
                }
              }} />
            </Box>
            {profileCompletion < 100 && (
              <Typography variant="caption" sx={{ color: '#9ca3af', mt: 1, display: 'block' }}>
                Complete your profile to unlock all features!
              </Typography>
            )}
            {profileCompletion === 100 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Verified sx={{ color: '#22c55e', fontSize: 16 }} />
                <Typography variant="caption" sx={{ color: '#22c55e', fontWeight: 600 }}>
                  Profile Complete!
                </Typography>
              </Box>
            )}
          </Box>
  
          {/* MAIN TABS */}
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            sx={{
              mb: 2,
              '& .MuiTab-root': { color: '#9ca3af', textTransform: 'none', fontWeight: 600, minHeight: 44 },
              '& .Mui-selected': { color: '#e5e7eb' },
              '& .MuiTabs-indicator': { backgroundColor: '#14b8a6' }
            }}
          >
            <Tab icon={<Person />} iconPosition="start" label="Your Profile" />
            <Tab icon={<AccountBalanceWallet />} iconPosition="start" label="Your Account" />
            <Tab icon={<Payment />} iconPosition="start" label="Payments" />
            <Tab icon={<Settings />} iconPosition="start" label="Settings" />
            <Tab icon={<History />} iconPosition="start" label="History" />
          </Tabs>
  
          <Divider sx={{ borderColor: '#1f232a', mb: 2 }} />
                  {/* TAB 0: YOUR PROFILE */}
        {tab === 0 && (
          <Box>
            <SectionTitle title="Profile Overview" subtitle="Basic details and public preferences" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Display Name" placeholder="Pete Royce"
                  value={profileData.displayName}
                  onChange={(e) => handleProfileChange('displayName', e.target.value)}
                  variant="filled"
                  InputProps={{ disableUnderline: true }}
                  sx={{ bgcolor: '#0d0f12', borderRadius: 1, '& .MuiInputBase-root': { color: '#e5e7eb' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Email" placeholder="peteroyce04@gmail.com"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  variant="filled"
                  InputProps={{ disableUnderline: true }}
                  sx={{ bgcolor: '#0d0f12', borderRadius: 1, '& .MuiInputBase-root': { color: '#e5e7eb' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Phone Number" placeholder="+91 98765 43210"
                  value={profileData.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  variant="filled"
                  InputProps={{ disableUnderline: true }}
                  sx={{ bgcolor: '#0d0f12', borderRadius: 1, '& .MuiInputBase-root': { color: '#e5e7eb' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Location" placeholder="Mumbai, India"
                  value={profileData.location}
                  onChange={(e) => handleProfileChange('location', e.target.value)}
                  variant="filled"
                  InputProps={{ disableUnderline: true }}
                  sx={{ bgcolor: '#0d0f12', borderRadius: 1, '& .MuiInputBase-root': { color: '#e5e7eb' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Bio" placeholder="Hi, I am the creator of this project"
                  value={profileData.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  multiline minRows={3}
                  variant="filled"
                  InputProps={{ disableUnderline: true }}
                  sx={{ bgcolor: '#0d0f12', borderRadius: 1, '& .MuiInputBase-root': { color: '#e5e7eb' } }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ borderColor: '#1f232a', my: 3 }} />
            <SectionTitle title="Social Media" subtitle="Connect your social profiles" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Instagram />}
                  onClick={() => window.open('https://www.instagram.com/accounts/login/', '_blank')}
                  sx={{
                    py: 1.5,
                    borderColor: '#E1306C',
                    color: '#E1306C',
                    '&:hover': { borderColor: '#C13584', bgcolor: 'rgba(225, 48, 108, 0.1)' }
                  }}
                >
                  Connect Instagram
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Twitter />}
                  onClick={() => window.open('https://twitter.com/i/flow/login', '_blank')}
                  sx={{
                    py: 1.5,
                    borderColor: '#1DA1F2',
                    color: '#1DA1F2',
                    '&:hover': { borderColor: '#0d8bd9', bgcolor: 'rgba(29, 161, 242, 0.1)' }
                  }}
                >
                  Connect Twitter
                </Button>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Tax Receipt Email" placeholder="receipts@example.com"
                  value={profileData.taxReceiptEmail}
                  onChange={(e) => handleProfileChange('taxReceiptEmail', e.target.value)}
                  variant="filled"
                  InputProps={{ disableUnderline: true }}
                  sx={{ bgcolor: '#0d0f12', borderRadius: 1, '& .MuiInputBase-root': { color: '#e5e7eb' } }}
                />
              </Grid>
            </Grid>

            {/* DONATION GOAL TRACKER */}
            <Divider sx={{ borderColor: '#1f232a', my: 3 }} />
            <SectionTitle title="Donation Goal" subtitle="Track your giving progress" />
            <Paper sx={{ 
              p: 3, 
              bgcolor: 'rgba(20, 184, 166, 0.05)', 
              border: '2px solid rgba(20, 184, 166, 0.3)', 
              borderRadius: 3,
              mb: 3
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h4" sx={{ color: '#14b8a6', fontWeight: 800 }}>
                    {donationGoal.current.toFixed(3)} / {donationGoal.target.toFixed(1)} ETH
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                    {((donationGoal.current / donationGoal.target) * 100).toFixed(1)}% Complete
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h5" sx={{ color: '#14b8a6', fontWeight: 700 }}>
                    {Math.max(0, donationGoal.target - donationGoal.current).toFixed(3)} ETH
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>Remaining</Typography>
                </Box>
              </Box>

              <Box sx={{ 
                width: '100%', 
                height: 12, 
                bgcolor: '#0d0f12', 
                borderRadius: 2, 
                overflow: 'hidden',
                mb: 2,
                position: 'relative'
              }}>
                <Box sx={{ 
                  width: `${Math.min((donationGoal.current / donationGoal.target) * 100, 100)}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #14b8a6, #06b6d4, #3b82f6)',
                  transition: 'width 0.8s ease',
                  boxShadow: '0 0 10px rgba(20, 184, 166, 0.5)'
                }} />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="Set Goal (ETH)"
                  type="number"
                  value={donationGoal.target}
                  onChange={(e) => {
                    setDonationGoal(prev => ({ ...prev, target: parseFloat(e.target.value) || 1.0 }));
                    setHasChanges(true);
                  }}
                  variant="filled"
                  size="small"
                  InputProps={{ disableUnderline: true }}
                  sx={{ 
                    flex: 1,
                    bgcolor: '#0d0f12', 
                    borderRadius: 1, 
                    '& .MuiInputBase-root': { color: '#e5e7eb' } 
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    setDonationGoal(prev => ({ ...prev, current: transactionHistory.reduce((sum, tx) => sum + tx.amount, 0) }));
                    setHasChanges(true);
                    toast.info('Progress updated from transaction history');
                  }}
                  sx={{ 
                    color: '#14b8a6', 
                    borderColor: '#14b8a6',
                    '&:hover': { borderColor: '#0d9488', bgcolor: 'rgba(20, 184, 166, 0.1)' }
                  }}
                >
                  <Refresh sx={{ fontSize: 20 }} />
                </Button>
              </Box>

              {donationGoal.current >= donationGoal.target && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: 'rgba(34, 197, 94, 0.1)', 
                  borderRadius: 2,
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Typography sx={{ fontSize: '2rem' }}>🎉</Typography>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#22c55e', fontWeight: 700 }}>
                      Goal Achieved!
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                      You've reached your donation target. Set a new goal!
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>

            <Button
              fullWidth variant="contained" startIcon={<Save />}
              onClick={handleSaveProfile} disabled={!hasChanges}
              sx={{ mt: 3, py: 1.5, bgcolor: hasChanges ? '#14b8a6' : '#2a2f38' }}
            >
              {hasChanges ? 'Save Changes' : 'No Changes'}
            </Button>
          </Box>
        )}

        {/* TAB 1: YOUR ACCOUNT WITH COPY WALLET BUTTON */}
        {tab === 1 && (
          <Box>
            <SectionTitle title="Wallet & Account" subtitle="Manage your connected wallet and identity" />
            <List dense sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}>
              <ListItem>
                <ListItemIcon><AccountBalanceWallet sx={{ color: '#14b8a6' }} /></ListItemIcon>
                <ListItemText 
                  primary="Connected Wallet" 
                  secondary={Mask(account)}
                  primaryTypographyProps={{ color: '#e5e7eb' }}
                />
                <IconButton 
                  size="small"
                  onClick={() => {
                    if (account) {
                      navigator.clipboard.writeText(account);
                      toast.success('Wallet address copied!', { autoClose: 1500 });
                    }
                  }}
                  sx={{ 
                    ml: 1,
                    color: '#14b8a6',
                    bgcolor: 'rgba(20, 184, 166, 0.1)',
                    '&:hover': { bgcolor: 'rgba(20, 184, 166, 0.2)' }
                  }}
                >
                  <ContentCopy sx={{ fontSize: 18 }} />
                </IconButton>
                <Verified sx={{ color: '#22c55e', ml: 1 }} />
              </ListItem>
              <Divider sx={{ borderColor: '#1f232a' }} />
              <ListItem>
                <ListItemIcon><Security sx={{ color: '#9ca3af' }} /></ListItemIcon>
                <ListItemText 
                  primary="Chain" 
                  secondary="Ethereum Mainnet"
                  primaryTypographyProps={{ color: '#e5e7eb' }}
                />
              </ListItem>
              <Divider sx={{ borderColor: '#1f232a' }} />
              <ListItem>
                <ListItemIcon><CalendarToday sx={{ color: '#9ca3af' }} /></ListItemIcon>
                <ListItemText 
                  primary="Account Created" 
                  secondary={new Date().toLocaleDateString()}
                  primaryTypographyProps={{ color: '#e5e7eb' }}
                />
              </ListItem>
              <Divider sx={{ borderColor: '#1f232a' }} />
              <ListItem>
                <ListItemIcon><Person sx={{ color: '#9ca3af' }} /></ListItemIcon>
                <ListItemText primary="Account Type" primaryTypographyProps={{ color: '#e5e7eb' }} />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={accountSettings.accountType}
                    onChange={(e) => handleAccountChange('accountType', e.target.value)}
                    sx={{ color: '#e5e7eb', bgcolor: '#0d0f12' }}
                  >
                    <MenuItem value="Individual Donor">Individual Donor</MenuItem>
                    <MenuItem value="Organization">Organization</MenuItem>
                    <MenuItem value="Corporate">Corporate</MenuItem>
                    <MenuItem value="Foundation">Foundation</MenuItem>
                  </Select>
                </FormControl>
              </ListItem>
              <Divider sx={{ borderColor: '#1f232a' }} />
              <ListItem>
                <ListItemIcon><Email sx={{ color: accountSettings.emailVerified ? '#22c55e' : '#f59e0b' }} /></ListItemIcon>
                <ListItemText 
                  primary="Email Verification" 
                  secondary={accountSettings.emailVerified ? 'Verified' : 'Not Verified'}
                  primaryTypographyProps={{ color: '#e5e7eb' }}
                />
                {!accountSettings.emailVerified && (
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => window.open('https://accounts.google.com/', '_blank')}
                    sx={{ color: '#14b8a6', borderColor: '#14b8a6' }}
                  >
                    Verify
                  </Button>
                )}
              </ListItem>
            </List>

            <Button
              fullWidth variant="outlined" startIcon={<Logout />}
              onClick={handleLogout}
              sx={{ mt: 2, borderColor: '#ef4444', color: '#ef4444' }}
            >
              Log Out (Clear Wallet Cache)
            </Button>
          </Box>
        )}

        {/* TAB 2: PAYMENTS */}
        {tab === 2 && (
          <Box>
            <SectionTitle title="Payment Methods" subtitle="Manage your payment options" />
            <Tabs
              value={subTabPayments}
              onChange={(_, v) => setSubTabPayments(v)}
              sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', color: '#9ca3af' }, '& .Mui-selected': { color: '#e5e7eb' } }}
            >
              <Tab label="Methods" />
              <Tab label="History" />
            </Tabs>

            {subTabPayments === 0 && (
              <>
                <Grid container spacing={2}>
                  {paymentCards.map((card) => (
                    <Grid item xs={12} sm={6} key={card.id}>
                      <Paper sx={{ p: 2, bgcolor: '#0d0f12', border: '1px solid #1f232a', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <CreditCard sx={{ color: '#9ca3af' }} />
                          <Typography sx={{ color: '#e5e7eb' }}>{card.type} •••• {card.last4}</Typography>
                          {card.isDefault && <Chip label="Default" size="small" sx={{ ml: 'auto', bgcolor: '#14b8a6', color: '#fff' }} />}
                        </Box>
                        <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1 }}>Expires {card.expiry}</Typography>
                        <Button size="small" variant="outlined" startIcon={<Delete />} onClick={() => handleRemoveCard(card.id)} sx={{ color: '#ef4444', borderColor: '#ef4444' }}>
                          Remove
                        </Button>
                      </Paper>
                    </Grid>
                  ))}
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: '#0d0f12', border: '1px solid #14b8a6', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AccountBalanceWallet sx={{ color: '#14b8a6' }} />
                        <Typography sx={{ color: '#e5e7eb' }}>MetaMask</Typography>
                        <Verified sx={{ ml: 'auto', color: '#22c55e' }} />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#9ca3af', mb: 1 }}>{Mask(account)}</Typography>
                      <Button size="small" variant="outlined" sx={{ color: '#14b8a6', borderColor: '#14b8a6' }}>
                        Connected
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>
                <Button fullWidth variant="outlined" startIcon={<Add />} onClick={() => setAddCardDialogOpen(true)} sx={{ mt: 2, color: '#14b8a6', borderColor: '#14b8a6' }}>
                  Add Payment Method
                </Button>
              </>
            )}

            {subTabPayments === 1 && (
              <Box sx={{ bgcolor: '#0d0f12', borderRadius: 1, p: 2, border: '1px solid #1f232a' }}>
                <List dense>
                  {transactionHistory.slice(0, 5).map((tx) => (
                    <ListItem key={tx.id} sx={{ px: 0, borderBottom: '1px solid #1f232a' }}>
                      <ListItemText
                        primary={`${tx.amount} ETH • ${tx.nonprofit}`}
                        secondary={`${tx.date}`}
                        primaryTypographyProps={{ color: '#e5e7eb' }}
                      />
                      <IconButton size="small"><Visibility sx={{ color: '#14b8a6' }} /></IconButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
                {/* TAB 3: SETTINGS */}
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

            {/* Security Sub-tab */}
            {subTabSettings === 0 && (
              <Box>
                <List dense sx={{ bgcolor: '#0d0f12', borderRadius: 1, mb: 2 }}>
                  <ListItem>
                    <ListItemIcon><Security sx={{ color: '#14b8a6' }} /></ListItemIcon>
                    <ListItemText 
                      primary="Two-Factor Authentication" 
                      secondary="Add extra security to your account"
                      primaryTypographyProps={{ color: '#e5e7eb' }}
                    />
                    <Switch
                      checked={security.twoFactorEnabled}
                      onChange={(e) => handleSecurityChange('twoFactorEnabled', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#14b8a6' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#14b8a6' }
                      }}
                    />
                  </ListItem>
                </List>

                {/* CLASSY SESSION TIMEOUT PANEL */}
                <Paper sx={{ p: 3, bgcolor: '#0d0f12', border: '2px solid #14b8a6', borderRadius: 3, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Timer sx={{ color: '#14b8a6', fontSize: 32 }} />
                    <Box>
                      <Typography variant="h6" sx={{ color: '#e5e7eb', fontWeight: 700 }}>
                        Session Timeout
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#9ca3af' }}>
                        Auto-logout after inactivity
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ px: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#9ca3af' }}>15 min</Typography>
                      <Typography variant="h5" sx={{ color: '#14b8a6', fontWeight: 800 }}>
                        {security.sessionTimeout} min
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#9ca3af' }}>120 min</Typography>
                    </Box>
                    <Slider
                      value={security.sessionTimeout}
                      onChange={(_, v) => handleSecurityChange('sessionTimeout', v)}
                      min={15}
                      max={120}
                      step={15}
                      marks
                      sx={{
                        color: '#14b8a6',
                        '& .MuiSlider-thumb': {
                          width: 24,
                          height: 24,
                          bgcolor: '#14b8a6',
                          border: '3px solid #0d0f12',
                          '&:hover': { boxShadow: '0 0 0 8px rgba(20, 184, 166, 0.16)' }
                        },
                        '& .MuiSlider-track': { bgcolor: '#14b8a6', height: 6 },
                        '& .MuiSlider-rail': { bgcolor: '#1f232a', height: 6 }
                      }}
                    />
                  </Box>
                </Paper>

                <Box sx={{ p: 2, bgcolor: '#0d0f12', borderRadius: 1, border: '1px solid #1f232a' }}>
                  <Typography variant="subtitle2" sx={{ color: '#e5e7eb', mb: 1, fontWeight: 700 }}>
                    Active Sessions
                  </Typography>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Chrome on Windows"
                        secondary="Current session • Last active now"
                        primaryTypographyProps={{ color: '#22c55e' }}
                      />
                      <Chip label="Active" size="small" sx={{ bgcolor: '#22c55e', color: '#fff' }} />
                    </ListItem>
                  </List>
                </Box>

                <Button
                  fullWidth variant="contained" startIcon={<Save />}
                  onClick={handleSaveProfile} disabled={!hasChanges}
                  sx={{ mt: 2, bgcolor: hasChanges ? '#14b8a6' : '#2a2f38' }}
                >
                  {hasChanges ? 'Save Changes' : 'No Changes'}
                </Button>
              </Box>
            )}

            {/* Notifications Sub-tab */}
            {subTabSettings === 1 && (
              <Box>
                <List dense sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}>
                  {[
                    { key: 'emailAlerts', label: 'Email Alerts', desc: 'Get notified about important updates' },
                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser notifications' },
                    { key: 'donationReceipts', label: 'Donation Receipts', desc: 'Email receipts for tax purposes' },
                    { key: 'weeklySummary', label: 'Weekly Summary', desc: 'Weekly donation impact report' },
                    { key: 'fraudAlerts', label: 'Fraud Alerts', desc: 'Immediate alerts for suspicious activity' },
                    { key: 'nonprofitUpdates', label: 'Nonprofit Updates', desc: 'Updates from charities you support' },
                    { key: 'marketingEmails', label: 'Marketing Emails', desc: 'News and promotions' }
                  ].map((item, idx) => (
                    <React.Fragment key={item.key}>
                      <ListItem>
                        <ListItemIcon><NotificationsActive sx={{ color: '#9ca3af' }} /></ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          secondary={item.desc}
                          primaryTypographyProps={{ color: '#e5e7eb' }}
                          secondaryTypographyProps={{ fontSize: '0.75rem' }}
                        />
                        <Switch
                          checked={notifications[item.key as keyof NotificationSettings]}
                          onChange={(e) => handleNotificationChange(item.key as keyof NotificationSettings, e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#14b8a6' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#14b8a6' }
                          }}
                        />
                      </ListItem>
                      {idx < 6 && <Divider sx={{ borderColor: '#1f232a' }} />}
                    </React.Fragment>
                  ))}
                </List>
                <Button
                  fullWidth variant="contained" startIcon={<Save />}
                  onClick={handleSaveProfile} disabled={!hasChanges}
                  sx={{ mt: 2, bgcolor: hasChanges ? '#14b8a6' : '#2a2f38' }}
                >
                  {hasChanges ? 'Save Changes' : 'No Changes'}
                </Button>
              </Box>
            )}

            {/* Preferences Sub-tab */}
            {subTabSettings === 2 && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="filled" sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}>
                      <InputLabel sx={{ color: '#9ca3af' }}>Theme</InputLabel>
                      <Select
                        value={preferences.theme}
                        onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                        disableUnderline
                        sx={{ color: '#e5e7eb' }}
                      >
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="auto">System</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="filled" sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}>
                      <InputLabel sx={{ color: '#9ca3af' }}>Currency</InputLabel>
                      <Select
                        value={preferences.currency}
                        onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                        disableUnderline
                        sx={{ color: '#e5e7eb' }}
                      >
                        <MenuItem value="USD">USD ($)</MenuItem>
                        <MenuItem value="EUR">EUR (€)</MenuItem>
                        <MenuItem value="GBP">GBP (£)</MenuItem>
                        <MenuItem value="INR">INR (₹)</MenuItem>
                        <MenuItem value="ETH">ETH (Ξ)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="filled" sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}>
                      <InputLabel sx={{ color: '#9ca3af' }}>Language</InputLabel>
                      <Select
                        value={preferences.language}
                        onChange={(e) => handlePreferenceChange('language', e.target.value)}
                        disableUnderline
                        sx={{ color: '#e5e7eb' }}
                      >
                        <MenuItem value="English">English</MenuItem>
                        <MenuItem value="Hindi">हिन्दी</MenuItem>
                        <MenuItem value="Spanish">Español</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="filled" sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}>
                      <InputLabel sx={{ color: '#9ca3af' }}>Timezone</InputLabel>
                      <Select
                        value={preferences.timezone}
                        onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                        disableUnderline
                        sx={{ color: '#e5e7eb' }}
                      >
                        <MenuItem value="IST">IST (India)</MenuItem>
                        <MenuItem value="UTC">UTC</MenuItem>
                        <MenuItem value="EST">EST</MenuItem>
                        <MenuItem value="PST">PST</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="filled" sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}>
                      <InputLabel sx={{ color: '#9ca3af' }}>Date Format</InputLabel>
                      <Select
                        value={preferences.dateFormat}
                        onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                        disableUnderline
                        sx={{ color: '#e5e7eb' }}
                      >
                        <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                        <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                        <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Default Donation (ETH)"
                      value={preferences.defaultDonation}
                      onChange={(e) => handlePreferenceChange('defaultDonation', e.target.value)}
                      variant="filled"
                      InputProps={{ disableUnderline: true }}
                      sx={{ bgcolor: '#0d0f12', borderRadius: 1, '& .MuiInputBase-root': { color: '#e5e7eb' } }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ borderColor: '#1f232a', my: 2 }} />
                <SectionTitle title="Privacy Settings" />
                
                <List dense sx={{ bgcolor: '#0d0f12', borderRadius: 1 }}>
                  <ListItem>
                    <ListItemText primary="Public Profile" secondary="Allow others to view your profile" primaryTypographyProps={{ color: '#e5e7eb' }} />
                    <Switch
                      checked={preferences.publicProfile}
                      onChange={(e) => handlePreferenceChange('publicProfile', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#14b8a6' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#14b8a6' }
                      }}
                    />
                  </ListItem>
                  <Divider sx={{ borderColor: '#1f232a' }} />
                  <ListItem>
                    <ListItemText primary="Show Donations" secondary="Display donation history publicly" primaryTypographyProps={{ color: '#e5e7eb' }} />
                    <Switch
                      checked={preferences.showDonations}
                      onChange={(e) => handlePreferenceChange('showDonations', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#14b8a6' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#14b8a6' }
                      }}
                    />
                  </ListItem>
                </List>

                <Button
                  fullWidth variant="contained" startIcon={<Save />}
                  onClick={handleSaveProfile} disabled={!hasChanges}
                  sx={{ mt: 2, bgcolor: hasChanges ? '#14b8a6' : '#2a2f38' }}
                >
                  {hasChanges ? 'Save Changes' : 'No Changes'}
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* TAB 4: PAYMENT HISTORY */}
        {tab === 4 && (
          <Box>
            <SectionTitle title="Payment History" subtitle="Your complete donation records" />
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button variant="outlined" startIcon={<Download />} onClick={handleExportCSV} sx={{ color: '#14b8a6', borderColor: '#14b8a6' }}>
                Export CSV
              </Button>
              <Button variant="outlined" startIcon={<Download />} onClick={handleTaxSummary} sx={{ color: '#14b8a6', borderColor: '#14b8a6' }}>
                Tax Summary
              </Button>
            </Box>

            <Box sx={{ bgcolor: '#0d0f12', borderRadius: 1, p: 2, border: '1px solid #1f232a' }}>
              <Grid container spacing={1.5}>
                {transactionHistory.map((tx) => (
                  <Grid item xs={12} key={tx.id}>
                    <Paper sx={{ p: 2, bgcolor: '#0c0e11', border: '1px solid #1f232a', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: '#e5e7eb', fontWeight: 700 }}>{tx.nonprofit}</Typography>
                        <Chip label={`${tx.amount} ETH`} size="small" sx={{ bgcolor: '#14b8a6', color: '#fff', fontWeight: 700 }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#9ca3af' }}>TX: {tx.txHash} • {tx.date}</Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip label="Verified" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', mr: 1 }} />
                        <Chip label="Receipt ✓" size="small" sx={{ bgcolor: 'rgba(20, 184, 166, 0.2)', color: '#14b8a6' }} />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box sx={{ mt: 3, p: 2, bgcolor: '#0d0f12', borderRadius: 1, border: '1px solid #14b8a6' }}>
              <Typography variant="subtitle2" sx={{ color: '#e5e7eb', fontWeight: 700, mb: 1 }}>Annual Summary 2025</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>Total Donated</Typography>
                  <Typography variant="h6" sx={{ color: '#14b8a6', fontWeight: 700 }}>
                    {transactionHistory.reduce((sum, tx) => sum + tx.amount, 0).toFixed(3)} ETH
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>Transactions</Typography>
                  <Typography variant="h6" sx={{ color: '#14b8a6', fontWeight: 700 }}>{transactionHistory.length}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Box>

      {/* ADD CARD DIALOG */}
      <Dialog open={addCardDialogOpen} onClose={() => setAddCardDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: '#0e1013', border: '1px solid #1f232a' } }}>
        <DialogTitle sx={{ color: '#e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Add Payment Card
          <IconButton onClick={() => setAddCardDialogOpen(false)}><Close sx={{ color: '#9ca3af' }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Card Number" placeholder="1234 5678 9012 3456"
                value={newCard.number}
                onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
                variant="filled"
                InputProps={{ disableUnderline: true }}
                sx={{ bgcolor: '#0d0f12', borderRadius: 1, '& .MuiInputBase-root': { color: '#e5e7eb' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth label="Expiry" placeholder="MM/YY"
                value={newCard.expiry}
                onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                variant="filled"
                InputProps={{ disableUnderline: true }}
                sx={{ bgcolor: '#0d0f12', borderRadius: 1, '& .MuiInputBase-root': { color: '#e5e7eb' } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth label="CVV" placeholder="123"
                value={newCard.cvv}
                onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                variant="filled"
                InputProps={{ disableUnderline: true }}
                sx={{ bgcolor: '#0d0f12', borderRadius: 1, '& .MuiInputBase-root': { color: '#e5e7eb' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Cardholder Name" placeholder="John Doe"
                value={newCard.name}
                onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                variant="filled"
                InputProps={{ disableUnderline: true }}
                sx={{ bgcolor: '#0d0f12', borderRadius: 1, '& .MuiInputBase-root': { color: '#e5e7eb' } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAddCardDialogOpen(false)} sx={{ color: '#9ca3af' }}>Cancel</Button>
          <Button onClick={handleAddCard} variant="contained" sx={{ bgcolor: '#14b8a6' }}>Add Card</Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
};

export default ProfilePanel;



  







