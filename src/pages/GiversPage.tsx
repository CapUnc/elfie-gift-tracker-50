import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import GiversManager from '@/components/settings/GiversManager';

const GiversPage = () => {
  const { user } = useAuth();
  const { householdId } = useHousehold(user?.id);

  return <GiversManager householdId={householdId} />;
};

export default GiversPage;
