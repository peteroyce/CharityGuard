import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Chip,
  Avatar,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Security,
  AccountBalanceWallet,
  Send,
  CheckCircle,
  Info,
  OpenInNew,
  ContentCopy
} from '@mui/icons-material';
import { useBlockchain } from '../hooks/useBlockchain';
import axios from 'axios';

interface Charity {
  id: string;
  name: string;
  ein: string;
  city: string;
  state: string;
  trustScore: number;
  category: string;
}

interface DonationStep {
  label: string;
  description: string;
}

const donationSteps: DonationStep[] = [
  { label: 'Connect Wallet', description: 'Connect your MetaMask wallet' },
  { label: 'Review Details', description: 'Confirm donation amount and charity' },
  { label: 'Blockchain Transaction', description: 'Process secure donation' },
  { label: 'Confirmation', description: 'Donation completed successfully' }
];

export const DonationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [transactionHash, setTransactionHash] = useState('');
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [fraudScore, setFraudScore] = useState(0.1);

  const {
    account,
    isConnected,
    isLoading: walletLoading,
    error: walletError,
    connectWallet,
    makeDonation
  } = useBlockchain();

  useEffect(() => {
    if (location.state?.selectedCharity) {
      setSelectedCharity(location.state.selectedCharity);
      setCurrentStep(isConnected ? 1 : 0);
    } else {
      navigate('/search');
    }
  }, [location, navigate, isConnected]);

  useEffect(() => {
    if (isConnected && currentStep === 0) {
      setCurrentStep(1);
    }
  }, [isConnected]);

  const presetAmounts = ['0.01', '0.05', '0.1', '0.25', '0.5'];

  const calculateFraudScore = (charity: Charity, donationAmount: number): number => {
    let score = 0.1; // Base low risk
    
    // Trust score impact
    if (charity.trustScore < 50) score += 0.3;
    else if (charity.trustScore < 70) score += 0.1;
    
    // Amount impact (higher amounts = higher scrutiny)
    if (donationAmount > 1) score += 0.1;
    if (donationAmount > 5) score += 0.2;
    
    return Math.min(score, 0.8); // Cap at 80% risk
  };

  const handleAmountSelect = (selectedAmount: string) => {
    setAmount(selectedAmount);
    setCustomAmount('');
    
    if (selectedCharity) {
      const calculatedScore = calculateFraudScore(selectedCharity, parseFloat(selectedAmount));
      setFraudScore(calculatedScore);
    }
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setAmount('');
    
    if (selectedCharity && value) {
      const calculatedScore = calculateFraudScore(selectedCharity, parseFloat(value));
      setFraudScore(calculatedScore);
    }
  };

  const getDonationAmount = (): string => {
    return customAmount || amount;
  };

  const handleDonate = async () => {
    if (!selectedCharity || !getDonationAmount()) return;

    setIsProcessing(true);
    setCurrentStep(2);

    try {
      // Use connected wallet address as charity address for demo
      const charityWalletAddress = account!;
      
      const tx = await makeDonation(
        charityWalletAddress,
        selectedCharity.name,
        selectedCharity.ein,
        getDonationAmount(),
        fraudScore
      );

      setTransactionHash(tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      
      // Record donation in backend
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/transactions/blockchain/donate`, {
        charity: charityWalletAddress,
        charityName: selectedCharity.name,
        charityEIN: selectedCharity.ein,
        amount: getDonationAmount(),
        fraudScore,
        donorAddress: account
      });

      setCurrentStep(3);
      setConfirmationOpen(true);
      
    } catch (error: any) {
      console.error('Donation failed:', error);
      setCurrentStep(1);
      alert('Donation failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!selectedCharity) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5">No charity selected</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/search')}
          sx={{ mt: 2 }}
        >
          Find Charities
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ mb: 4, textAlign: 'center', fontWeight: 700 }}>
        🤲 Make a Donation
      </Typography>

      {/* Progress Stepper */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stepper activeStep={currentStep} alternativeLabel>
            {donationSteps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {step.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      <Grid container spacing={4}>
        {/* Charity Information */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: 'fit-content', position: 'sticky', top: 20 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main', 
                    width: 56, 
                    height: 56, 
                    mr: 2 
                  }}
                >
                  {selectedCharity.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedCharity.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedCharity.city}, {selectedCharity.state}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    EIN Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedCharity.ein}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Trust Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {selectedCharity.trustScore}/100
                    </Typography>
                    <Chip 
                      label={selectedCharity.trustScore >= 80 ? 'Excellent' : 
                             selectedCharity.trustScore >= 60 ? 'Good' : 'Fair'}
                      size="small"
                      color={selectedCharity.trustScore >= 80 ? 'success' : 
                             selectedCharity.trustScore >= 60 ? 'warning' : 'error'}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Security sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Blockchain Security
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Your donation is processed through a secure smart contract on Sepolia blockchain, 
                  ensuring full transparency and fraud protection.
                </Typography>
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Fraud Risk Score: <strong>{Math.round(fraudScore * 100)}%</strong>
                  {fraudScore <= 0.3 ? ' (Low Risk)' : 
                   fraudScore <= 0.6 ? ' (Medium Risk)' : ' (Higher Risk - Additional Verification)'}
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Donation Form */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              {currentStep === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AccountBalanceWallet sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Connect Your Wallet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Connect your MetaMask wallet to make secure blockchain donations
                  </Typography>
                  
                  <Button
                    variant="contained"
                    size="large"
                    onClick={connectWallet}
                    disabled={walletLoading}
                    startIcon={walletLoading ? <CircularProgress size={20} /> : <AccountBalanceWallet />}
                    sx={{ borderRadius: 3 }}
                  >
                    {walletLoading ? 'Connecting...' : 'Connect MetaMask'}
                  </Button>

                  {walletError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {walletError}
                    </Alert>
                  )}
                </Box>
              )}

              {currentStep === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                    Choose Donation Amount
                  </Typography>

                  {/* Wallet Info */}
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'success.50', 
                    borderRadius: 2, 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Box>
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                        Wallet Connected
                      </Typography>
                      <Typography variant="body2">
                        {account?.substring(0, 6)}...{account?.slice(-4)}
                      </Typography>
                    </Box>
                    <CheckCircle sx={{ color: 'success.main' }} />
                  </Box>

                  {/* Preset Amounts */}
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                    Quick Select (ETH)
                  </Typography>
                  <Grid container spacing={1} sx={{ mb: 3 }}>
                    {presetAmounts.map((presetAmount) => (
                      <Grid item xs={6} sm={4} key={presetAmount}>
                        <Button
                          variant={amount === presetAmount ? 'contained' : 'outlined'}
                          fullWidth
                          onClick={() => handleAmountSelect(presetAmount)}
                          sx={{ 
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600
                          }}
                        >
                          {presetAmount} ETH
                        </Button>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Custom Amount */}
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                    Or Enter Custom Amount
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={customAmount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    placeholder="0.00"
                    inputProps={{ step: 0.001, min: 0.001 }}
                    InputProps={{
                      endAdornment: <Typography sx={{ color: 'text.secondary' }}>ETH</Typography>
                    }}
                    sx={{ mb: 3 }}
                  />

                  {/* Donation Summary */}
                  {getDonationAmount() && (
                    <Box sx={{ 
                      p: 3, 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 2,
                      mb: 3
                    }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Donation Summary
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Amount
                          </Typography>
                          <Typography variant="h6">
                            {getDonationAmount()} ETH
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Network Fee
                          </Typography>
                          <Typography variant="body2">
                            ~0.001 ETH
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleDonate}
                    disabled={!getDonationAmount() || parseFloat(getDonationAmount()) <= 0}
                    startIcon={<Send />}
                    sx={{ 
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600
                    }}
                  >
                    Donate {getDonationAmount()} ETH
                  </Button>
                </Box>
              )}

              {currentStep === 2 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress size={64} sx={{ mb: 3 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Processing Donation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please confirm the transaction in MetaMask and wait for blockchain confirmation...
                  </Typography>
                  
                  {transactionHash && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Transaction Hash:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {transactionHash.substring(0, 10)}...{transactionHash.slice(-8)}
                        </Typography>
                        <Tooltip title="Copy Transaction Hash">
                          <IconButton 
                            size="small" 
                            onClick={() => copyToClipboard(transactionHash)}
                            sx={{ ml: 1 }}
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View on Etherscan">
                          <IconButton 
                            size="small" 
                            onClick={() => window.open(`https://sepolia.etherscan.io/tx/${transactionHash}`, '_blank')}
                            sx={{ ml: 1 }}
                          >
                            <OpenInNew fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Success Dialog */}
      <Dialog
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Donation Successful!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Thank you for your generous donation of <strong>{getDonationAmount()} ETH</strong> to{' '}
              <strong>{selectedCharity.name}</strong>!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your donation has been securely recorded on the blockchain and will make a real difference.
            </Typography>
          </Box>

          {transactionHash && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Transaction Details:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Transaction Hash:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {transactionHash.substring(0, 8)}...{transactionHash.slice(-6)}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => copyToClipboard(transactionHash)}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => window.open(`https://sepolia.etherscan.io/tx/${transactionHash}`, '_blank')}
                startIcon={<OpenInNew />}
                sx={{ textTransform: 'none' }}
              >
                View on Etherscan
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            onClick={() => navigate('/search')}
            sx={{ textTransform: 'none', mr: 1 }}
          >
            Donate to Another Charity
          </Button>
          <Button 
            variant="contained" 
            onClick={() => navigate('/')}
            sx={{ textTransform: 'none' }}
          >
            Back to Home
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DonationPage;