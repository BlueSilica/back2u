import { Users } from "lucide-react";

const AdminUsers = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
          Users
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2">
          Manage users, roles, and account status.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center space-y-4">
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              User Management Interface
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Complete user administration system under construction.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-left">
            <h4 className="font-medium text-slate-900 dark:text-white mb-2">
              Planned Features:
            </h4>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>• Interactive user directory with avatars</li>
              <li>• Advanced search and filtering options</li>
              <li>• Granular role and permission management</li>
              <li>• Account status controls and suspension tools</li>
              <li>• User activity monitoring and analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
