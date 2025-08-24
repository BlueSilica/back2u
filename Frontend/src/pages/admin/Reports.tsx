import { AlertTriangle } from "lucide-react";

const AdminReports = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
          Reports
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2">
          Review and moderate user reports and content violations.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center space-y-4">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Reports Management Interface
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Advanced moderation tools and reporting system in development.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-left">
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">
              Planned Features:
            </h4>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>• Comprehensive reports dashboard</li>
              <li>• Priority-based status filtering</li>
              <li>• Quick moderation actions</li>
              <li>• Detailed resolution tracking</li>
              <li>• Automated violation detection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
