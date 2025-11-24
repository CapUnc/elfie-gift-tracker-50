import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import { useGivers } from '@/hooks/useGivers';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Copy, RefreshCw, Check, Loader2, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface HouseholdMember {
  id: string;
  display_name: string | null;
  created_at: string;
}

const HouseholdManager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { householdId } = useHousehold(user?.id);
  const { givers } = useGivers(householdId);
  const { toast } = useToast();

  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchMembers(), fetchOrGenerateInviteCode()]);
      setLoading(false);
    };

    if (householdId) {
      loadData();
    }
  }, [householdId]);

  const fetchMembers = async () => {
    if (!householdId) return;

    try {
      const { data, error } = await supabase.rpc('get_household_members');
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchOrGenerateInviteCode = async () => {
    try {
      const { data: existingCodes } = await supabase
        .from('invite_codes')
        .select('code')
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingCodes && existingCodes.length > 0) {
        setInviteCode(existingCodes[0].code);
      } else {
        await generateNewInviteCode();
      }
    } catch (error) {
      console.error('Error fetching invite code:', error);
    }
  };

  const generateNewInviteCode = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.rpc('generate_invite_code');
      if (error) throw error;
      setInviteCode(data);
      toast({ title: 'New invite code generated' });
    } catch (error) {
      toast({ title: 'Error generating code', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveHousehold = async () => {
    if (!user || !householdId) return;

    setLeaving(true);
    try {
      await supabase.from('recipients').update({ assigned_to: null }).eq('household_id', householdId).eq('assigned_to', user.id);
      await supabase.from('gifts').update({ assigned_to: null }).eq('household_id', householdId).eq('assigned_to', user.id);
      await supabase.from('givers').delete().eq('profile_id', user.id);
      await supabase.from('profiles').update({ household_id: null }).eq('id', user.id);

      toast({ title: 'Left household' });
      navigate('/welcome');
    } catch (error) {
      toast({ title: 'Error leaving household', variant: 'destructive' });
    } finally {
      setLeaving(false);
      setShowLeaveDialog(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-3xl font-bold">Household</h1>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Invite Code</h2>
        <div className="flex gap-2">
          <Input value={inviteCode} readOnly className="font-mono" />
          <Button onClick={copyInviteCode} variant="outline">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
          <Button onClick={generateNewInviteCode} variant="outline" disabled={generating}><RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} /></Button>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Members ({members.length})</h2>
          {members.length > 1 && <Button variant="outline" size="sm" onClick={() => setShowLeaveDialog(true)} className="text-destructive"><LogOut className="h-4 w-4 mr-2" />Leave</Button>}
        </div>
        <div className="space-y-3">
          {members.map((member) => {
            const giver = givers.find(g => g.profile_id === member.id);
            return (
              <div key={member.id} className="p-4 bg-secondary/50 rounded-lg flex items-center gap-3">
                {giver && <span className="text-3xl">{giver.icon}</span>}
                <div className="flex-1">
                  <div className="font-medium">{giver?.name || member.display_name || 'Anonymous'} {member.id === user?.id && <span className="text-sm text-muted-foreground">(You)</span>}</div>
                  <div className="text-sm text-muted-foreground">Joined {new Date(member.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Household?</AlertDialogTitle>
            <AlertDialogDescription>{members.length === 1 ? 'You are the last member. This will delete all household data.' : 'You will be removed from the household.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveHousehold} disabled={leaving} className="bg-destructive">{leaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HouseholdManager;
