import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronUp, ChevronDown, Edit, Trash2, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GiverListItemProps {
  giver: {
    id: string;
    name: string;
    icon: string | null;
    is_virtual: boolean;
  };
  index: number;
  totalCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}

const GiftCount = ({ giverId }: { giverId: string }) => {
  const { data: giftGivers = [] } = useQuery({
    queryKey: ['gift-givers-for-giver', giverId],
    queryFn: async () => {
      const { data } = await supabase
        .from('gift_givers')
        .select('id')
        .eq('giver_id', giverId);
      return data || [];
    },
  });
  
  return (
    <span className="text-xs text-muted-foreground">
      {giftGivers.length} {giftGivers.length === 1 ? 'gift' : 'gifts'}
    </span>
  );
};

export const GiverListItem = ({
  giver,
  index,
  totalCount,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: GiverListItemProps) => {
  const isProfileLinked = !giver.is_virtual;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={index === 0}
            className="h-4 w-6 p-0"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={index === totalCount - 1}
            className="h-4 w-6 p-0"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
        <span className="text-2xl">{giver.icon || '🎁'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{giver.name}</p>
          <GiftCount giverId={giver.id} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4" />
        </Button>
        {isProfileLinked ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                  >
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Linked to profile - cannot be deleted</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
