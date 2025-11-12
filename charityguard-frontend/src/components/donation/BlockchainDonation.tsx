import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { useBlockchain } from '../../hooks/useBlockchain';

interface Charity {
  _id: string;
  name: string;
  registrationNumber: string;
  trustScore: number;
}

interface BlockchainDonationProps {
  charity: Charity;
  onSuccess: (result: any) => void;
}

export const BlockchainDonation: React.FC<BlockchainDonationProps> = ({
  charity,
  onSuccess
}) => {
  const [amount, setAmount] = useState('0.01');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    account,
    isConnected,
    isLoading,
    error: walletError,
    connectWallet,
    makeDonation
  } = useBlockchain();

  const handleDonation = async () => {
    if (!isConnected || !charity) return;

    setIsProcessing(true);
    setMessage(null);

    try {
      const fraudScore = charity.trustScore < 0.5 ? 0.8 : 0.1;
      const charityWalletAddress = account; // Using user address for demo

      const tx = await makeDonation(
        charityWalletAddress,
        charity.name,
        charity.registrationNumber,
        amount,
        fraudScore
      );

      setMessage({
        type: 'success',
        text: `Transaction submitted! Hash: ${tx.hash.substring(0, 10)}...`
      });

      const receipt = await tx.wait();
      
      setMessage({
        type: 'success',
        text: `Donation confirmed! Block: ${receipt.blockNumber}`
      });

      onSuccess({
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        amount: parseFloat(amount),
        charity: charity.name
      });

    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Transaction failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isConnected) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            🔗 Connect Your Wallet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Connect MetaMask to make blockchain donations
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={connectWallet}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Connect MetaMask'}
          </Button>
          {walletError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {walletError}
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">⛓️ Blockchain Donation</Typography>
          <Chip label="Sepolia Testnet" size="small" color="primary" sx={{ ml: 2 }} />
        </Box>

        <Typography variant="body2" sx={{ mb: 2 }}>
          Connected: {account?.substring(0, 6)}...{account?.substring(account.length - 4)}
        </Typography>

        <TextField
          label="Donation Amount (ETH)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          inputProps={{ step: 0.001, min: 0.001 }}
          fullWidth
          sx={{ mb: 3 }}
        />

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleDonation}
          disabled={isProcessing || !amount || parseFloat(amount) <= 0}
          sx={{ mb: 2 }}
        >
          {isProcessing ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Processing...
            </>
          ) : (
            `Donate ${amount} ETH`
          )}
        </Button>

        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <Typography variant="caption" color="text.secondary">
          💡 This donation will be recorded on Sepolia blockchain for transparency.
        </Typography>
      </CardContent>
    </Card>
  );
};