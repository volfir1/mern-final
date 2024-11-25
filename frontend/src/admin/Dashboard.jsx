import React from 'react';
import { LineChart, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, Bar, ResponsiveContainer } from 'recharts';
import { Activity, Users, DollarSign, ShoppingBag, Bell, Search } from 'lucide-react';
import Sidebar from "../components/sidebar/Sidebar";

const mockChartData = [
  { name: 'Jan', sales: 4000, users: 2400 },
  { name: 'Feb', sales: 3000, users: 1398 },
  { name: 'Mar', sales: 2000, users: 9800 },
  { name: 'Apr', sales: 2780, users: 3908 },
  { name: 'May', sales: 1890, users: 4800 },
  { name: 'Jun', sales: 2390, users: 3800 },
];

const mockActivityData = [
  { id: 1, user: "John Doe", action: "Created new account", time: "2 minutes ago" },
  { id: 2, user: "Jane Smith", action: "Made a purchase", time: "5 minutes ago" },
  { id: 3, user: "Bob Johnson", action: "Updated profile", time: "10 minutes ago" },
  { id: 4, user: "Alice Brown", action: "Submitted review", time: "15 minutes ago" },
];

const StatCard = ({ icon: Icon, title, value, trend }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h3 className="text-2xl font-semibold mt-1">{value}</h3>
      </div>
      <div className="bg-blue-50 p-3 rounded-full">
        <Icon className="w-6 h-6 text-blue-500" />
      </div>
    </div>
    <p className="text-sm mt-4">
      <span className={`font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {trend >= 0 ? '+' : ''}{trend}%
      </span>
      <span className="text-gray-500 ml-2">from last month</span>
    </p>
  </div>
);

const AdminDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main content with proper padding for sidebar */}
      <div className="flex-1 ml-20 overflow-x-hidden overflow-y-auto"> {/* Added ml-20 for sidebar width */}
        {/* Top Navigation */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-5 h-5 text-gray-500 absolute left-3 top-2.5" />
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              <img
                src="/api/placeholder/32/32"
                alt="User"
                className="w-8 h-8 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard icon={Users} title="Total Users" value="2,543" trend={12.5} />
            <StatCard icon={ShoppingBag} title="Total Orders" value="1,235" trend={-2.4} />
            <StatCard icon={DollarSign} title="Total Sales" value="$45,678" trend={8.7} />
            <StatCard icon={Activity} title="Active Users" value="892" trend={5.1} />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Sales Overview</h2>
              <div className="h-[300px] w-full"> {/* Fixed height container */}
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#3b82f6" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">User Growth</h2>
              <div className="h-[300px] w-full"> {/* Fixed height container */}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="users" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {mockActivityData.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-50 p-2 rounded-full">
                        <Activity className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">{activity.user}</p>
                        <p className="text-sm text-gray-500">{activity.action}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;