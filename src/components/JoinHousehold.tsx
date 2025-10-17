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
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

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

      toast({
        title: "Success!",
        description: "You've joined the household. Redirecting...",
      });

      // Wait a moment for the toast to show, then redirect
      setTimeout(() => {
        onJoined();
      }, 1000);
    } catch (error: any) {
      console.error('Error joining household:', error);
      toast({
        title: "Invalid code",
        description: "The invite code is invalid or expired.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
              {loading ? 'Joining...' : 'Join Household'}
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
