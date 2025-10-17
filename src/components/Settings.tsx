import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings as SettingsIcon, DollarSign, Users, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import { useBuyers } from '@/hooks/useBuyers';
import { useRecipients } from '@/hooks/useRecipients';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { householdId, loading: householdLoading } = useHousehold(session?.user?.id);
  const { buyers } = useBuyers(householdId);
  const { recipients } = useRecipients(householdId);
  const { toast } = useToast();
  const [currency, setCurrency] = useState('$');
  const [loadingCurrency, setLoadingCurrency] = useState(true);

  // Load currency from Supabase household
  useEffect(() => {
    const fetchCurrency = async () => {
      if (!householdId) {
        setLoadingCurrency(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('households')
          .select('currency')
          .eq('id', householdId)
          .single();

        if (error) throw error;
        if (data?.currency) {
          setCurrency(data.currency);
        }
      } catch (error) {
        console.error('Error fetching currency:', error);
      } finally {
        setLoadingCurrency(false);
      }
    };

    fetchCurrency();
  }, [householdId]);

  // Save currency to Supabase
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
        description: 'Your currency preference has been saved.',
      });
    } catch (error) {
      console.error('Error updating currency:', error);
      toast({
        title: 'Error updating currency',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 min-h-[44px] touch-target focus-ring"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Summary
          </Button>
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Settings</h1>
          </div>
        </div>

        <div className="space-y-6">
          {/* Currency Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Currency
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Select Currency Symbol
                </label>
                <Select value={currency} onValueChange={handleCurrencyChange} disabled={loadingCurrency}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">$ (USD - US Dollar)</SelectItem>
                    <SelectItem value="€">€ (EUR - Euro)</SelectItem>
                    <SelectItem value="£">£ (GBP - British Pound)</SelectItem>
                    <SelectItem value="C$">C$ (CAD - Canadian Dollar)</SelectItem>
                    <SelectItem value="A$">A$ (AUD - Australian Dollar)</SelectItem>
                    <SelectItem value="¥">¥ (JPY - Japanese Yen)</SelectItem>
                    <SelectItem value="CHF">CHF (Swiss Franc)</SelectItem>
                    <SelectItem value="kr">kr (SEK/NOK/DKK)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  This only changes the display symbol - existing prices are not converted.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recipients Section */}
          <Card 
            className="cursor-pointer hover:bg-muted/30 transition-colors min-h-[44px] touch-target focus-ring" 
            onClick={() => navigate('/settings/recipients')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/settings/recipients');
              }
            }}
            aria-label={`Manage Recipients - ${recipients.length} recipient${recipients.length !== 1 ? 's' : ''} added`}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Manage Recipients
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {recipients.length} recipient{recipients.length !== 1 ? 's' : ''} added
                </div>
                <p className="text-xs text-muted-foreground">
                  Add multiple recipients at once or delete existing ones.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Buyers Section */}
          <Card 
            className="cursor-pointer hover:bg-muted/30 transition-colors min-h-[44px] touch-target focus-ring" 
            onClick={() => navigate('/settings/buyers')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/settings/buyers');
              }
            }}
            aria-label={`Manage Buyers - ${buyers.length} buyer${buyers.length !== 1 ? 's' : ''} configured`}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Manage Buyers
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {buyers.length} buyer{buyers.length !== 1 ? 's' : ''} configured
                </div>
                <div className="flex flex-wrap gap-1">
                  {buyers.slice(0, 3).map((buyer) => (
                    <span key={buyer.id} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded text-xs">
                      {buyer.emoji} {buyer.name}
                    </span>
                  ))}
                  {buyers.length > 3 && (
                    <span className="text-xs text-muted-foreground px-2 py-1">
                      +{buyers.length - 3} more
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Add or edit the people who will be buying gifts.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Household Section */}
          <Card 
            className="cursor-pointer hover:bg-muted/30 transition-colors min-h-[44px] touch-target focus-ring" 
            onClick={() => navigate('/settings/household')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/settings/household');
              }
            }}
            aria-label="Manage Household - Share your list with others"
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Household Sharing
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Share your gift list with family members
                </p>
                <p className="text-xs text-muted-foreground">
                  Generate invite codes and see who's in your household.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;