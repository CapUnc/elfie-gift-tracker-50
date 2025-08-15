import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { Gift, DollarSign, Users, Package, Settings, CheckCircle, AlertCircle, Calendar, ChevronDown, Eye, EyeOff, ChevronRight, ShoppingCart, Shirt } from 'lucide-react';
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
  const [showCompletedBuyers, setShowCompletedBuyers] = useState(false);
  
  const buyerStats = useMemo(() => {
    if (buyers.length <= 1) return [];
    
    const stats = buyers.map(buyer => {
      const assignedPeople = people.filter(person => person.assignedTo === buyer.name);
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
        {/* Compact Header with Quick Actions */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">Christmas Planning</h1>
              <p className="text-sm text-muted-foreground">Gift planning overview</p>
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

        {/* KPI Strip */}
        <Card className="mb-8">
          <CardContent className="p-0">
            <div className="grid grid-cols-3 divide-x divide-border">
              {/* People Stat */}
              <button 
                onClick={() => navigate('/gifts')}
                className="p-6 text-center hover:bg-muted/50 transition-colors group"
                aria-label={`View ${overallStats.totalPeople} people, ${overallStats.completedPeople} completed`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Users className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-2xl font-bold">{overallStats.totalPeople}</div>
                  <div className="text-sm text-muted-foreground">
                    {overallStats.completedPeople} done
                  </div>
                </div>
              </button>

              {/* Gifts Stat */}
              <button 
                onClick={() => navigate('/gifts')}
                className="p-6 text-center hover:bg-muted/50 transition-colors group"
                aria-label={`View ${overallStats.totalGifts} gifts, ${overallStats.purchasedGifts} purchased`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Gift className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-2xl font-bold">{overallStats.totalGifts}</div>
                  <div className="text-sm text-muted-foreground">
                    {overallStats.purchasedGifts} purchased
                  </div>
                </div>
              </button>

              {/* Cost Stat */}
              <button 
                onClick={() => navigate('/gifts')}
                className="p-6 text-center hover:bg-muted/50 transition-colors group"
                aria-label={`View total cost ${formatCurrency(overallStats.totalCost, currency)}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <DollarSign className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-2xl font-bold">
                    {overallStats.totalGiftsWithoutCost > 0 ? 'Partial: ' : ''}{formatCurrency(overallStats.totalCost, currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {overallStats.totalGifts > 0 ? `${overallStats.giftsCostSet} priced` : 'No gifts'}
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* People done row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-sm font-medium w-24 flex-shrink-0">People done:</span>
                <span className="text-sm text-muted-foreground">
                  {overallStats.completedPeople} of {overallStats.totalPeople}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                <Progress value={overallStats.completionProgress} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {Math.round(overallStats.completionProgress)}%
                </span>
              </div>
            </div>

            {/* Purchased row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-sm font-medium w-24 flex-shrink-0">Purchased:</span>
                <span className="text-sm text-muted-foreground">
                  {overallStats.purchasedGifts} of {overallStats.totalGifts}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                <Progress value={overallStats.purchaseProgress} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {Math.round(overallStats.purchaseProgress)}%
                </span>
              </div>
            </div>

            {/* Wrapped row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-sm font-medium w-24 flex-shrink-0">Wrapped:</span>
                <span className="text-sm text-muted-foreground">
                  {overallStats.wrappedGifts} of {overallStats.totalGifts}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                <Progress value={overallStats.wrappingProgress} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {Math.round(overallStats.wrappingProgress)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buyer Statistics */}
        {buyerStats.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                <Users className="w-6 h-6" />
                Buyer Breakdown
              </h2>
              {buyerStats.some(buyer => buyer.isCompleted) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCompletedBuyers(!showCompletedBuyers)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {showCompletedBuyers ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                  {showCompletedBuyers ? 'Hide completed' : 'Show completed'}
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              {buyerStats
                .filter(buyer => showCompletedBuyers || !buyer.isCompleted)
                .map((buyer) => (
                  <Collapsible key={buyer.name} className="border rounded-lg">
                    <CollapsibleTrigger className="w-full p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 text-left w-full">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="text-sm">{buyer.emoji}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="font-medium">{buyer.name}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-sm text-muted-foreground">
                            People {buyer.people} · Gifts {buyer.gifts}
                          </span>
                          
                          {buyer.totalRemaining > 0 ? (
                            <>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded-full">
                                Remaining: {buyer.remainingToShop > 0 && `${buyer.remainingToShop} to shop`}
                                {buyer.remainingToShop > 0 && (buyer.remainingToPurchase > 0 || buyer.remainingToWrap > 0) && ', '}
                                {buyer.remainingToPurchase > 0 && `${buyer.remainingToPurchase} to purchase`}
                                {buyer.remainingToPurchase > 0 && buyer.remainingToWrap > 0 && ', '}
                                {buyer.remainingToWrap > 0 && `${buyer.remainingToWrap} to wrap`}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
                                ✅ All done
                              </span>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-medium text-muted-foreground">
                            {formatCurrency(buyer.cost, currency)}
                          </span>
                          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="pt-2 border-t space-y-4">
                        {/* Assigned People */}
                        {buyer.assignedPeople.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Assigned People</h4>
                            <div className="space-y-1">
                              {buyer.assignedPeople.map((person) => (
                                <div key={person.id} className="flex items-center justify-between text-sm">
                                  <span className={person.completed ? 'line-through text-muted-foreground' : ''}>
                                    {person.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">
                                      {person.gifts.length} gift{person.gifts.length !== 1 ? 's' : ''}
                                    </span>
                                    {person.completed ? (
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => navigate(`/gifts?person=${person.id}`)}
                                      >
                                        View
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Progress Summary */}
                        {buyer.gifts > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Progress Summary</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>People done</span>
                                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {buyer.completedPeople} of {buyer.people}
                  </span>
                  <Progress value={buyer.completionProgress} className="h-2 w-16" />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Purchased</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {buyer.purchased} of {buyer.gifts}
                  </span>
                  <Progress value={buyer.purchaseProgress} className="h-2 w-16" />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Wrapped</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {buyer.wrapped} of {buyer.gifts}
                  </span>
                  <Progress value={buyer.wrappingProgress} className="h-2 w-16" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {buyer.people === 0 && (
                          <div className="text-center text-muted-foreground text-sm py-4">
                            No people assigned to this buyer
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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
                <CheckCircle className="w-4 h-4" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overallStats.totalPeople - overallStats.completedPeople > 0 && (
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto p-4 text-left hover:bg-accent/50"
                    onClick={() => {
                      navigate('/gifts');
                      // Filter will be applied by the gifts page based on completion status
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Complete shopping for {overallStats.totalPeople - overallStats.completedPeople} people</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
                {overallStats.totalGifts - overallStats.purchasedGifts > 0 && (
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto p-4 text-left hover:bg-accent/50"
                    onClick={() => {
                      navigate('/gifts');
                      // Filter will be applied by the gifts page based on purchase status
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                      <span>Purchase {overallStats.totalGifts - overallStats.purchasedGifts} gifts</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
                {overallStats.totalGifts - overallStats.wrappedGifts > 0 && (
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto p-4 text-left hover:bg-accent/50"
                    onClick={() => {
                      navigate('/gifts');
                      // Filter will be applied by the gifts page based on wrapping status
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Shirt className="h-4 w-4 text-primary" />
                      <span>Wrap {overallStats.totalGifts - overallStats.wrappedGifts} gifts</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
                {overallStats.totalGiftsWithoutCost > 0 && (
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto p-4 text-left hover:bg-accent/50"
                    onClick={() => {
                      navigate('/gifts');
                      // Filter will be applied by the gifts page based on cost status
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span>Set costs for {overallStats.totalGiftsWithoutCost} gifts</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
                {overallStats.totalPeople === overallStats.completedPeople && 
                 overallStats.totalGifts === overallStats.purchasedGifts && 
                 overallStats.totalGifts === overallStats.wrappedGifts && (
                   <div className="flex items-center gap-3 p-4 text-christmas-green font-medium">
                     <CheckCircle className="h-4 w-4" />
                     <span>🎉 All shopping complete! You're ready for Christmas!</span>
                   </div>
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