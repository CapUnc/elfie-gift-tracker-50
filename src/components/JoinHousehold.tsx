import React, { useState } from 'react';
import { Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface JoinHouseholdProps {
  onJoined: () => void;
  onSkip: () => void;
}

const JoinHousehold: React.FC<JoinHouseholdProps> = ({ onJoined, onSkip }) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'code' | 'emoji'>('code');
  const [inviteCode, setInviteCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('👤');
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emojiOptions = ['👤', '👨', '👩', '🧑', '👦', '👧', '🎅', '🤶', '👑', '⭐', '💝', '🎁'];

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Invalid code",
        description: "Please enter an invite code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('join_household_by_code', {
        _code: inviteCode.trim().toUpperCase(),
      });

      if (error) throw error;

      // Get the user's profile to get their display name
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user?.id)
        .single();

      setHouseholdId(data);
      setDisplayName(profile?.display_name || '');
      setStep('emoji');
    } catch (error: any) {
      console.error('Error joining household:', error);
      toast({
        title: "Invalid code",
        description: "The invite code is invalid or expired.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleCreateBuyer = async () => {
    if (!householdId) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create buyer record linked to user
      const { error } = await supabase
        .from('buyers')
        .insert({
          household_id: householdId,
          name: displayName || 'Me',
          emoji: selectedEmoji,
          user_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Welcome!",
        description: "You've joined the household successfully.",
      });

      // Wait a moment for the toast to show, then redirect
      setTimeout(() => {
        onJoined();
      }, 1000);
    } catch (error: any) {
      console.error('Error creating buyer:', error);
      toast({
        title: "Error",
        description: "Could not complete setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'emoji') {
    return (
      <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="w-6 h-6 text-primary" />
              Choose Your Emoji
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Pick an emoji to represent yourself in the household. This will help others
                know which gifts you're buying.
              </p>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Your Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="mb-4"
              />
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Choose an emoji
              </label>
              <div className="flex flex-wrap gap-1 mb-4">
                {emojiOptions.map((emoji) => (
                  <Button
                    key={emoji}
                    variant={selectedEmoji === emoji ? "default" : "ghost"}
                    size="sm"
                    className="h-10 w-10 p-0 text-lg"
                    onClick={() => setSelectedEmoji(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleCreateBuyer}
              disabled={loading || !displayName.trim()}
              className="w-full min-h-[44px] touch-target focus-ring"
            >
              {loading ? 'Finishing...' : 'Complete Setup'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Users className="w-6 h-6 text-primary" />
            Join a Household
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              If someone shared an invite code with you, enter it below to join their household
              and share the same gift list.
            </p>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Invite Code
            </label>
            <Input
              placeholder="Enter 8-character code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="font-mono text-lg tracking-wider uppercase"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleJoinHousehold();
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleJoinHousehold}
              disabled={loading || !inviteCode.trim()}
              className="flex-1 min-h-[44px] touch-target focus-ring"
            >
              {loading ? 'Joining...' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={onSkip}
              className="min-h-[44px] touch-target focus-ring"
            >
              Skip
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Don't have a code? Skip to create your own household. You can always join later from Settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinHousehold;
