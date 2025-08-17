import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { Gift, DollarSign, Users, Package, Settings, CheckCircle, AlertCircle, Calendar, ChevronDown, Eye, EyeOff, ChevronRight, ShoppingCart, Coins } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { pluralize } from '@/lib/utils';
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
    const giftsCostSet = totalGifts - totalGiftsWithoutCost;

    return {
      totalPeople,
      completedPeople,
      totalGifts,
      totalCost,
      purchasedGifts,
      wrappedGifts,
      totalGiftsWithoutCost,
      giftsCostSet,
      purchaseProgress: totalGifts > 0 ? (purchasedGifts / totalGifts) * 100 : 0,
      wrappingProgress: totalGifts > 0 ? (wrappedGifts / totalGifts) * 100 : 0,
      completionProgress: totalPeople > 0 ? (completedPeople / totalPeople) * 100 : 0
    };
  }, [people]);

  // Calculate enhanced buyer statistics with remaining tasks
  const [showAllBuyers, setShowAllBuyers] = useState(false);
  
  const buyerStats = useMemo(() => {
    if (buyers.length <= 1) return [];
    
    const stats = buyers.map(buyer => {
      const assignedPeople = people.filter(person => person.assignedTo === buyer.id);
      const completedAssignedPeople = assignedPeople.filter(person => person.completed === true).length;
      const buyerGifts = assignedPeople.flatMap(person => person.gifts);
      const buyerCost = buyerGifts.reduce((sum, gift) => sum + (gift.cost || 0), 0);
      const buyerPurchased = buyerGifts.filter(gift => gift.purchased).length;
      const buyerWrapped = buyerGifts.filter(gift => gift.wrapped).length;

      // Calculate remaining tasks
      const remainingToShop = assignedPeople.length - completedAssignedPeople;
      const remainingToPurchase = buyerGifts.length - buyerPurchased;
      const remainingToWrap = buyerGifts.length - buyerWrapped;
      const totalRemaining = remainingToShop + remainingToPurchase + remainingToWrap;

      return {
        id: buyer.id,
        name: buyer.name,
        emoji: buyer.emoji,
        people: assignedPeople.length,
        completedPeople: completedAssignedPeople,
        gifts: buyerGifts.length,
        cost: buyerCost,
        purchased: buyerPurchased,
        wrapped: buyerWrapped,
        remainingToShop,
        remainingToPurchase,
        remainingToWrap,
        totalRemaining,
        isCompleted: totalRemaining === 0,
        assignedPeople,
        buyerGifts,
        purchaseProgress: buyerGifts.length > 0 ? (buyerPurchased / buyerGifts.length) * 100 : 0,
        wrappingProgress: buyerGifts.length > 0 ? (buyerWrapped / buyerGifts.length) * 100 : 0,
        completionProgress: assignedPeople.length > 0 ? (completedAssignedPeople / assignedPeople.length) * 100 : 0
      };
    });

    // Sort by most remaining work (primary), then by people (secondary), then by cost (tertiary)
    return stats.sort((a, b) => {
      if (a.totalRemaining !== b.totalRemaining) {
        return b.totalRemaining - a.totalRemaining; // Most remaining first
      }
      if (a.people !== b.people) {
        return b.people - a.people; // More people first
      }
      return b.cost - a.cost; // Higher cost first
    });
  }, [people, buyers]);

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header Stack */}
        <div className="mb-6 space-y-4">
          {/* Row 1: Countdown */}
          <div className="flex items-center justify-center">
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
          </div>
        </div>

          {/* Row 2: KPI Strip */}
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="grid grid-cols-3 divide-x divide-border">
                {/* Recipients KPI */}
                <button 
                  onClick={() => navigate('/gifts', { state: { applyFilter: 'people-incomplete' } })}
                  className="py-3 px-2 text-center hover:bg-muted/50 active:bg-muted transition-colors group min-h-[44px] touch-target focus-ring"
                  aria-label={`View ${overallStats.totalPeople} recipients, ${overallStats.completedPeople} completed. Tap to view incomplete recipients.`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="text-xl font-bold">{overallStats.totalPeople}</div>
                    <div className="text-xs text-muted-foreground">Recipients</div>
                  </div>
                </button>

                {/* Gifts KPI */}
                <button 
                  onClick={() => navigate('/gifts', { state: { applyFilter: 'needs-purchase' } })}
                  className="py-3 px-2 text-center hover:bg-muted/50 active:bg-muted transition-colors group min-h-[44px] touch-target focus-ring"
                  aria-label={`View ${overallStats.totalGifts} gifts, ${overallStats.purchasedGifts} purchased. Tap to view unpurchased gifts.`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Gift className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="text-xl font-bold">{overallStats.totalGifts}</div>
                    <div className="text-xs text-muted-foreground">Gifts</div>
                  </div>
                </button>

                {/* Cost KPI */}
                <button 
                  onClick={() => navigate('/gifts', { state: { applyFilter: 'missing-cost' } })}
                  className="py-3 px-2 text-center hover:bg-muted/50 active:bg-muted transition-colors group min-h-[44px] touch-target focus-ring"
                  aria-label={`View total cost ${formatCurrency(overallStats.totalCost, currency)}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Coins className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="text-xl font-bold">{formatCurrency(overallStats.totalCost, currency)}</div>
                    <div className="text-xs text-muted-foreground">Cost</div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Row 3: Progress Card */}
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overallStats.totalGifts === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No gifts yet</p>
                  <p className="text-xs mt-1">Add your first gift to start tracking progress</p>
                </div>
              ) : (
                <>
                  {/* Completed recipients */}
                  <button
                    onClick={() => navigate('/gifts', { state: { applyFilter: 'people-incomplete' } })}
                    className="w-full flex items-center gap-3 hover:bg-muted/50 active:bg-muted p-2 rounded-md transition-colors min-h-[44px] touch-target focus-ring"
                    aria-label={`Completed recipients progress: ${overallStats.completedPeople} of ${overallStats.totalPeople} completed`}
                  >
                    <Progress 
                      current={overallStats.completedPeople} 
                      total={overallStats.totalPeople}
                      hideOnZero={false}
                      className="flex-1"
                    />
                    <div className="text-sm text-muted-foreground text-right min-w-0">
                      Completed recipients
                    </div>
                  </button>

                  {/* Purchased */}
                  <button
                    onClick={() => navigate('/gifts', { state: { applyFilter: 'needs-purchase' } })}
                    className="w-full flex items-center gap-3 hover:bg-muted/50 active:bg-muted p-2 rounded-md transition-colors min-h-[44px] touch-target focus-ring"
                    aria-label={`Purchase progress: ${overallStats.purchasedGifts} of ${overallStats.totalGifts} purchased`}
                  >
                    <ShoppingCart className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Progress 
                      current={overallStats.purchasedGifts} 
                      total={overallStats.totalGifts}
                      hideOnZero={false}
                      className="flex-1"
                    />
                    <div className="text-sm text-muted-foreground text-right min-w-0">
                      Purchased
                    </div>
                  </button>

                  {/* Wrapped */}
                  <button
                    onClick={() => navigate('/gifts', { state: { applyFilter: 'needs-wrapping' } })}
                    className="w-full flex items-center gap-3 hover:bg-muted/50 active:bg-muted p-2 rounded-md transition-colors min-h-[44px] touch-target focus-ring"
                    aria-label={`Wrapping progress: ${overallStats.wrappedGifts} of ${overallStats.totalGifts} wrapped`}
                  >
                    <Gift className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Progress 
                      current={overallStats.wrappedGifts} 
                      total={overallStats.totalGifts}
                      hideOnZero={false}
                      className="flex-1"
                    />
                    <div className="text-sm text-muted-foreground text-right min-w-0">
                      Wrapped
                    </div>
                  </button>
                </>
              )}
            </CardContent>
          </Card>

        {/* Buyer Breakdown */}
        {buyerStats.length > 0 && (
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Buyer Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {buyerStats
                .filter(buyer => showAllBuyers || buyer.totalRemaining > 0 || buyer.people > 0)
                .map((buyer) => (
                  <button
                    key={buyer.id}
                    onClick={() => navigate('/gifts', { state: { assignedTo: buyer.id } })}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 active:bg-muted rounded-md transition-colors group min-h-[44px] touch-target focus-ring"
                    aria-label={`View ${buyer.name}'s assignments: ${buyer.people} recipients, ${buyer.gifts} gifts, ${buyer.totalRemaining} remaining tasks`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg">{buyer.emoji}</span>
                      <span className="font-medium">{buyer.name}</span>
                      <span className="text-muted-foreground">·</span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span>{buyer.people}</span>
                      </div>
                      <span className="text-muted-foreground">·</span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Gift className="w-3 h-3" />
                        <span>{buyer.gifts}</span>
                      </div>
                      <span className="text-muted-foreground">·</span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <AlertCircle className="w-3 h-3" />
                        <span>{buyer.totalRemaining}</span>
                      </div>
                      <span className="text-muted-foreground">·</span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Coins className="w-3 h-3" />
                        <span>{formatCurrency(buyer.cost, currency)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              
              {buyerStats.filter(buyer => showAllBuyers || buyer.totalRemaining > 0 || buyer.people > 0).length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No buyers have assigned work yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
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
                className="bg-gradient-festive hover:opacity-90 text-white shadow-festive min-h-[44px] touch-target focus-ring"
              >
                Add Gift
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overallStats.totalPeople - overallStats.completedPeople > 0 && (
                <button
                  onClick={() => navigate('/gifts', { state: { applyFilter: 'people-incomplete' } })}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 active:bg-muted rounded-md transition-colors group min-h-[44px] touch-target focus-ring"
                  aria-label={`Complete shopping for ${pluralize(overallStats.totalPeople - overallStats.completedPeople, 'recipient', 'recipients')}`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Complete shopping for {pluralize(overallStats.totalPeople - overallStats.completedPeople, 'recipient', 'recipients')}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              )}
              
              {overallStats.totalGifts - overallStats.purchasedGifts > 0 && (
                <button
                  onClick={() => navigate('/gifts', { state: { applyFilter: 'needs-purchase' } })}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 active:bg-muted rounded-md transition-colors group min-h-[44px] touch-target focus-ring"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    <span>Purchase {pluralize(overallStats.totalGifts - overallStats.purchasedGifts, 'gift')}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              )}
              
              {overallStats.totalGifts - overallStats.wrappedGifts > 0 && (
                <button
                  onClick={() => navigate('/gifts', { state: { applyFilter: 'needs-wrapping' } })}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 active:bg-muted rounded-md transition-colors group min-h-[44px] touch-target focus-ring"
                >
                  <div className="flex items-center gap-3">
                    <Gift className="h-4 w-4 text-primary" />
                    <span>Wrap {pluralize(overallStats.totalGifts - overallStats.wrappedGifts, 'gift')}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              )}
              
              {overallStats.totalGiftsWithoutCost > 0 && (
                <button
                  onClick={() => navigate('/gifts', { state: { applyFilter: 'missing-cost' } })}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 active:bg-muted rounded-md transition-colors group min-h-[44px] touch-target focus-ring"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span>Set costs for {pluralize(overallStats.totalGiftsWithoutCost, 'gift')}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              )}
              
              {overallStats.totalPeople === overallStats.completedPeople && 
               overallStats.totalGifts === overallStats.purchasedGifts && 
               overallStats.totalGifts === overallStats.wrappedGifts && (
                 <div className="flex items-center gap-3 p-3 text-green-600 font-medium">
                   <CheckCircle className="h-4 w-4" />
                   <span>🎉 All shopping complete! You're ready for Christmas!</span>
                 </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Summary;