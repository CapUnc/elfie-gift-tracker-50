import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, AlertCircle, Pencil, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useHousehold } from '@/hooks/useHousehold';
import { useAuth } from '@/hooks/useAuth';
import { useRecipients } from '@/hooks/useRecipients';
import { useBuyers } from '@/hooks/useBuyers';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { householdId } = useHousehold(user?.id);
  const { recipients } = useRecipients(householdId);
  const { buyers } = useBuyers(householdId);
  const { toast } = useToast();

  const [currency, setCurrency] = useState('$');
  const [householdName, setHouseholdName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHouseholdData = async () => {
      if (!householdId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('households')
          .select('currency, name')
          .eq('id', householdId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setCurrency(data.currency || '$');
          setHouseholdName(data.name || 'My Household');
        }
      } catch (error) {
        console.error('Error fetching household data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHouseholdData();
  }, [householdId]);

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);

    if (!householdId) return;

    try {
      const { error } = await supabase
        .from('households')
        .update({ currency: newCurrency })
        .eq('id', householdId);

      if (error) throw error;

      toast({
        title: 'Currency updated',
        description: 'Your preference has been saved',
      });
    } catch (error) {
      console.error('Error updating currency:', error);
      toast({
        title: 'Error',
        description: 'Could not update currency',
        variant: 'destructive',
      });
    }
  };

  const handleStartEditingName = () => {
    setTempName(householdName);
    setIsEditingName(true);
  };

  const handleCancelEditingName = () => {
    setTempName('');
    setIsEditingName(false);
  };

  const handleSaveHouseholdName = async () => {
    if (!householdId || !tempName.trim()) {
      toast({
        title: 'Error',
        description: 'Household name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('households')
        .update({ name: tempName.trim() })
        .eq('id', householdId);

      if (error) throw error;

      setHouseholdName(tempName.trim());
      setIsEditingName(false);
      toast({
        title: 'Household name updated',
        description: 'Your household name has been changed',
      });
    } catch (error) {
      console.error('Error updating household name:', error);
      toast({
        title: 'Error',
        description: 'Could not update household name',
        variant: 'destructive',
      });
    }
  };

  const ownBuyer = buyers.find(b => b.profile_id === user?.id);

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="space-y-4">
        <Card className="p-6 space-y-4">
          <h3 className="text-xl font-semibold">Household Name</h3>
          {isEditingName ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Enter household name"
                  autoFocus
                />
                <Button size="icon" variant="default" onClick={handleSaveHouseholdName}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={handleCancelEditingName}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium">{householdName}</p>
              <Button size="icon" variant="ghost" onClick={handleStartEditingName}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-xl font-semibold">Currency</h3>
          <div className="space-y-2">
            <Label>Display Currency</Label>
            <Select value={currency} onValueChange={handleCurrencyChange} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$">$ (USD)</SelectItem>
                <SelectItem value="€">€ (EUR)</SelectItem>
                <SelectItem value="£">£ (GBP)</SelectItem>
                <SelectItem value="¥">¥ (JPY)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/settings/recipients')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/settings/recipients')}
          tabIndex={0}
        >
          <h3 className="text-xl font-semibold mb-2">Manage Recipients</h3>
          <p className="text-muted-foreground mb-4">
            Add and manage people you're buying gifts for
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{recipients.length} recipients</span>
          </div>
        </Card>

        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/settings/buyers')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/settings/buyers')}
          tabIndex={0}
        >
          <h3 className="text-xl font-semibold mb-2">Your Profile</h3>
          <p className="text-muted-foreground mb-4">
            Configure your display name and emoji
          </p>
          <div className="flex items-center gap-2 text-sm">
            {ownBuyer ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{ownBuyer.emoji}</span>
                <span className="font-medium">{ownBuyer.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Not configured</span>
            )}
          </div>
        </Card>

        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/settings/household')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/settings/household')}
          tabIndex={0}
        >
          <h3 className="text-xl font-semibold mb-2">Household Sharing</h3>
          <p className="text-muted-foreground">
            Invite others and manage household members
          </p>
        </Card>

        <Card
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-primary/20"
          onClick={() => navigate('/join-household')}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/join-household')}
          tabIndex={0}
        >
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Join Another Household
          </h3>
          <p className="text-muted-foreground">
            Switch to a different household. Note: This will remove you from your current household.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
