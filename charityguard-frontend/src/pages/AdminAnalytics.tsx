import React, { useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Container,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Analytics as AnalyticsIcon,
  TrendingUp,
  Flag,
  Person,
  CheckCircle
} from "@mui/icons-material";
import axios from "axios";
import { toast } from 'react-toastify';
import AnimatedCounter from '../components/AnimatedCounter';
import { StatCardSkeleton } from '../components/LoadingSkeleton';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const COLORS = ['#14b8a6', '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'];

const AdminAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7');
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/activity-logs/stats?days=${timeRange}`);
      
      if (response.data.success) {
        setStatsData(response.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to load analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box className="page-transition" sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', py: 4 }}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 800, mb: 1 }}>
              Analytics Dashboard
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <StatCardSkeleton />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  const actionChartData = statsData?.actionStats?.map((stat: any) => ({
    name: stat._id.replace(/_/g, ' '),
    count: stat.count
  })) || [];

  const dailyChartData = statsData?.dailyStats?.map((stat: any) => ({
    date: new Date(stat._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    actions: stat.count
  })) || [];

  const adminChartData = statsData?.adminStats?.map((stat: any) => ({
    name: stat._id,
    value: stat.count
  })) || [];

  const totalActions = actionChartData.reduce((sum: number, item: any) => sum + item.count, 0);

  return (
    <Box className="page-transition fade-in" sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AnalyticsIcon sx={{ color: '#14b8a6', fontSize: 40 }} />
            <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 800 }}>
              Analytics Dashboard
            </Typography>
          </Box>
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: '#94a3b8', '&.Mui-focused': { color: '#14b8a6' } }}>
              Time Range
            </InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{
                color: '#ffffff',
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(20, 184, 166, 0.3)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#14b8a6' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#14b8a6' },
                '& .MuiSvgIcon-root': { color: '#14b8a6' }
              }}
            >
              <MenuItem value="7">Last 7 Days</MenuItem>
              <MenuItem value="14">Last 14 Days</MenuItem>
              <MenuItem value="30">Last 30 Days</MenuItem>
              <MenuItem value="90">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} className="stagger-children" sx={{ mb: 4 }}>
          {[
            { label: 'Total Actions', value: totalActions, color: '#14b8a6', icon: <TrendingUp /> },
            { label: 'Blocked', value: actionChartData.find((d: any) => d.name.includes('block'))?.count || 0, color: '#ef4444', icon: <Flag /> },
            { label: 'Cleared', value: actionChartData.find((d: any) => d.name.includes('clear'))?.count || 0, color: '#10b981', icon: <CheckCircle /> },
            { label: 'User Actions', value: actionChartData.find((d: any) => d.name.includes('user'))?.count || 0, color: '#3b82f6', icon: <Person /> }
          ].map((stat, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card className="hover-lift" sx={{
                background: `linear-gradient(135deg, ${stat.color}20, rgba(15, 23, 42, 0.95))`,
                border: `1px solid ${stat.color}50`,
                borderRadius: 3
              }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <AnimatedCounter
                      value={stat.value}
                      variant="h4"
                      sx={{ color: stat.color, fontWeight: 800 }}
                      duration={1500}
                    />
                    <Typography variant="body2" sx={{ color: '#cbd5e1' }}>{stat.label}</Typography>
                  </Box>
                  <Box sx={{ color: stat.color, opacity: 0.3, fontSize: 48 }}>{stat.icon}</Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Action Distribution - Bar Chart */}
          <Grid item xs={12} md={6}>
            <Card className="hover-lift fade-in" sx={{ 
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              borderRadius: 4,
              p: 3
            }}>
              <Typography variant="h6" sx={{ color: '#ffffff', mb: 3, fontWeight: 700 }}>
                Action Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={actionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.98)', 
                      border: '1px solid rgba(20, 184, 166, 0.3)',
                      borderRadius: 8,
                      color: '#ffffff'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#14b8a6" 
                    radius={[8, 8, 0, 0]}
                    animationDuration={1000}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          {/* Admin Activity - Pie Chart */}
          <Grid item xs={12} md={6}>
            <Card className="hover-lift fade-in" sx={{ 
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              borderRadius: 4,
              p: 3
            }}>
              <Typography variant="h6" sx={{ color: '#ffffff', mb: 3, fontWeight: 700 }}>
                Top Admins by Activity
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={adminChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    animationDuration={1000}
                  >
                    {adminChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.98)', 
                      border: '1px solid rgba(20, 184, 166, 0.3)',
                      borderRadius: 8,
                      color: '#ffffff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          {/* Activity Timeline - Line Chart */}
          <Grid item xs={12}>
            <Card className="hover-lift fade-in" sx={{ 
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
              border: '1px solid rgba(20, 184, 166, 0.3)',
              borderRadius: 4,
              p: 3
            }}>
              <Typography variant="h6" sx={{ color: '#ffffff', mb: 3, fontWeight: 700 }}>
                Activity Timeline (Last {timeRange} Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.98)', 
                      border: '1px solid rgba(20, 184, 166, 0.3)',
                      borderRadius: 8,
                      color: '#ffffff'
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#ffffff' }} />
                  <Line 
                    type="monotone" 
                    dataKey="actions" 
                    stroke="#14b8a6" 
                    strokeWidth={3}
                    dot={{ fill: '#14b8a6', r: 5 }}
                    activeDot={{ r: 8 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AdminAnalytics;
