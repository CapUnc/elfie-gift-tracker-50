import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import TemplatesManager from '@/components/settings/TemplatesManager';

const TemplatesPage = () => {
  const { user } = useAuth();
  const { householdId } = useHousehold(user?.id);

  return <TemplatesManager householdId={householdId} />;
};

export default TemplatesPage;
