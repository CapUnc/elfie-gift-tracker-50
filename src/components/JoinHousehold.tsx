import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

const emojiOptions = ['🎅', '🤶', '🎄', '⛄', '🎁', '🔔', '⭐', '❄️', '🦌', '🕎', '👨', '👩', '👦', '👧', '🧑', '👴', '👵'];

interface JoinHouseholdProps {}

export const JoinHousehold: React.FC<JoinHouseholdProps> = () => {
  const [step, setStep] = useState<'code' | 'emoji'>('code');
  const [inviteCode, setInviteCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎅');
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { refetch } = useHousehold(user?.id);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim() || !user) return;

    setLoading(true);
    try {
      // Check if user already has a household
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single();

      if (currentProfile?.household_id) {
        // Warn user they're leaving current household
        const confirmed = window.confirm(
          "You're already in a household. Joining another will remove you from your current one. Continue?"
        );
        if (!confirmed) {
          setLoading(false);
          return;
        }

        // Clear assignments and delete old buyer record
        await supabase
          .from('recipients')
          .update({ assigned_to: null })
          .eq('household_id', currentProfile.household_id)
          .eq('assigned_to', user.id);

        await supabase
          .from('gifts')
          .update({ assigned_to: null })
          .eq('household_id', currentProfile.household_id)
          .eq('assigned_to', user.id);

        await supabase
          .from('buyers')
          .delete()
          .eq('user_id', user.id);
      }

      const { data: newHouseholdId, error } = await supabase.rpc('join_household_by_code', {
        _code: inviteCode.trim().toUpperCase(),
      });

      if (error) throw error;

      setHouseholdId(newHouseholdId);
      
      // Get user's display name from their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      // Pre-fill from profile or Google metadata
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
      setDisplayName(profile?.display_name || googleName || '');

      setStep('emoji');
    } catch (error) {
      console.error('Error joining household:', error);
      toast({
        title: 'Invalid invite code',
        description: 'Please check the code and try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBuyer = async () => {
    if (!householdId || !user || !displayName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter your display name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Use upsert to handle both new and existing buyer records
      // This prevents issues if buyer was partially created before
      const { error: buyerError } = await supabase
        .from('buyers')
        .upsert({
          household_id: householdId,
          user_id: user.id,
          name: displayName.trim(),
          emoji: selectedEmoji,
        }, {
          onConflict: 'user_id'
        });

      if (buyerError) {
        console.error('Buyer upsert error:', buyerError);
        throw new Error('Could not create profile. Please try again.');
      }

      toast({
        title: 'Joined household!',
        description: 'You can now see and manage shared gifts',
      });

      // Refetch household data and navigate
      await refetch();
      navigate('/');
    } catch (error: any) {
      console.error('Error creating buyer:', error);
      toast({
        title: 'Setup Error',
        description: error.message || 'Could not complete setup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'emoji') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-subtle">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Set Up Your Profile
            </h1>
            <p className="text-muted-foreground">
              Choose how you'll appear in your new household
            </p>
          </div>

          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Choose Your Emoji</Label>
              <div className="grid grid-cols-6 gap-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`text-3xl p-3 rounded-lg transition-all flex items-center justify-center ${
                      selectedEmoji === emoji
                        ? 'bg-primary/20 ring-2 ring-primary scale-110'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreateBuyer}
              disabled={loading || !displayName.trim()}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Setup
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-subtle">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Join a Household
          </h1>
          <p className="text-muted-foreground">
            Enter an invite code to join an existing household
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-500 mb-1">Important</p>
              <p className="text-muted-foreground">
                If you're already in a household, joining another will remove you from your current one.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              placeholder="Enter 8-character code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="font-mono text-lg tracking-wider uppercase"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/welcome')} disabled={loading} className="flex-1">
              Skip
            </Button>
            <Button
              onClick={handleJoinHousehold}
              disabled={loading || !inviteCode.trim()}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default JoinHousehold;
