import { Package } from "lucide-react";

const AdminItems = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">
          Items
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2">
          Manage lost and found items, approve pending submissions.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center space-y-4">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <Package className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Items Management Interface
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Comprehensive item management system coming soon.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-left">
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">
              Planned Features:
            </h4>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>• Advanced items table with sorting and pagination</li>
              <li>• Smart status filtering and search functionality</li>
              <li>• Streamlined approval workflow</li>
              <li>• Detailed item information and image gallery</li>
              <li>• Bulk actions and export capabilities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminItems;
