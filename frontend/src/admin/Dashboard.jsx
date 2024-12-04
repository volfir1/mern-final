// src/admin/dashboard/SalesDashboard.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, Bar, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, ShoppingBag, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useOrderApi } from '@/api/orderApi';
import Sidebar from '@/components/sidebar/Sidebar';
import api from '@/utils/api';

const StatCard = ({ icon: Icon, title, value, trend, isCurrency = false }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-semibold mt-1 text-gray-800">
          {isCurrency ? `₱${value.toLocaleString()}` : value.toLocaleString()}
        </h3>
      </div>
      <div className="bg-blue-100 p-3 rounded-full shadow-md">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
    {trend !== undefined && (
      <p className="text-sm mt-4 flex items-center">
        <span className={`font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
        <span className="text-gray-500 ml-2">vs last period</span>
      </p>
    )}
  </div>
);

const SalesDashboard = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [stats, setStats] = useState({
    totalSales: 0,
    avgOrderValue: 0,
    orderCount: 0,
    growth: 0
  });
  
  const orderApi = useOrderApi();

  const fetchSalesData = async () => {
    try {
      const ordersResponse = await orderApi.getAllOrders();
      const orders = ordersResponse.data;

      // Process monthly data
      const monthlyStats = orders.reduce((acc, order) => {
        if (order.orderStatus === 'DELIVERED') {
          const date = new Date(order.createdAt);
          const month = date.toLocaleString('default', { month: 'short' });
          
          if (!acc[month]) {
            acc[month] = { name: month, sales: 0, orders: 0 };
          }
          acc[month].sales += order.total;
          acc[month].orders += 1;
        }
        return acc;
      }, {});

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const fullMonthlyStats = months.map(month => ({
        name: month,
        sales: monthlyStats[month]?.sales || 0,
        orders: monthlyStats[month]?.orders || 0,
      }));

      setMonthlyData(fullMonthlyStats);

      // Process filtered data
      const filtered = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });

      const dailyStats = filtered.reduce((acc, order) => {
        if (order.orderStatus === 'DELIVERED') {
          const date = new Date(order.createdAt).toLocaleDateString();
          if (!acc[date]) {
            acc[date] = { name: date, sales: 0, orders: 0 };
          }
          acc[date].sales += order.total;
          acc[date].orders += 1;
        }
        return acc;
      }, {});

      setFilteredData(Object.values(dailyStats));

      // Calculate stats
      const totalSales = filtered.reduce((sum, order) => 
        order.orderStatus === 'DELIVERED' ? sum + order.total : sum, 0);
      
      const orderCount = filtered.filter(order => 
        order.orderStatus === 'DELIVERED').length;

      setStats({
        totalSales,
        avgOrderValue: orderCount ? totalSales / orderCount : 0,
        orderCount,
        growth: 12.5
      });

    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [startDate, endDate]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-20 p-6 overflow-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Sales Analytics</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={DollarSign} 
            title="Total Sales" 
            value={stats.totalSales} 
            trend={stats.growth}
            isCurrency={true}
          />
          <StatCard 
            icon={TrendingUp} 
            title="Average Order Value" 
            value={stats.avgOrderValue}
            trend={5.2}
            isCurrency={true}
          />
          <StatCard 
            icon={ShoppingBag} 
            title="Total Orders" 
            value={stats.orderCount}
            trend={8.1}
            isCurrency={false}
          />
          <StatCard 
            icon={Calendar} 
            title="Date Range" 
            value={`${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`}
            isCurrency={false}
          />
        </div>

        {/* Charts */}
        <div className="space-y-8">
          {/* Monthly Overview */}
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Monthly Sales Overview</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" name="Sales (₱)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filtered Sales Chart */}
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Detailed Sales Analysis</h2>
              <div className="flex gap-6">
                <DatePicker
                  selected={startDate}
                  onChange={setStartDate}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className="px-4 py-3 border rounded-lg shadow-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
                  dateFormat="yyyy/MM/dd"
                />
                <DatePicker
                  selected={endDate}
                  onChange={setEndDate}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  className="px-4 py-3 border rounded-lg shadow-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
                  dateFormat="yyyy/MM/dd"
                />
              </div>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#34D399" name="Sales (₱)" />
                  <Line type="monotone" dataKey="orders" stroke="#F97316" name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;