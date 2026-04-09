import { Outlet } from 'react-router-dom';
import TopNavigation from './TopNavigation';
import ProtectedRoute from './ProtectedRoute';

const ProtectedLayout = () => {
  return (
    <ProtectedRoute>
      <TopNavigation />
      <Outlet />
    </ProtectedRoute>
  );
};

export default ProtectedLayout;
