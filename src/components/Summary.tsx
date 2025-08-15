import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { Gift, DollarSign, Users, Package, Settings, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { differenceInDays } from 'date-fns';

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
  completed?: boolean;
}

interface Buyer {
  id: string;
  name: string;
  emoji: string;
}

const Summary = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([
    { id: '1', name: 'Matt', emoji: '👨' },
    { id: '2', name: 'Maddie', emoji: '👩' }
  ]);
  const [currency, setCurrency] = useState('$');

  // Load data from localStorage
  useEffect(() => {
    const savedPeople = localStorage.getItem('christmas-gifts-2025');
    if (savedPeople) {
      setPeople(JSON.parse(savedPeople));
    }

    const savedBuyers = localStorage.getItem('christmas-gifts-buyers');
    if (savedBuyers) {
      const parsed = JSON.parse(savedBuyers);
      // Handle migration from old string array format
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
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

    const savedCurrency = localStorage.getItem('christmas-gifts-currency');
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  // Calculate Christmas countdown
  const christmasCountdown = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const christmasThisYear = new Date(currentYear, 11, 25); // December 25
    const christmasNextYear = new Date(currentYear + 1, 11, 25);
    
    // If Christmas has passed this year, calculate for next year
    const targetChristmas = today > christmasThisYear ? christmasNextYear : christmasThisYear;
    const daysUntil = differenceInDays(targetChristmas, today);
    
    return {
      daysUntil,
      year: targetChristmas.getFullYear()
    };
  }, []);

  // Calculate statistics
  const overallStats = useMemo(() => {
    const totalPeople = people.length;
    const completedPeople = people.filter(person => person.completed === true).length;
    const totalGifts = people.reduce((sum, person) => sum + person.gifts.length, 0);
    const totalCost = people.reduce((sum, person) => 
      sum + person.gifts.reduce((giftSum, gift) => giftSum + (gift.cost || 0), 0), 0
    );
    const purchasedGifts = people.reduce((sum, person) => 
      sum + person.gifts.filter(gift => gift.purchased).length, 0
    );
    const wrappedGifts = people.reduce((sum, person) => 
      sum + person.gifts.filter(gift => gift.wrapped).length, 0
    );

    const totalGiftsWithoutCost = people.reduce((sum, person) => 
      sum + person.gifts.filter(gift => gift.cost === null).length, 0
    );

    return {
      totalPeople,
      completedPeople,
      totalGifts,
      totalCost,
      purchasedGifts,
      wrappedGifts,
      totalGiftsWithoutCost,
      purchaseProgress: totalGifts > 0 ? (purchasedGifts / totalGifts) * 100 : 0,
      wrappingProgress: totalGifts > 0 ? (wrappedGifts / totalGifts) * 100 : 0,
      completionProgress: totalPeople > 0 ? (completedPeople / totalPeople) * 100 : 0
    };
  }, [people]);

  // Calculate buyer statistics
  const buyerStats = useMemo(() => {
    if (buyers.length <= 1) return [];
    
    return buyers.map(buyer => {
      const assignedPeople = people.filter(person => person.assignedTo === buyer.name);
      const completedAssignedPeople = assignedPeople.filter(person => person.completed === true).length;
      const buyerGifts = assignedPeople.flatMap(person => person.gifts);
      const buyerCost = buyerGifts.reduce((sum, gift) => sum + (gift.cost || 0), 0);
      const buyerPurchased = buyerGifts.filter(gift => gift.purchased).length;
      const buyerWrapped = buyerGifts.filter(gift => gift.wrapped).length;

      return {
        name: buyer.name,
        people: assignedPeople.length,
        completedPeople: completedAssignedPeople,
        gifts: buyerGifts.length,
        cost: buyerCost,
        purchased: buyerPurchased,
        wrapped: buyerWrapped,
        purchaseProgress: buyerGifts.length > 0 ? (buyerPurchased / buyerGifts.length) * 100 : 0,
        wrappingProgress: buyerGifts.length > 0 ? (buyerWrapped / buyerGifts.length) * 100 : 0,
        completionProgress: assignedPeople.length > 0 ? (completedAssignedPeople / assignedPeople.length) * 100 : 0
      };
    });
  }, [people, buyers]);

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header with Quick Actions */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">Christmas Planning</h1>
              <p className="text-sm text-muted-foreground">Gift planning overview</p>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="flex gap-2 sm:flex-shrink-0">
              <Button 
                onClick={() => navigate('/gifts')}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <Users className="h-4 w-4 mr-2" />
                Add Person
              </Button>
              <Button 
                onClick={() => navigate('/gifts')}
                className="flex-1 sm:flex-none bg-gradient-festive hover:opacity-90 text-white"
              >
                <Gift className="h-4 w-4 mr-2" />
                Add Gift
              </Button>
            </div>
          </div>

          {/* Compact Countdown Pill */}
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-festive text-white rounded-full shadow-festive">
              <span className="text-lg">🎄</span>
              <span className="font-semibold">
                {christmasCountdown.daysUntil === 0 
                  ? "Merry Christmas!" 
                  : christmasCountdown.daysUntil < 0 
                    ? `Christmas was ${Math.abs(christmasCountdown.daysUntil)} days ago` 
                    : `${christmasCountdown.daysUntil} days`
                }
              </span>
            </div>
            {christmasCountdown.daysUntil > 0 && (
              <span className="text-sm text-muted-foreground">
                until Christmas {christmasCountdown.year}
              </span>
            )}
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total People</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalPeople}</div>
              {overallStats.completedPeople > 0 && (
                <p className="text-xs text-muted-foreground">
                  {overallStats.completedPeople} shopping complete
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overallStats.totalGiftsWithoutCost > 0 ? 'Partial: ' : ''}{formatCurrency(overallStats.totalCost, currency)}
              </div>
              {overallStats.totalGiftsWithoutCost > 0 && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {overallStats.totalGiftsWithoutCost} gift{overallStats.totalGiftsWithoutCost > 1 ? 's' : ''} without cost
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gifts</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalGifts}</div>
            </CardContent>
          </Card>

        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Shopping Completion</CardTitle>
              <CardDescription>
                {overallStats.completedPeople} of {overallStats.totalPeople} people complete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={overallStats.completionProgress} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                {overallStats.completionProgress.toFixed(1)}% complete
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Purchase Progress</CardTitle>
              <CardDescription>
                {overallStats.purchasedGifts} of {overallStats.totalGifts} gifts purchased
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={overallStats.purchaseProgress} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                {overallStats.purchaseProgress.toFixed(1)}% complete
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wrapping Progress</CardTitle>
              <CardDescription>
                {overallStats.wrappedGifts} of {overallStats.totalGifts} gifts wrapped
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={overallStats.wrappingProgress} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                {overallStats.wrappingProgress.toFixed(1)}% complete
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Buyer Statistics */}
        {buyerStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Buyer Breakdown
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {buyerStats.map((buyer) => (
                <Card key={buyer.name}>
                  <CardHeader>
                    <CardTitle className="text-lg">{buyer.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">People:</span>
                        <span className="ml-2 font-medium">{buyer.people}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Complete:</span>
                        <span className="ml-2 font-medium">{buyer.completedPeople}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gifts:</span>
                        <span className="ml-2 font-medium">{buyer.gifts}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Cost:</span>
                        <span className="ml-2 font-medium">{formatCurrency(buyer.cost, currency)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Shopping Complete</span>
                        <span>{buyer.completedPeople} of {buyer.people}</span>
                      </div>
                      <Progress value={buyer.completionProgress} className="h-2" />
                      
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
        {overallStats.totalGifts === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No gifts added yet</h3>
              <p className="text-muted-foreground mb-6">
                Start planning your Christmas gifts by adding people and their gift ideas
              </p>
              <Button
                onClick={() => navigate('/gifts')}
                className="bg-gradient-festive hover:opacity-90 text-white shadow-festive min-h-[44px] sm:min-h-auto"
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {overallStats.totalPeople - overallStats.completedPeople > 0 && (
                  <p>• Complete shopping for {overallStats.totalPeople - overallStats.completedPeople} people</p>
                )}
                {overallStats.totalGifts - overallStats.purchasedGifts > 0 && (
                  <p>• Purchase {overallStats.totalGifts - overallStats.purchasedGifts} remaining gifts</p>
                )}
                {overallStats.totalGifts - overallStats.wrappedGifts > 0 && (
                  <p>• Wrap {overallStats.totalGifts - overallStats.wrappedGifts} remaining gifts</p>
                )}
                {overallStats.totalGiftsWithoutCost > 0 && (
                  <p>• Set costs for {overallStats.totalGiftsWithoutCost} gifts</p>
                )}
                {overallStats.totalPeople === overallStats.completedPeople && 
                 overallStats.totalGifts === overallStats.purchasedGifts && 
                 overallStats.totalGifts === overallStats.wrappedGifts && (
                  <p className="text-christmas-green font-medium">🎉 All shopping complete! You're ready for Christmas!</p>
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