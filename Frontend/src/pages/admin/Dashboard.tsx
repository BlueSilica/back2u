import {
  Users,
  Package,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  UserPlus,
} from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Welcome to the admin dashboard. Monitor your lost and found system.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Items */}
        <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Items
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                156
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                +12 this week
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Users
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                1,234
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                +89 this month
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/40 transition-colors">
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Matches */}
        <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Successful Matches
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                89
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                +5 today
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 transition-colors">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Pending Reports */}
        <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Pending Reports
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                3
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                Needs attention
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-800/40 transition-colors">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                New item posted: Diamond Ring
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />2 hours ago
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Item matched: Blue Bicycle Helmet
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />4 hours ago
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                New user registered: Alex Thompson
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />6 hours ago
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
