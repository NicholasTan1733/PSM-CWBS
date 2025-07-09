import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import {
  Text,
  Card,
  Surface,
  SegmentedButtons,
  DataTable,
  ActivityIndicator,
  IconButton,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import moment from "moment";

import { theme } from "../../core/theme";
import { getBookingsForAdmin } from "../../../firebase/firebase";

const { width: screenWidth } = Dimensions.get("window");

const adminTheme = {
  primary: '#8e44ad',
  primaryLight: '#F3E5F5',
  primaryDark: '#6A1B9A',
  surface: '#FAF5FF',
  accent: '#F59E0B',
};

export default function ShopOwnerSalesDashboard({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
  const [bookings, setBookings] = useState([]);
  
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    averageTicket: 0,
    completionRate: 0,
    chartData: {
      labels: [],
      datasets: [{ data: [] }],
    },
    topServices: [],
    recentTransactions: [],
  });

  useEffect(() => {
    loadSalesData();
  }, [timeRange]);

  const loadSalesData = async () => {
    try {
      const bookingsData = await getBookingsForAdmin();
      setBookings(bookingsData);
      processSalesData(bookingsData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading sales data:", error);
      setLoading(false);
    }
  };

  const processSalesData = (bookingsData) => {
    const now = moment();
    let startDate;
    
    switch (timeRange) {
      case 'week':
        startDate = moment().subtract(7, 'days');
        break;
      case 'month':
        startDate = moment().subtract(30, 'days');
        break;
      case 'year':
        startDate = moment().subtract(365, 'days');
        break;
    }

    const filteredBookings = bookingsData.filter(booking => 
      moment(booking.date).isAfter(startDate) && 
      booking.status === 'completed'
    );

    const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalBookings = filteredBookings.length;
    const averageTicket = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const allBookingsInRange = bookingsData.filter(booking => 
      moment(booking.date).isAfter(startDate)
    );
    const completionRate = allBookingsInRange.length > 0 
      ? (filteredBookings.length / allBookingsInRange.length) * 100 
      : 0;

    const chartData = generateChartData(filteredBookings, timeRange);

    const serviceCount = {};
    filteredBookings.forEach(booking => {
      booking.services?.forEach(service => {
        serviceCount[service] = (serviceCount[service] || 0) + 1;
      });
    });
    
    const topServices = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([service, count]) => ({ service, count }));

    const recentTransactions = filteredBookings
      .sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf())
      .slice(0, 5);

    setSalesData({
      totalRevenue,
      totalBookings,
      averageTicket,
      completionRate,
      chartData,
      topServices,
      recentTransactions,
    });
  };

  const generateChartData = (bookings, range) => {
    const labels = [];
    const data = [];
    
    if (range === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = moment().subtract(i, 'days');
        labels.push(date.format('ddd'));
        
        const dayRevenue = bookings
          .filter(b => moment(b.date).isSame(date, 'day'))
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        
        data.push(dayRevenue);
      }
    } else if (range === 'month') {
      for (let i = 3; i >= 0; i--) {
        const weekStart = moment().subtract(i, 'weeks').startOf('week');
        const weekEnd = moment().subtract(i, 'weeks').endOf('week');
        labels.push(`Week ${4 - i}`);
        
        const weekRevenue = bookings
          .filter(b => moment(b.date).isBetween(weekStart, weekEnd, null, '[]'))
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        
        data.push(weekRevenue);
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = moment().subtract(i, 'months');
        labels.push(date.format('MMM'));
        
        const monthRevenue = bookings
          .filter(b => moment(b.date).isSame(date, 'month'))
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        
        data.push(monthRevenue);
      }
    }

    return {
      labels,
      datasets: [{ data }],
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSalesData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return `RM${numAmount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={adminTheme.primary} />
          <Text style={styles.loadingText}>Loading sales data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[adminTheme.primary]}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Sales Analytics</Text>
          
          <TouchableOpacity onPress={onRefresh}>
            <MaterialCommunityIcons name="refresh" size={24} color={adminTheme.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.timeRangeContainer}>
          <SegmentedButtons
            value={timeRange}
            onValueChange={setTimeRange}
            buttons={[
              { value: 'week', label: '7 Days' },
              { value: 'month', label: '30 Days' },
              { value: 'year', label: '1 Year' },
            ]}
            style={styles.segmentedButtons}
            theme={{ colors: { primary: adminTheme.primary } }}
          />
        </View>

        <View style={styles.metricsGrid}>
          <Surface style={[styles.metricCard, { backgroundColor: adminTheme.primaryLight }]} elevation={1}>
            <MaterialCommunityIcons name="cash-multiple" size={32} color={adminTheme.primary} />
            <Text style={styles.metricValue}>{formatCurrency(salesData.totalRevenue || 0)}</Text>
            <Text style={styles.metricLabel}>Total Revenue</Text>
          </Surface>
          
          <Surface style={[styles.metricCard, { backgroundColor: '#E0F2FE' }]} elevation={1}>
            <MaterialCommunityIcons name="car-wash" size={32} color="#0EA5E9" />
            <Text style={styles.metricValue}>{salesData.totalBookings}</Text>
            <Text style={styles.metricLabel}>Total Bookings</Text>
          </Surface>
          
          <Surface style={[styles.metricCard, { backgroundColor: '#FEF3C7' }]} elevation={1}>
            <MaterialCommunityIcons name="receipt" size={32} color="#F59E0B" />
            <Text style={styles.metricValue}>{formatCurrency(salesData.averageTicket || 0)}</Text>
            <Text style={styles.metricLabel}>Avg. Ticket</Text>
          </Surface>
          
          <Surface style={[styles.metricCard, { backgroundColor: '#D1FAE5' }]} elevation={1}>
            <MaterialCommunityIcons name="percent" size={32} color="#10B981" />
            <Text style={styles.metricValue}>{(salesData.completionRate || 0).toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Completion Rate</Text>
          </Surface>
        </View>

        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.chartTitle}>Revenue Trend</Text>
            {salesData.chartData.labels.length > 0 ? (
              <View style={styles.chartContainer}>
                <View style={styles.customChart}>
                  {salesData.chartData.datasets[0].data.map((value, index) => {
                    const maxValue = Math.max(...salesData.chartData.datasets[0].data, 1);
                    const barHeight = (value / maxValue) * 140;
                    
                    return (
                      <View key={index} style={styles.chartColumn}>
                        <Text style={styles.chartValue}>
                           {value > 0 ? formatCurrency(value) : ''}
                        </Text>
                        <View style={styles.barContainer}>
                          <View 
                            style={[
                              styles.chartBar, 
                              { 
                                height: barHeight || 10,
                                backgroundColor: adminTheme.primary,
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.chartLabel}>
                          {salesData.chartData.labels[index]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              <Text style={styles.noDataText}>No data available for this period</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.servicesCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Top Services</Text>
            {salesData.topServices.length > 0 ? (
              <View style={styles.servicesContainer}>
                {salesData.topServices.map((item, index) => (
                  <View key={index} style={styles.serviceItem}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{item.service}</Text>
                      <Text style={styles.serviceCount}>{item.count} bookings</Text>
                    </View>
                    <View style={styles.serviceBarContainer}>
                      <View 
                        style={[
                          styles.serviceBar, 
                          { 
                            width: `${(item.count / salesData.topServices[0].count) * 100}%`,
                            backgroundColor: adminTheme.primary,
                          }
                        ]} 
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>No service data available</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.transactionsCard}>
          <Card.Content>
            <View style={styles.transactionsHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AdminBookingHistoryScreen')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {salesData.recentTransactions.length > 0 ? (
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Customer</DataTable.Title>
                  <DataTable.Title>Date</DataTable.Title>
                  <DataTable.Title numeric>Amount</DataTable.Title>
                </DataTable.Header>

                {salesData.recentTransactions.map((transaction, index) => (
                  <DataTable.Row key={index}>
                    <DataTable.Cell>{transaction.customerName}</DataTable.Cell>
                    <DataTable.Cell>{moment(transaction.date).format('MMM D')}</DataTable.Cell>
                    <DataTable.Cell numeric>{formatCurrency(transaction.totalAmount)}</DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            ) : (
              <Text style={styles.noDataText}>No transactions in this period</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.placeholder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  timeRangeContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  segmentedButtons: {
    backgroundColor: '#F3F4F6',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    marginTop: 8,
  },
  metricCard: {
    width: (screenWidth - 48) / 2,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginTop: 4,
  },
  chartCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  chartContainer: {
    marginTop: 16,
  },
  customChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 180,
    paddingHorizontal: 8,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  chartValue: {
    fontSize: 10,
    color: adminTheme.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  barContainer: {
    height: 140,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  chartBar: {
    width: 30,
    borderRadius: 8,
    minHeight: 10,
  },
  chartLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  servicesCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  servicesContainer: {
    gap: 12,
  },
  serviceItem: {
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 14,
    color: '#000',
  },
  serviceCount: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  serviceBarContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  serviceBar: {
    height: '100%',
    borderRadius: 4,
  },
  transactionsCard: {
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: adminTheme.primary,
    fontWeight: '500',
  },
  noDataText: {
    textAlign: 'center',
    color: theme.colors.placeholder,
    paddingVertical: 32,
  },
});