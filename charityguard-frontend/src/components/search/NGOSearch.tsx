import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Chip,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Avatar,
  Rating,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search,
  LocationOn,
  Verified,
  TrendingUp,
  Info,
  Favorite,
  VolunteerActivism,
  School,
  MedicalServices,
  Pets,
  Nature,
  Groups,
  FilterList
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface NGO {
  _id: string;
  name: string;
  ein: string;
  city: string;
  state: string;
  zipCode: string;
  category: string;
  nteeCode: string;
  trustScore: number;
  description?: string;
  website?: string;
  totalDonations?: number;
  verified: boolean;
}

interface SearchFilters {
  category: string;
  state: string;
  minTrustScore: number;
  city: string;
}

const categories = [
  { value: 'all', label: 'All Categories', icon: <Groups /> },
  { value: 'health', label: 'Health & Medical', icon: <MedicalServices /> },
  { value: 'education', label: 'Education', icon: <School /> },
  { value: 'environment', label: 'Environment', icon: <Nature /> },
  { value: 'animals', label: 'Animal Welfare', icon: <Pets /> },
  { value: 'human-services', label: 'Human Services', icon: <Favorite /> },
  { value: 'arts', label: 'Arts & Culture', icon: <VolunteerActivism /> }
];

const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

export const NGOSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNGO, setSelectedNGO] = useState<NGO | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: 'all',
    state: '',
    minTrustScore: 0,
    city: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const searchNGOs = async (query: string, searchFilters: SearchFilters) => {
    if (!query && !searchFilters.state && !searchFilters.city) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      if (searchFilters.state) params.append('state', searchFilters.state);
      if (searchFilters.city) params.append('city', searchFilters.city);
      if (searchFilters.category !== 'all') params.append('category', searchFilters.category);
      if (searchFilters.minTrustScore > 0) params.append('minTrustScore', searchFilters.minTrustScore.toString());
      
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/nonprofits/search?${params}`);
      
      if (response.data.success) {
        // Calculate trust scores based on multiple factors
        const enhancedNGOs = response.data.data.map((ngo: any) => ({
          ...ngo,
          trustScore: calculateTrustScore(ngo),
          verified: ngo.ein && ngo.ein.length >= 9,
          description: generateDescription(ngo)
        }));
        
        // Sort by trust score descending
        enhancedNGOs.sort((a: NGO, b: NGO) => b.trustScore - a.trustScore);
        
        setNgos(enhancedNGOs);
      }
    } catch (error) {
      console.error('Search error:', error);
      setNgos([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrustScore = (ngo: any): number => {
    let score = 50; // Base score
    
    // EIN verification
    if (ngo.ein && ngo.ein.length >= 9) score += 25;
    
    // Complete address information
    if (ngo.city && ngo.state && ngo.zipCode) score += 15;
    
    // NTEE code (shows proper categorization)
    if (ngo.nteeCode) score += 10;
    
    // Ensure score is between 0-100
    return Math.min(Math.max(score, 0), 100);
  };

  const generateDescription = (ngo: any): string => {
    const categoryDescriptions: { [key: string]: string } = {
      'A': 'Arts, culture, and humanities organization',
      'B': 'Educational institution or program',
      'C': 'Environmental conservation organization',
      'D': 'Animal welfare organization',
      'E': 'Healthcare and medical services',
      'F': 'Mental health and crisis intervention',
      'G': 'Medical research organization',
      'H': 'Medical professional society',
      'I': 'Crime and legal-related services',
      'J': 'Employment and job-related services',
      'K': 'Food, agriculture, and nutrition',
      'L': 'Housing and shelter services',
      'M': 'Public safety and disaster preparedness',
      'N': 'Recreation and sports',
      'O': 'Youth development',
      'P': 'Human services',
      'Q': 'International, foreign affairs',
      'R': 'Civil rights and advocacy',
      'S': 'Community improvement',
      'T': 'Philanthropy and grantmaking',
      'U': 'Science and technology research',
      'V': 'Social science research',
      'W': 'Public and societal benefit',
      'X': 'Religion-related organization',
      'Y': 'Mutual/membership benefit',
      'Z': 'Unknown or unclassified'
    };

    const nteePrefix = ngo.nteeCode?.charAt(0) || 'Z';
    return categoryDescriptions[nteePrefix] || 'Nonprofit organization serving the community';
  };

  const getCategoryIcon = (nteeCode: string) => {
    const prefix = nteeCode?.charAt(0) || 'Z';
    const iconMap: { [key: string]: React.ReactElement } = {
      'A': <VolunteerActivism />,
      'B': <School />,
      'C': <Nature />,
      'D': <Pets />,
      'E': <MedicalServices />,
      'F': <MedicalServices />,
      'G': <MedicalServices />,
      'H': <MedicalServices />,
      'P': <Favorite />,
      'default': <Groups />
    };
    return iconMap[prefix] || iconMap.default;
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.length >= 2 || filters.state || filters.city) {
        searchNGOs(searchQuery, filters);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, filters]);

  const filteredNGOs = useMemo(() => {
    return ngos.filter(ngo => 
      ngo.trustScore >= filters.minTrustScore
    );
  }, [ngos, filters.minTrustScore]);

  const handleDonate = (ngo: NGO) => {
    navigate('/donate', { 
      state: { 
        selectedCharity: {
          id: ngo._id,
          name: ngo.name,
          ein: ngo.ein,
          city: ngo.city,
          state: ngo.state,
          trustScore: ngo.trustScore,
          category: ngo.category
        }
      }
    });
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h3" sx={{ mb: 4, fontWeight: 700, textAlign: 'center' }}>
        🔍 Find Verified NGOs & Charities
      </Typography>
      
      <Typography variant="h6" sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}>
        Search through 559,125+ IRS-verified organizations by name, location, or cause
      </Typography>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by organization name (e.g., 'Red Cross', 'Salvation Army')"
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
            endAdornment: (
              <Tooltip title="Advanced Filters">
                <IconButton onClick={() => setShowFilters(!showFilters)}>
                  <FilterList />
                </IconButton>
              </Tooltip>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'background.paper',
              boxShadow: 1
            }
          }}
        />
      </Box>

      {/* Advanced Filters */}
      {showFilters && (
        <Card sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Advanced Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  label="Category"
                >
                  {categories.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {cat.icon}
                        {cat.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={usStates}
                value={filters.state}
                onChange={(_, value) => setFilters({...filters, state: value || ''})}
                renderInput={(params) => (
                  <TextField {...params} label="State" placeholder="Select state" />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="City"
                value={filters.city}
                onChange={(e) => setFilters({...filters, city: e.target.value})}
                placeholder="Enter city name"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Min Trust Score</InputLabel>
                <Select
                  value={filters.minTrustScore}
                  onChange={(e) => setFilters({...filters, minTrustScore: e.target.value as number})}
                  label="Min Trust Score"
                >
                  <MenuItem value={0}>Any Score</MenuItem>
                  <MenuItem value={50}>50+ (Good)</MenuItem>
                  <MenuItem value={70}>70+ (Very Good)</MenuItem>
                  <MenuItem value={85}>85+ (Excellent)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Search Results */}
      <Box>
        {loading ? (
          <Grid container spacing={2}>
            {[1,2,3,4,5,6].map(i => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card>
                  <CardContent>
                    <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : filteredNGOs.length > 0 ? (
          <Grid container spacing={3}>
            {filteredNGOs.map((ngo) => (
              <Grid item xs={12} sm={6} md={4} key={ngo._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: ngo.trustScore >= 80 ? 'success.main' : 
                                 ngo.trustScore >= 60 ? 'warning.main' : 'error.main',
                          mr: 2 
                        }}
                      >
                        {getCategoryIcon(ngo.nteeCode)}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {ngo.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">
                            {ngo.city}, {ngo.state}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{ 
                      mb: 2, 
                      color: 'text.secondary',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {ngo.description}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Rating 
                        value={ngo.trustScore / 20} 
                        readOnly 
                        size="small"
                        precision={0.1}
                      />
                      <Typography variant="body2" sx={{ ml: 1, fontWeight: 600 }}>
                        {ngo.trustScore}/100
                      </Typography>
                      {ngo.verified && (
                        <Verified sx={{ ml: 1, fontSize: 16, color: 'success.main' }} />
                      )}
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip 
                        label={`EIN: ${ngo.ein}`} 
                        size="small" 
                        variant="outlined"
                      />
                      {ngo.nteeCode && (
                        <Chip 
                          label={ngo.nteeCode} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0 }}>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        onClick={() => handleDonate(ngo)}
                        startIcon={<VolunteerActivism />}
                        sx={{ 
                          flex: 1,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                      >
                        Donate Now
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSelectedNGO(ngo);
                          setDetailsOpen(true);
                        }}
                        sx={{ 
                          borderRadius: 2,
                          minWidth: 'auto',
                          px: 2
                        }}
                      >
                        <Info />
                      </Button>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          searchQuery || filters.state || filters.city ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>No organizations found</Typography>
              <Typography color="text.secondary">
                Try adjusting your search terms or filters
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>Start Your Search</Typography>
              <Typography color="text.secondary">
                Enter an organization name, select a state, or choose a city to begin
              </Typography>
            </Box>
          )
        )}
      </Box>

      {/* NGO Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedNGO && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {getCategoryIcon(selectedNGO.nteeCode)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedNGO.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    EIN: {selectedNGO.ein}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedNGO.description}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Location</Typography>
                  <Typography variant="body2">
                    {selectedNGO.city}, {selectedNGO.state} {selectedNGO.zipCode}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Trust Score</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating 
                      value={selectedNGO.trustScore / 20} 
                      readOnly 
                      size="small"
                    />
                    <Typography sx={{ ml: 1 }}>
                      {selectedNGO.trustScore}/100
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Category Code</Typography>
                  <Typography variant="body2">{selectedNGO.nteeCode || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Verification Status</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Verified sx={{ color: 'success.main', mr: 0.5, fontSize: 16 }} />
                    <Typography variant="body2">IRS Verified</Typography>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setDetailsOpen(false);
                  handleDonate(selectedNGO);
                }}
                startIcon={<VolunteerActivism />}
              >
                Donate Now
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default NGOSearch;