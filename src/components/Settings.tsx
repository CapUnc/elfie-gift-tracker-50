import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings as SettingsIcon, DollarSign, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

interface Person {
  id: string;
  name: string;
  gifts: any[];
  notes: string;
  assignedTo: string | null;
}

interface Buyer {
  id: string;
  name: string;
  emoji: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState('$');
  const [people, setPeople] = useState<Person[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);

  // Load currency from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('christmas-gifts-currency');
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  // Load recipients from localStorage
  useEffect(() => {
    const savedPeople = localStorage.getItem('christmas-gifts-2025');
    if (savedPeople) {
      setPeople(JSON.parse(savedPeople));
    }
  }, []);

  // Load buyers from localStorage
  useEffect(() => {
    const savedBuyers = localStorage.getItem('christmas-gifts-buyers');
    if (savedBuyers) {
      const parsed = JSON.parse(savedBuyers);
      // Handle migration from old string array format
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
        const migratedBuyers = parsed.map((name: string, index: number) => ({
          id: (index + 1).toString(),
          name,
          emoji: index === 0 ? '👨' : '👩'
        }));
        setBuyers(migratedBuyers);
      } else {
        setBuyers(parsed);
      }
    }
  }, []);

  // Save currency to localStorage
  useEffect(() => {
    localStorage.setItem('christmas-gifts-currency', currency);
  }, [currency]);

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
                <Select value={currency} onValueChange={setCurrency}>
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
            aria-label={`Manage Recipients - ${people.length} recipient${people.length !== 1 ? 's' : ''} added`}
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
                  {people.length} recipient{people.length !== 1 ? 's' : ''} added
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
        </div>
      </div>
    </div>
  );
};

export default Settings;