import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { GiverListItem } from './GiverListItem';

interface Giver {
  id: string;
  name: string;
  icon: string | null;
  is_virtual: boolean;
}

interface GiverSectionProps {
  title: string;
  description: string;
  icon: ReactNode;
  badge?: ReactNode;
  givers: Giver[];
  emptyMessage: string;
  headerAction?: ReactNode;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit: (giver: Giver) => void;
  onDelete?: (giver: Giver) => void;
}

export const GiverSection = ({
  title,
  description,
  icon,
  badge,
  givers,
  emptyMessage,
  headerAction,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: GiverSectionProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
          {badge && <div className="ml-2">{badge}</div>}
        </div>
        {headerAction}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {description}
      </p>

      {givers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-2">
          {givers.map((giver, index) => (
            <GiverListItem
              key={giver.id}
              giver={giver}
              index={index}
              totalCount={givers.length}
              onMoveUp={() => onMoveUp(index)}
              onMoveDown={() => onMoveDown(index)}
              onEdit={() => onEdit(giver)}
              onDelete={onDelete ? () => onDelete(giver) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};
