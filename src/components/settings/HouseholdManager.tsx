import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Copy, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';

interface HouseholdMember {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

const HouseholdManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    fetchMembers();
    fetchOrGenerateInviteCode();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_household_members');
      
      if (error) throw error;
      
      setMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching household members:', error);
      toast({
        title: "Error",
        description: "Failed to load household members.",
        variant: "destructive",
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchOrGenerateInviteCode = async () => {
    try {
      // Check for existing active invite code
      const { data: existingCodes, error: fetchError } = await supabase
        .from('invite_codes')
        .select('code')
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (existingCodes && existingCodes.length > 0) {
        setInviteCode(existingCodes[0].code);
      } else {
        // Generate new code if none exists
        await generateNewInviteCode();
      }
    } catch (error: any) {
      console.error('Error fetching invite code:', error);
    }
  };

  const generateNewInviteCode = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('generate_invite_code');
      
      if (error) throw error;
      
      setInviteCode(data);
      toast({
        title: "New invite code generated",
        description: "Share this code with others to join your household.",
      });
    } catch (error: any) {
      console.error('Error generating invite code:', error);
      toast({
        title: "Error",
        description: "Failed to generate invite code.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 min-h-[44px] touch-target focus-ring"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Button>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Household</h1>
          </div>
        </div>

        <div className="space-y-6">
          {/* Invite Code Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Invite Others
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Share this code with others to join your household
                </label>
                <div className="flex gap-2">
                  <Input
                    value={inviteCode}
                    readOnly
                    className="font-mono text-lg tracking-wider"
                  />
                  <Button
                    onClick={copyInviteCode}
                    variant="outline"
                    className="min-h-[44px] touch-target focus-ring"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    onClick={generateNewInviteCode}
                    variant="outline"
                    disabled={loading}
                    className="min-h-[44px] touch-target focus-ring"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Invite codes expire after 7 days. Generate a new one if needed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Household Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Household Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMembers ? (
                <p className="text-sm text-muted-foreground italic">Loading members...</p>
              ) : members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {member.display_name || member.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic p-6 text-center bg-muted/30 rounded-md">
                  No other members yet. Share your invite code to add members!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HouseholdManager;
