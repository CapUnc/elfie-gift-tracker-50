import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Home } from 'lucide-react';
import { z } from 'zod';

const displayNameSchema = z.string().trim().min(1, 'Display name is required').max(100, 'Display name must be less than 100 characters');

const emojiOptions = ['🎅', '🤶', '🎄', '⛄', '🎁', '🔔', '⭐', '❄️', '🦌', '🕎', '👨', '👩', '👦', '👧', '🧑', '👴', '👵'];

export const Welcome = () => {
  const [step, setStep] = useState<'choice' | 'create' | 'join'>('choice');
  const [displayName, setDisplayName] = useState('');
  const [householdName, setHouseholdName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎅');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { refetch } = useHousehold(user?.id);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Pre-fill display name from Google user metadata
  useEffect(() => {
    const checkExistingSetup = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('household_id, display_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.household_id) {
        // User has household, check for giver
        const { data: giver } = await supabase
          .from('givers')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (!giver) {
          // Has household but no giver - show recovery flow
          toast({
            title: 'Setup Incomplete',
            description: "Let's finish setting up your profile",
          });
          setStep('create');
          setDisplayName(profile.display_name || '');
          return;
        }
      }

      // Pre-fill from Google metadata if available
      if (user.user_metadata) {
        const googleName = user.user_metadata.full_name || user.user_metadata.name;
        if (googleName && !displayName) {
          setDisplayName(googleName);
        }
      }
    };

    checkExistingSetup();
  }, [user]);

  const handleCreateHousehold = async () => {
    // Validate inputs with zod
    const validation = displayNameSchema.safeParse(displayName);
    const householdValidation = z.string().trim().min(1, 'Household name is required').max(100).safeParse(householdName);
    
    if (!validation.success || !householdValidation.success || !user) {
      toast({
        title: 'Validation error',
        description: validation.error?.errors[0].message || householdValidation.error?.errors[0].message || 'Please check your input',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Create household and profile using existing RPC function
      const { data: householdId, error: householdError } = await supabase
        .rpc('create_user_household_and_profile', {
          _user_id: user.id,
          _email: user.email || '',
          _display_name: validation.data,
        });

      if (householdError) throw householdError;

      // Update household name
      await supabase
        .from('households')
        .update({ name: householdValidation.data })
        .eq('id', householdId);

      // Delete old giver record AFTER household creation succeeds (if any)
      await supabase
        .from('givers')
        .delete()
        .eq('profile_id', user.id);

      // Note: giver record will be created automatically by the create_giver_for_profile trigger
      // which fires when the profile is updated with a household_id by the RPC function above

      toast({
        title: 'Household created!',
        description: 'You can now start tracking gifts',
      });

      // Refetch household data and give time for state to propagate
      await refetch();
      
      // Small delay to ensure ProtectedRoute picks up the new state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      navigate('/');
    } catch (error) {
      console.error('Error creating household:', error);
      toast({
        title: 'Error creating household',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'choice') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-subtle">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Welcome! 🎄
            </h1>
            <p className="text-muted-foreground">
              Let's get you started with gift tracking
            </p>
          </div>

          <Card className="p-6 space-y-4">
            <Button
              onClick={() => setStep('create')}
              className="w-full h-auto py-6 flex flex-col gap-2"
              size="lg"
            >
              <Home className="w-8 h-8" />
              <div>
                <div className="font-semibold text-lg">Create My Household</div>
                <div className="text-sm opacity-90 font-normal">Start fresh with your own gift list</div>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/join-household')}
              variant="outline"
              className="w-full h-auto py-6 flex flex-col gap-2"
              size="lg"
            >
              <Users className="w-8 h-8" />
              <div>
                <div className="font-semibold text-lg">Join Existing Household</div>
                <div className="text-sm opacity-90 font-normal">Enter an invite code to join others</div>
              </div>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-subtle">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Create Your Profile
            </h1>
            <p className="text-muted-foreground">
              Choose how you'll appear to others in your household
            </p>
          </div>

          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="householdName">Household Name</Label>
              <Input
                id="householdName"
                placeholder="e.g., The Smith Family, Holiday 2024"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Your Display Name</Label>
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

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('choice')}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateHousehold}
                disabled={loading || !displayName.trim() || !householdName.trim()}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Household
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default Welcome;
