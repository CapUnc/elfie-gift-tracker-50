import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gift, Users, DollarSign, ChevronDown, ChevronUp, ShoppingBag, Package, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";
import { Buyer } from '@/types/givers';

interface Gift {
  id: string;
  name: string;
  cost: number | null;
  purchased: boolean;
  wrapped: boolean;
  url: string | null;
  tracking: string | null;
  assigned_to: string | null;
  is_placeholder?: boolean;
  template_id?: string | null;
}

interface Recipient {
  id: string;
  name: string;
  gifts: Gift[];
  notes: string;
  assigned_to: string | null;
  completed: boolean;
  manual_complete: boolean;
}

interface Giver {
  id: string;
  name: string;
  icon: string;
}

const Summary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { householdId, loading: householdLoading } = useHousehold(user?.id);
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const queryClient = useQueryClient();
  const [showAllBuyers, setShowAllBuyers] = useState(false);
  
  // Fetch household data
  const { data: household } = useQuery({
    queryKey: ['household', householdId],
    queryFn: async () => {
      if (!householdId) return null;
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .eq('id', householdId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!householdId && !householdLoading,
  });

  // Fetch profile-linked givers (acting as buyers)
  const { data: buyers = [] } = useQuery({
    queryKey: ['profile-givers', householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data, error } = await supabase
        .from('givers')
        .select('*')
        .eq('household_id', householdId)
        .eq('is_virtual', false)
        .order('name');
      if (error) throw error;
      // Map to Buyer interface for compatibility
      return (data || []).map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon || '🎁'
      })) as Buyer[];
    },
    enabled: !!householdId && !householdLoading,
  });

  // Fetch givers
  const { data: givers = [] } = useQuery({
    queryKey: ['givers', householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data, error } = await supabase
        .from('givers')
        .select('*')
        .eq('household_id', householdId)
        .order('display_order');
      if (error) throw error;
      return data as Giver[];
    },
    enabled: !!householdId && !householdLoading,
  });

  // Fetch recipients with gifts and givers
  const { data: recipients = [] } = useQuery({
    queryKey: ['recipients', householdId],
    queryFn: async () => {
      if (!householdId) return [];
      
      // Fetch recipients
      const { data: recipientsData, error: recipientsError } = await supabase
        .from('recipients')
        .select('*')
        .eq('household_id', householdId)
        .order('name');
      if (recipientsError) throw recipientsError;

      // Fetch gifts with givers
      const { data: giftsData, error: giftsError } = await supabase
        .from('gifts')
        .select(`
          *,
          gift_givers (
            giver_id,
            givers (id, name, icon)
          )
        `)
        .eq('household_id', householdId);
      if (giftsError) throw giftsError;

      // Transform and combine
      const giftsWithGivers = giftsData.map((gift: any) => ({
        ...gift,
        givers: gift.gift_givers?.map((gg: any) => gg.givers).filter(Boolean) || []
      }));

      return (recipientsData || []).map((recipient: any) => ({
        ...recipient,
        gifts: giftsWithGivers.filter((g: any) => g.recipient_id === recipient.id)
      })) as Recipient[];
    },
    enabled: !!householdId && !householdLoading,
  });

  // Set up realtime subscriptions
  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel('summary-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipients',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['recipients', householdId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gifts',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['recipients', householdId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'givers',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['profile-givers', householdId] });
          queryClient.invalidateQueries({ queryKey: ['givers', householdId] });
          queryClient.invalidateQueries({ queryKey: ['recipients', householdId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'givers',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['givers', householdId] });
          queryClient.invalidateQueries({ queryKey: ['recipients', householdId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gift_givers',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['recipients', householdId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, queryClient]);
  
  // NOW we can do the early return check AFTER all hooks
  if (householdLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const currency = household?.currency || '$';

  const christmasCountdown = useMemo(() => {
    const christmas = new Date(new Date().getFullYear(), 11, 25);
    const today = new Date();
    const daysUntil = differenceInDays(christmas, today);
    return daysUntil >= 0 ? daysUntil : 365 + daysUntil;
  }, []);

  const overallStats = useMemo(() => {
    const totalPeople = recipients.length;
    
    // Separate real gifts from placeholders
    const allGifts = recipients.flatMap(person => person.gifts);
    const realGifts = allGifts.filter(g => !g.is_placeholder);
    const placeholderGifts = allGifts.filter(g => g.is_placeholder);
    
    const totalGifts = allGifts.length;
    const realGiftsCount = realGifts.length;
    const placeholderCount = placeholderGifts.length;
    
    const totalCost = realGifts.reduce((sum, gift) => sum + (gift.cost || 0), 0);
    const purchasedGifts = realGifts.filter(g => g.purchased).length;
    const wrappedGifts = realGifts.filter(g => g.wrapped).length;
    const completedPeople = recipients.filter((p) => p.completed || p.manual_complete).length;

    return {
      totalPeople,
      totalGifts,
      realGiftsCount,
      placeholderCount,
      totalCost,
      purchasedGifts,
      wrappedGifts,
      completedPeople,
      purchasedPercentage: realGiftsCount > 0 ? Math.round((purchasedGifts / realGiftsCount) * 100) : 0,
      wrappedPercentage: realGiftsCount > 0 ? Math.round((wrappedGifts / realGiftsCount) * 100) : 0,
      completedPercentage:
        totalPeople > 0 ? Math.round((completedPeople / totalPeople) * 100) : 0,
    };
  }, [recipients]);

  const giverSpending = useMemo(() => {
    if (givers.length === 0) return [];
    
    const spending = givers.map(giver => {
      const giftsFromGiver = recipients.flatMap(person => 
        person.gifts.filter(gift => 
          !gift.is_placeholder && 
          (gift as any).givers?.some((g: any) => g.id === giver.id)
        )
      );
      
      const totalSpent = giftsFromGiver.reduce((sum, gift) => sum + (gift.cost || 0), 0);
      const giftCount = giftsFromGiver.length;
      
      return {
        ...giver,
        totalSpent,
        giftCount
      };
    });
    
    return spending.filter(s => s.giftCount > 0).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [givers, recipients]);

  const buyerStats = useMemo(() => {
    return buyers.map((buyer) => {
      const assignedRecipients = recipients.filter((p) => p.assigned_to === buyer.id);
      
      // Only count non-placeholder gifts for buyer stats
      const realGifts = assignedRecipients.flatMap(person => 
        person.gifts.filter(g => !g.is_placeholder)
      );
      
      const totalAssignedGifts = realGifts.length;
      const purchasedGifts = realGifts.filter(g => g.purchased).length;
      const wrappedGifts = realGifts.filter(g => g.wrapped).length;
      const totalCost = realGifts.reduce((sum, gift) => sum + (gift.cost || 0), 0);
      
      const remainingTasks = totalAssignedGifts - wrappedGifts;

      return {
        ...buyer,
        assignedPeople: assignedRecipients.length,
        totalGifts: totalAssignedGifts,
        purchased: purchasedGifts,
        wrapped: wrappedGifts,
        totalCost,
        remainingTasks,
      };
    });
  }, [buyers, recipients]);

  const sortedBuyerStats = useMemo(() => {
    return [...buyerStats].sort((a, b) => {
      if (a.remainingTasks !== b.remainingTasks) {
        return b.remainingTasks - a.remainingTasks;
      }
      if (a.assignedPeople !== b.assignedPeople) {
        return b.assignedPeople - a.assignedPeople;
      }
      return b.totalCost - a.totalCost;
    });
  }, [buyerStats]);

  const displayedBuyers = showAllBuyers ? sortedBuyerStats : sortedBuyerStats.slice(0, 3);

  const avgCostPerRecipient = useMemo(() => {
    if (recipients.length === 0) return 0;
    return overallStats.totalCost / recipients.length;
  }, [overallStats.totalCost, recipients.length]);

  const nearlyCompleteRecipients = useMemo(() => {
    return recipients
      .map(person => {
        const realGifts = person.gifts.filter(g => !g.is_placeholder);
        const purchased = realGifts.filter(g => g.purchased).length;
        const wrapped = realGifts.filter(g => g.wrapped).length;
        const completion = realGifts.length > 0 ? (wrapped / realGifts.length) * 100 : 0;
        
        return {
          ...person,
          completion,
          realGiftCount: realGifts.length,
          purchased,
          wrapped
        };
      })
      .filter(p => p.completion >= 75 && p.completion < 100 && p.realGiftCount > 0)
      .sort((a, b) => b.completion - a.completion);
  }, [recipients]);

  const unassignedRecipients = useMemo(() => {
    return recipients.filter(r => !r.assigned_to);
  }, [recipients]);

  const nextSteps = useMemo(() => {
    const steps = [];
    
    if (overallStats.totalGifts === 0) {
      return [{ text: "Start by adding some gifts!", action: () => navigate('/gifts') }];
    }

    if (overallStats.purchasedGifts < overallStats.totalGifts) {
      const remaining = overallStats.totalGifts - overallStats.purchasedGifts;
      steps.push({
        text: `Purchase ${remaining} remaining gift${remaining !== 1 ? 's' : ''}`,
        action: () => navigate('/gifts?filter=notPurchased'),
      });
    }

    if (overallStats.wrappedGifts < overallStats.totalGifts) {
      const remaining = overallStats.totalGifts - overallStats.wrappedGifts;
      steps.push({
        text: `Wrap ${remaining} gift${remaining !== 1 ? 's' : ''}`,
        action: () => navigate('/gifts?filter=notWrapped'),
      });
    }

    return steps;
  }, [overallStats, navigate]);

  return (
    <div className="container mx-auto px-4 py-8 pb-24 max-w-7xl">
      <div className="space-y-6">
        {/* Christmas Countdown */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">🎄 Christmas Countdown 🎄</h2>
              <p className="text-4xl font-bold text-primary">{christmasCountdown} days</p>
              <p className="text-muted-foreground mt-1">until Christmas Day</p>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Warning */}
        {overallStats.placeholderCount > 0 && (
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    {overallStats.placeholderCount} gift{overallStats.placeholderCount !== 1 ? 's' : ''} still need to be decided
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    You have placeholder gifts that need specific items assigned before they can be purchased.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unassigned Recipients Warning */}
        {unassignedRecipients.length > 0 && (
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    {unassignedRecipients.length} recipient{unassignedRecipients.length !== 1 ? 's' : ''} not assigned to a buyer
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    Assign these recipients to buyers so everyone knows who they're shopping for.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unassignedRecipients.map(r => (
                      <Badge key={r.id} variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100">
                        {r.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-auto p-4 flex-col items-start hover:bg-accent"
            onClick={() => navigate('/gifts')}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Recipients</span>
            </div>
            <p className="text-3xl font-bold">{overallStats.totalPeople}</p>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex-col items-start hover:bg-accent"
            onClick={() => navigate('/gifts')}
          >
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Gifts</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{overallStats.realGiftsCount}</p>
              {overallStats.placeholderCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  ({overallStats.placeholderCount} TBD)
                </p>
              )}
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex-col items-start hover:bg-accent"
            onClick={() => navigate('/gifts')}
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Cost</span>
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(overallStats.totalCost, currency)}
            </p>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex-col items-start hover:bg-accent"
            onClick={() => navigate('/gifts')}
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Avg/Recipient</span>
            </div>
            <p className="text-3xl font-bold">
              {formatCurrency(avgCostPerRecipient, currency)}
            </p>
          </Button>
        </div>

        {/* Progress Card */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-4">Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Recipients Complete</span>
                  <span className="text-sm text-muted-foreground">
                    {overallStats.completedPercentage}%
                  </span>
                </div>
                <Progress value={overallStats.completedPercentage} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Gifts Purchased</span>
                  <span className="text-sm text-muted-foreground">
                    {overallStats.purchasedPercentage}%
                  </span>
                </div>
                <Progress value={overallStats.purchasedPercentage} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Gifts Wrapped</span>
                  <span className="text-sm text-muted-foreground">
                    {overallStats.wrappedPercentage}%
                  </span>
                </div>
                <Progress value={overallStats.wrappedPercentage} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buyer Breakdown */}
        {buyers.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Buyer Breakdown</h3>
                {sortedBuyerStats.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllBuyers(!showAllBuyers)}
                  >
                    {showAllBuyers ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show All ({sortedBuyerStats.length})
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {displayedBuyers.map((buyer) => (
                  <div key={buyer.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{buyer.icon}</span>
                        <div>
                          <h4 className="font-semibold">{buyer.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {buyer.assignedPeople} recipient{buyer.assignedPeople !== 1 ? 's' : ''} •{' '}
                            {buyer.totalGifts} gift{buyer.totalGifts !== 1 ? 's' : ''} •{' '}
                            {formatCurrency(buyer.totalCost, currency)}
                          </p>
                        </div>
                      </div>
                      {buyer.remainingTasks > 0 && (
                        <Badge variant="secondary">{buyer.remainingTasks} remaining</Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="h-4 w-4" />
                          Purchased
                        </span>
                        <span className="font-medium">
                          {buyer.purchased}/{buyer.totalGifts}
                        </span>
                      </div>
                      <Progress
                        value={buyer.totalGifts > 0 ? (buyer.purchased / buyer.totalGifts) * 100 : 0}
                        className="h-1"
                      />

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          Wrapped
                        </span>
                        <span className="font-medium">
                          {buyer.wrapped}/{buyer.totalGifts}
                        </span>
                      </div>
                      <Progress
                        value={buyer.totalGifts > 0 ? (buyer.wrapped / buyer.totalGifts) * 100 : 0}
                        className="h-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nearly Complete Recipients */}
        {nearlyCompleteRecipients.length > 0 && (
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4 text-green-900 dark:text-green-100">
                🎯 Nearly Complete ({nearlyCompleteRecipients.length})
              </h3>
              <div className="space-y-3">
                {nearlyCompleteRecipients.map((person) => (
                  <div key={person.id} className="p-3 bg-white dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-900 dark:text-green-100">{person.name}</h4>
                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100">
                        {Math.round(person.completion)}% done
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-green-800 dark:text-green-200">
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        {person.purchased}/{person.realGiftCount} purchased
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {person.wrapped}/{person.realGiftCount} wrapped
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Spending by Giver */}
        {giverSpending.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4">Spending by Giver</h3>
              <div className="space-y-3">
                {giverSpending.map((giver) => (
                  <div key={giver.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{giver.icon}</span>
                      <div>
                        <h4 className="font-medium">{giver.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {giver.giftCount} gift{giver.giftCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-lg">
                      {formatCurrency(giver.totalSpent, currency)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-4">Next Steps</h3>
            {nextSteps.length > 0 ? (
              <div className="space-y-2">
                {nextSteps.map((step, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={step.action}
                  >
                    <span className="flex-1">{step.text}</span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">🎉 All Done!</p>
                <p className="text-muted-foreground">
                  You've completed all your Christmas shopping! Time to relax and enjoy the holidays.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Summary;
