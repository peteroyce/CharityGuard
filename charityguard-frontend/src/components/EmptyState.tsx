import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import {
  Inbox,
  Search,
  TrendingUp,
  People,
  Flag
} from '@mui/icons-material';

interface EmptyStateProps {
  type: 'no-data' | 'no-results' | 'no-users' | 'no-transactions' | 'no-activity';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionLabel,
  onAction
}) => {
  const getIcon = () => {
    switch (type) {
      case 'no-results':
        return <Search sx={{ fontSize: 80, color: '#64748b' }} />;
      case 'no-users':
        return <People sx={{ fontSize: 80, color: '#64748b' }} />;
      case 'no-transactions':
        return <Flag sx={{ fontSize: 80, color: '#64748b' }} />;
      case 'no-activity':
        return <TrendingUp sx={{ fontSize: 80, color: '#64748b' }} />;
      default:
        return <Inbox sx={{ fontSize: 80, color: '#64748b' }} />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'no-results':
        return 'No results found';
      case 'no-users':
        return 'No users yet';
      case 'no-transactions':
        return 'No transactions found';
      case 'no-activity':
        return 'No activity yet';
      default:
        return 'No data available';
    }
  };

  const getDescription = () => {
    if (description) return description;
    switch (type) {
      case 'no-results':
        return 'Try adjusting your search or filters';
      case 'no-users':
        return 'Users will appear here once they sign up';
      case 'no-transactions':
        return 'Flagged transactions will appear here';
      case 'no-activity':
        return 'Activity logs will appear when actions are taken';
      default:
        return 'Data will appear here when available';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center'
      }}
    >
      <Box
        sx={{
          mb: 3,
          opacity: 0.6,
          animation: 'float 3s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-10px)' }
          }
        }}
      >
        {getIcon()}
      </Box>
      
      <Typography
        variant="h5"
        sx={{
          color: '#ffffff',
          fontWeight: 700,
          mb: 1
        }}
      >
        {getTitle()}
      </Typography>
      
      <Typography
        variant="body1"
        sx={{
          color: '#94a3b8',
          mb: 3,
          maxWidth: 400
        }}
      >
        {getDescription()}
      </Typography>

      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            bgcolor: '#14b8a6',
            color: '#ffffff',
            '&:hover': {
              bgcolor: '#0f766e',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(20, 184, 166, 0.3)'
            }
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
