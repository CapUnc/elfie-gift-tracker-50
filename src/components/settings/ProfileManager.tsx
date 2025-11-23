import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useHousehold } from '@/hooks/useHousehold';
import { useGivers } from '@/hooks/useGivers';
import { ArrowLeft, Edit, Info, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { COMMON_GIVER_ICONS } from '@/types/givers';

const ProfileManager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { householdId } = useHousehold(user?.id);
  const { profileLinkedGivers, loading, updateGiver } = useGivers(householdId);
  const buyers = profileLinkedGivers; // For compatibility
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  const ownBuyer = buyers.find(b => b.profile_id === user?.id);
  const otherBuyers = buyers.filter(b => b.profile_id !== user?.id);

  const handleEdit = () => {
    if (ownBuyer) {
      setEditName(ownBuyer.name);
      setEditIcon(ownBuyer.icon || '🎁');
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!ownBuyer) return;

    try {
      await updateGiver(ownBuyer.id, {
        name: editName,
        icon: editIcon,
      });

      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved',
      });
      setIsEditing(false);
    } catch (error) {
      // Error already handled by hook
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-1/3"></div>
          <div className="h-32 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/settings')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Your Profile</h1>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Identity</h2>
          
          {!isEditing && ownBuyer && (
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{ownBuyer.icon || '🎁'}</span>
                <div>
                  <p className="font-semibold">{ownBuyer.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">(You)</p>
                    <Badge variant="secondary" className="gap-1">
                      <Gift className="h-3 w-3" />
                      Gift Giver
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          )}

          {isEditing && (
            <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <Label>Your Emoji</Label>
                <div className="grid grid-cols-6 gap-2">
                  {COMMON_GIVER_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setEditIcon(emoji)}
                      className={`text-3xl p-3 rounded-lg transition-all flex items-center justify-center ${
                        editIcon === emoji
                          ? 'bg-primary/20 ring-2 ring-primary scale-110'
                          : 'bg-background hover:bg-secondary'
                      }`}
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {!ownBuyer && (
            <div className="p-4 bg-secondary/50 rounded-lg text-center text-muted-foreground">
              <p>You don't have a profile in this household yet.</p>
            </div>
          )}
        </div>

        {otherBuyers.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Other Household Members</h2>
            <div className="space-y-2">
              {otherBuyers.map((buyer) => (
                <div
                  key={buyer.id}
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{buyer.icon || '🎁'}</span>
                    <p className="font-medium">{buyer.name}</p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Gift className="h-3 w-3" />
                    Gift Giver
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-500 mb-1">Add More Members</p>
            <p className="text-muted-foreground">
              To invite others to your household, share your invite code from the{' '}
              <button
                onClick={() => navigate('/settings/household')}
                className="text-blue-500 underline hover:text-blue-600"
              >
                Household Sharing
              </button>{' '}
              settings.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfileManager;
