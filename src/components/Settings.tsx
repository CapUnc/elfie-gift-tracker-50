import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings as SettingsIcon, Plus, Trash2, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

interface Person {
  id: string;
  name: string;
  gifts: any[];
  notes: string;
  assignedTo: string | null;
}

const Settings = () => {
  const navigate = useNavigate();
  const [buyers, setBuyers] = useState<string[]>(['Matt', 'Maddie']);
  const [newBuyer, setNewBuyer] = useState('');
  const [bulkNames, setBulkNames] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null);
  const [currency, setCurrency] = useState('$');

  // Load buyers from localStorage
  useEffect(() => {
    const savedBuyers = localStorage.getItem('christmas-gifts-buyers');
    if (savedBuyers) {
      setBuyers(JSON.parse(savedBuyers));
    }
  }, []);

  // Load people from localStorage
  useEffect(() => {
    const savedPeople = localStorage.getItem('christmas-gifts-2025');
    if (savedPeople) {
      setPeople(JSON.parse(savedPeople));
    }
  }, []);

  // Load currency from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('christmas-gifts-currency');
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  // Save buyers to localStorage
  useEffect(() => {
    localStorage.setItem('christmas-gifts-buyers', JSON.stringify(buyers));
  }, [buyers]);

  // Save currency to localStorage
  useEffect(() => {
    localStorage.setItem('christmas-gifts-currency', currency);
  }, [currency]);

  const addBuyer = () => {
    if (!newBuyer.trim() || buyers.includes(newBuyer.trim())) return;
    setBuyers([...buyers, newBuyer.trim()]);
    setNewBuyer('');
  };

  const removeBuyer = (buyerToRemove: string) => {
    setBuyers(buyers.filter(buyer => buyer !== buyerToRemove));
    
    // Clean up assignments for people assigned to the deleted buyer
    const updatedPeople = people.map(person => 
      person.assignedTo === buyerToRemove 
        ? { ...person, assignedTo: null }
        : person
    );
    setPeople(updatedPeople);
    localStorage.setItem('christmas-gifts-2025', JSON.stringify(updatedPeople));
  };

  const handleBulkAdd = () => {
    if (!bulkNames.trim()) return;

    const names = bulkNames
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) return;

    // Filter out duplicates
    const existingNames = people.map(person => person.name.toLowerCase());
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

    // Add to existing people and update state
    const updatedPeople = [...people, ...newPeople];
    setPeople(updatedPeople);
    localStorage.setItem('christmas-gifts-2025', JSON.stringify(updatedPeople));

    setBulkNames('');
    alert(`Added ${newNames.length} new people: ${newNames.join(', ')}`);
  };

  const deletePerson = (personToDelete: Person) => {
    const updatedPeople = people.filter(person => person.id !== personToDelete.id);
    setPeople(updatedPeople);
    localStorage.setItem('christmas-gifts-2025', JSON.stringify(updatedPeople));
    setDeletingPerson(null);
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
            Back to Summary
          </Button>
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Settings</h1>
          </div>
        </div>

        <div className="grid gap-6">
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
                  <SelectTrigger className="w-full">
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
                  This will be used throughout the app to display gift costs and totals.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Manage Recipients Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Manage Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bulk Add */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Bulk Add People</h3>
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
              </div>

              {/* Delete People */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Delete People</h3>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Current Recipients ({people.length} total)
                  </label>
                  {people.length > 0 ? (
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-muted/30">
                      {people.map((person) => (
                        <Badge
                          key={person.id}
                          variant="secondary"
                          className="flex items-center gap-2 px-3 py-1"
                        >
                          {person.name}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 hover:bg-transparent"
                                onClick={() => setDeletingPerson(person)}
                              >
                                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {person.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete {person.name} and all associated data:
                                  <br />• {person.gifts.length} gift{person.gifts.length !== 1 ? 's' : ''}
                                  <br />• Notes: {person.notes ? 'Yes' : 'None'}
                                  <br />• Assignment: {person.assignedTo || '(blank)'}
                                  <br /><br />
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletePerson(person)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic p-3 bg-muted/30 rounded-md">
                      No recipients added yet. Use the bulk add feature above to get started.
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Warning:</strong> Deleting a person will remove all their gifts, notes, and assignments permanently.
                </p>
              </div>
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

              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  Buyers are the people who can be assigned to purchase gifts. Changes will apply to all assignment dropdowns.
                </p>
                <p className="bg-muted/50 p-2 rounded border-l-2 border-primary/50">
                  <strong>Note:</strong> The assignment column will only appear in the gift tracker when you have more than one buyer. This keeps the interface clean for solo users while enabling collaboration for couples, families, or groups.
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