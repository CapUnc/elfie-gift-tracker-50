import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings as SettingsIcon, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState<string[]>(['Matt', 'Maddie']);
  const [newBuyer, setNewBuyer] = useState('');
  const [bulkNames, setBulkNames] = useState('');

  // Load buyers from localStorage
  useEffect(() => {
    const savedBuyers = localStorage.getItem('christmas-gifts-buyers');
    if (savedBuyers) {
      setBuyers(JSON.parse(savedBuyers));
    }
  }, []);

  // Save buyers to localStorage
  useEffect(() => {
    localStorage.setItem('christmas-gifts-buyers', JSON.stringify(buyers));
  }, [buyers]);

  const addBuyer = () => {
    if (!newBuyer.trim() || buyers.includes(newBuyer.trim())) return;
    setBuyers([...buyers, newBuyer.trim()]);
    setNewBuyer('');
  };

  const removeBuyer = (buyerToRemove: string) => {
    setBuyers(buyers.filter(buyer => buyer !== buyerToRemove));
  };

  const handleBulkAdd = () => {
    if (!bulkNames.trim()) return;

    const names = bulkNames
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) return;

    // Get existing people
    const existingPeople = JSON.parse(localStorage.getItem('christmas-gifts-2025') || '[]');
    const existingNames = existingPeople.map((person: any) => person.name.toLowerCase());

    // Filter out duplicates
    const newNames = names.filter(name => !existingNames.includes(name.toLowerCase()));

    if (newNames.length === 0) {
      alert('All names already exist in your list!');
      return;
    }

    // Create new people objects
    const newPeople = newNames.map((name, index) => ({
      id: (Date.now() + index).toString(),
      name: name,
      gifts: [],
      notes: '',
      assignedTo: null
    }));

    // Add to existing people
    const updatedPeople = [...existingPeople, ...newPeople];
    localStorage.setItem('christmas-gifts-2025', JSON.stringify(updatedPeople));

    setBulkNames('');
    alert(`Added ${newNames.length} new people: ${newNames.join(', ')}`);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Gift Tracker
          </Button>
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Settings</h1>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Bulk Add Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Bulk Add People
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Add multiple people (comma-separated)
                </label>
                <Textarea
                  placeholder="John Doe, Jane Smith, Bob Johnson, etc..."
                  value={bulkNames}
                  onChange={(e) => setBulkNames(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
              <Button onClick={handleBulkAdd} className="w-full">
                Add People
              </Button>
              <p className="text-xs text-muted-foreground">
                Names will be added as unassigned. You can assign them to buyers later.
              </p>
            </CardContent>
          </Card>

          {/* Buyers Management Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Manage Buyers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Current Buyers
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {buyers.map((buyer) => (
                    <Badge
                      key={buyer}
                      variant="secondary"
                      className="flex items-center gap-2 px-3 py-1"
                    >
                      {buyer}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBuyer(buyer)}
                        className="h-auto p-0 hover:bg-transparent"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Add New Buyer
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Buyer name"
                    value={newBuyer}
                    onChange={(e) => setNewBuyer(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addBuyer()}
                  />
                  <Button onClick={addBuyer}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Buyers are the people who can be assigned to purchase gifts. Changes will apply to all assignment dropdowns.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;