import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Gift, Users, DollarSign, ChevronDown, ChevronUp, ShoppingBag, Package, UserCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHousehold } from "@/hooks/useHousehold";

// Color palette for giver avatars
const GIVER_COLORS = [
  "hsl(var(--primary))",
  "hsl(220, 70%, 50%)",
  "hsl(280, 65%, 55%)",
  "hsl(340, 75%, 55%)",
  "hsl(30, 80%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(190, 70%, 50%)",
  "hsl(45, 90%, 55%)",
];

const getGiverColor = (giverId: string) => {
  const hash = giverId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GIVER_COLORS[hash % GIVER_COLORS.length];
};

// Types are defined locally here because Summary fetches data differently
// (nested query with gift_givers) than the shared Gift type.
interface SummaryGift {
  id: string;
  name: string;
  cost: number | null;
  purchased: boolean;
  wrapped: boolean;
  url: string | null;
  tracking: string | null;
  assigned_to: string | null;
  gift_givers?: Array<{ giver_id: string }>;
}

interface SummaryRecipient {
  id: string;
  name: string;
  gifts: SummaryGift[];
  notes: string;
  assigned_to: string | null;
  completed: boolean;
  manual_complete: boolean;
}

interface SummaryGiver {
  id: string;
  name: string;
  icon: string;
}

interface Giver {
  id: string;
  name: string;
  icon: string;
}

const Summary = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { householdId, loading: householdLoading } = useHousehold(user?.id);
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
    enabled: !!householdId,
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
        .order('name');
      if (error) throw error;
      return data as SummaryGiver[];
    },
    enabled: !!householdId,
  });

  // Fetch recipients with gifts
  const { data: recipients = [] } = useQuery({
    queryKey: ['recipients', householdId],
    queryFn: async () => {
      if (!householdId) return [];
      const { data, error } = await supabase
        .from('recipients')
        .select(`
          *,
          gifts (
            *,
            gift_givers (
              giver_id
            )
          )
        `)
        .eq('household_id', householdId)
        .order('name');
      if (error) throw error;
      return data as SummaryRecipient[];
    },
    enabled: !!householdId,
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
          queryClient.invalidateQueries({ queryKey: ['givers', householdId] });
        }
      )
      .subscribe();

    return () => {
      // Not supabase.removeChannel(): removing the last channel closes the socket, and
      // channels the next page subscribes while it is closing never join (realtime-js 2.75).
      channel.unsubscribe();
    };
  }, [householdId, queryClient]);

  const currency = household?.currency || '$';

  const christmasCountdown = useMemo(() => {
    const christmas = new Date(new Date().getFullYear(), 11, 25);
    const today = new Date();
    const daysUntil = differenceInDays(christmas, today);
    return daysUntil >= 0 ? daysUntil : 365 + daysUntil;
  }, []);

  const overallStats = useMemo(() => {
    const totalPeople = recipients.length;
    const totalGifts = recipients.reduce((sum, person) => sum + person.gifts.length, 0);
    const totalCost = recipients.reduce(
      (sum, person) =>
        sum + person.gifts.reduce((giftSum, gift) => giftSum + (gift.cost || 0), 0),
      0
    );
    const purchasedGifts = recipients.reduce(
      (sum, person) => sum + person.gifts.filter((g) => g.purchased).length,
      0
    );
    const wrappedGifts = recipients.reduce(
      (sum, person) => sum + person.gifts.filter((g) => g.wrapped).length,
      0
    );
    const completedPeople = recipients.filter((p) => p.completed || p.manual_complete).length;

    return {
      totalPeople,
      totalGifts,
      totalCost,
      purchasedGifts,
      wrappedGifts,
      completedPeople,
      purchasedPercentage: totalGifts > 0 ? Math.round((purchasedGifts / totalGifts) * 100) : 0,
      wrappedPercentage: totalGifts > 0 ? Math.round((wrappedGifts / totalGifts) * 100) : 0,
      completedPercentage:
        totalPeople > 0 ? Math.round((completedPeople / totalPeople) * 100) : 0,
    };
  }, [recipients]);

  const giverStats = useMemo(() => {
    return givers.map((giver) => {
      // Calculate total gifts where this giver is assigned (including shared gifts)
      const allGifts = recipients.flatMap(r => r.gifts);
      const giverGifts = allGifts.filter(gift => 
        gift.gift_givers?.some((gg: { giver_id: string }) => gg.giver_id === giver.id)
      );
      
      const totalAssignedGifts = giverGifts.length;
      const purchasedGifts = giverGifts.filter(g => g.purchased).length;
      const wrappedGifts = giverGifts.filter(g => g.wrapped).length;
      
      // Count shared vs solo gifts
      const sharedGifts = giverGifts.filter(g => (g.gift_givers?.length || 0) > 1).length;
      const soloGifts = totalAssignedGifts - sharedGifts;
      
      // Calculate total cost - split evenly for shared gifts
      const totalCost = giverGifts.reduce((sum, gift) => {
        const giversCount = gift.gift_givers?.length || 1;
        const splitCost = (gift.cost || 0) / giversCount;
        return sum + splitCost;
      }, 0);

      const remainingTasks = totalAssignedGifts - wrappedGifts;

      return {
        ...giver,
        totalGifts: totalAssignedGifts,
        sharedGifts,
        soloGifts,
        purchased: purchasedGifts,
        wrapped: wrappedGifts,
        totalCost,
        remainingTasks,
      };
    });
  }, [givers, recipients]);

  const sortedGiverStats = useMemo(() => {
    return [...giverStats].sort((a, b) => {
      if (a.remainingTasks !== b.remainingTasks) {
        return b.remainingTasks - a.remainingTasks;
      }
      return b.totalCost - a.totalCost;
    });
  }, [giverStats]);

  const displayedGivers = showAllBuyers ? sortedGiverStats : sortedGiverStats.slice(0, 3);

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

        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <p className="text-3xl font-bold">{overallStats.totalGifts}</p>
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

        {/* Giver Breakdown */}
        {givers.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Giver Breakdown</h3>
                {sortedGiverStats.length > 3 && (
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
                        Show All ({sortedGiverStats.length})
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {displayedGivers.map((giver) => (
                  <div key={giver.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12" style={{ backgroundColor: getGiverColor(giver.id) }}>
                          <AvatarFallback className="text-white text-xl" style={{ backgroundColor: 'transparent' }}>
                            {giver.icon}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{giver.name}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm text-muted-foreground">
                              Contributing to {giver.totalGifts} gift{giver.totalGifts !== 1 ? 's' : ''}
                            </p>
                            {giver.sharedGifts > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {giver.sharedGifts} shared
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-primary">
                            {formatCurrency(giver.totalCost, currency)} total
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {giver.remainingTasks > 0 && (
                          <Badge variant="secondary">{giver.remainingTasks} remaining</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/gifts?giver=${giver.id}`)}
                          className="h-7 text-xs"
                        >
                          <UserCircle2 className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="h-4 w-4" />
                          Purchased
                        </span>
                        <span className="font-medium">
                          {giver.purchased}/{giver.totalGifts}
                        </span>
                      </div>
                      <Progress
                        value={giver.totalGifts > 0 ? (giver.purchased / giver.totalGifts) * 100 : 0}
                        className="h-1"
                      />

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          Wrapped
                        </span>
                        <span className="font-medium">
                          {giver.wrapped}/{giver.totalGifts}
                        </span>
                      </div>
                      <Progress
                        value={giver.totalGifts > 0 ? (giver.wrapped / giver.totalGifts) * 100 : 0}
                        className="h-1"
                      />
                    </div>
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
