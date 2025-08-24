import { Outlet } from "react-router-dom";

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Outlet />
    </div>
  );
};

export default PublicLayout;
