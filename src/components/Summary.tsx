import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Settings, Users, TrendingUp, Package, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Gift {
  id: string;
  name: string;
  cost: number | null;
  purchased: boolean;
  wrapped: boolean;
  trackingNumber?: string;
  carrier?: string;
}

interface Person {
  id: string;
  name: string;
  gifts: Gift[];
  notes: string;
  assignedTo: string | null;
}

const Summary = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [buyers, setBuyers] = useState<string[]>(['Matt', 'Maddie']);
  const [currency, setCurrency] = useState('$');

  // Load data from localStorage
  useEffect(() => {
    const savedPeople = localStorage.getItem('christmas-gifts-2025');
    if (savedPeople) {
      setPeople(JSON.parse(savedPeople));
    }

    const savedBuyers = localStorage.getItem('christmas-gifts-buyers');
    if (savedBuyers) {
      setBuyers(JSON.parse(savedBuyers));
    }

    const savedCurrency = localStorage.getItem('christmas-gifts-currency');
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const allGifts = people.flatMap(person => person.gifts);
    const totalCost = allGifts.reduce((sum, gift) => sum + (gift.cost || 0), 0);
    const giftsWithoutCost = allGifts.filter(gift => gift.cost === null).length;
    const purchasedGifts = allGifts.filter(gift => gift.purchased);
    const wrappedGifts = allGifts.filter(gift => gift.wrapped);
    const peopleWithGifts = people.filter(person => person.gifts.length > 0);
    const peopleWithoutGifts = people.filter(person => person.gifts.length === 0);

    // Buyer statistics
    const buyerStats = buyers.map(buyer => {
      const assignedPeople = people.filter(person => person.assignedTo === buyer);
      const buyerGifts = assignedPeople.flatMap(person => person.gifts);
      const buyerCost = buyerGifts.reduce((sum, gift) => sum + (gift.cost || 0), 0);
      const buyerPurchased = buyerGifts.filter(gift => gift.purchased).length;
      const buyerWrapped = buyerGifts.filter(gift => gift.wrapped).length;

      return {
        name: buyer,
        people: assignedPeople.length,
        gifts: buyerGifts.length,
        cost: buyerCost,
        purchased: buyerPurchased,
        wrapped: buyerWrapped,
        purchaseProgress: buyerGifts.length > 0 ? (buyerPurchased / buyerGifts.length) * 100 : 0,
        wrappingProgress: buyerGifts.length > 0 ? (buyerWrapped / buyerGifts.length) * 100 : 0
      };
    });

    return {
      totalPeople: people.length,
      peopleWithGifts: peopleWithGifts.length,
      peopleWithoutGifts: peopleWithoutGifts.length,
      totalGifts: allGifts.length,
      totalCost,
      giftsWithoutCost,
      averageCostPerGift: allGifts.length > 0 ? totalCost / allGifts.length : 0,
      averageCostPerPerson: peopleWithGifts.length > 0 ? totalCost / peopleWithGifts.length : 0,
      purchasedCount: purchasedGifts.length,
      wrappedCount: wrappedGifts.length,
      purchaseProgress: allGifts.length > 0 ? (purchasedGifts.length / allGifts.length) * 100 : 0,
      wrappingProgress: allGifts.length > 0 ? (wrappedGifts.length / allGifts.length) * 100 : 0,
      buyerStats: buyers.length > 1 ? buyerStats : []
    };
  }, [people, buyers]);

  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 flex items-center justify-center gap-3">
            <Gift className="text-christmas-red" />
            Christmas 2025 Summary
            <Gift className="text-christmas-green" />
          </h1>
          <p className="text-muted-foreground mb-6">Your holiday gift planning at a glance</p>
          
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate('/gifts')}
              className="bg-gradient-festive hover:opacity-90 text-white shadow-festive"
            >
              <Package className="w-4 h-4 mr-2" />
              Manage Gifts
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Main Statistics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* People Statistics */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total People</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPeople}</div>
              <p className="text-xs text-muted-foreground">
                {stats.peopleWithGifts} with gifts, {stats.peopleWithoutGifts} without
              </p>
            </CardContent>
          </Card>

          {/* Total Cost */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalCost)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.giftsWithoutCost > 0 ? `Partial total (${stats.giftsWithoutCost} gifts TBD)` : `Avg: ${formatCurrency(stats.averageCostPerPerson)} per person`}
              </p>
            </CardContent>
          </Card>

          {/* Total Gifts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gifts</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGifts}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(stats.averageCostPerGift)} per gift
              </p>
            </CardContent>
          </Card>

          {/* Purchase Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchased</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.purchasedCount}/{stats.totalGifts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.purchaseProgress.toFixed(0)}% complete
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Purchase Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-christmas-green" />
                Purchase Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Purchased</span>
                <span>{stats.purchasedCount} of {stats.totalGifts} gifts</span>
              </div>
              <Progress value={stats.purchaseProgress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {stats.totalGifts - stats.purchasedCount} gifts remaining to purchase
              </p>
            </CardContent>
          </Card>

          {/* Wrapping Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-christmas-red" />
                Wrapping Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Wrapped</span>
                <span>{stats.wrappedCount} of {stats.totalGifts} gifts</span>
              </div>
              <Progress value={stats.wrappingProgress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {stats.totalGifts - stats.wrappedCount} gifts remaining to wrap
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Buyer Statistics (only show if multiple buyers) */}
        {stats.buyerStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Buyer Breakdown
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {stats.buyerStats.map((buyer) => (
                <Card key={buyer.name}>
                  <CardHeader>
                    <CardTitle className="text-lg">{buyer.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">People:</span>
                        <span className="ml-2 font-medium">{buyer.people}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gifts:</span>
                        <span className="ml-2 font-medium">{buyer.gifts}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Total Cost:</span>
                        <span className="ml-2 font-medium">{formatCurrency(buyer.cost)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Purchased</span>
                        <span>{buyer.purchased} of {buyer.gifts}</span>
                      </div>
                      <Progress value={buyer.purchaseProgress} className="h-2" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Wrapped</span>
                        <span>{buyer.wrapped} of {buyer.gifts}</span>
                      </div>
                      <Progress value={buyer.wrappingProgress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {stats.totalGifts === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No gifts added yet</h3>
              <p className="text-muted-foreground mb-6">
                Start planning your Christmas gifts by adding people and their gift ideas
              </p>
              <Button
                onClick={() => navigate('/gifts')}
                className="bg-gradient-festive hover:opacity-90 text-white shadow-festive"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {stats.peopleWithoutGifts > 0 && (
                  <p>• Add gifts for {stats.peopleWithoutGifts} people who don't have any yet</p>
                )}
                {stats.totalGifts - stats.purchasedCount > 0 && (
                  <p>• Purchase {stats.totalGifts - stats.purchasedCount} remaining gifts</p>
                )}
                {stats.totalGifts - stats.wrappedCount > 0 && (
                  <p>• Wrap {stats.totalGifts - stats.wrappedCount} remaining gifts</p>
                )}
                {stats.totalGifts === stats.purchasedCount && stats.totalGifts === stats.wrappedCount && (
                  <p className="text-christmas-green font-medium">🎉 All gifts purchased and wrapped! You're ready for Christmas!</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Summary;