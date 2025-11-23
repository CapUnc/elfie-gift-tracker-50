import { useState } from 'react';
import { useGiftTemplates } from '@/hooks/useGiftTemplates';
import { useGivers } from '@/hooks/useGivers';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit } from 'lucide-react';

interface TemplatesManagerProps {
  householdId: string | null;
}

const COMMON_ICONS = ['🏷️', '🎁', '🧦', '🍬', '📚', '🎮', '🧸', '👕', '🎨', '⚽', '🎵', '🎬'];
const COMMON_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
];

const TemplatesManager = ({ householdId }: TemplatesManagerProps) => {
  const { templates, loading: templatesLoading, addTemplate, updateTemplate, deleteTemplate } = useGiftTemplates(householdId);
  const { givers, loading: giversLoading } = useGivers(householdId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    default_cost: '',
    default_giver_ids: [] as string[],
    tag_color: '#3b82f6',
    tag_icon: '🏷️',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      default_cost: '',
      default_giver_ids: [],
      tag_color: '#3b82f6',
      tag_icon: '🏷️',
    });
  };

  const handleAddTemplate = async () => {
    if (!formData.name.trim()) return;
    
    try {
      await addTemplate({
        name: formData.name.trim(),
        default_cost: formData.default_cost ? parseFloat(formData.default_cost) : null,
        default_giver_ids: formData.default_giver_ids,
        tag_color: formData.tag_color,
        tag_icon: formData.tag_icon,
      });
      resetForm();
      setIsAddDialogOpen(false);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleEditTemplate = async () => {
    if (!editingTemplate || !formData.name.trim()) return;
    
    try {
      await updateTemplate(editingTemplate.id, {
        name: formData.name.trim(),
        default_cost: formData.default_cost ? parseFloat(formData.default_cost) : null,
        default_giver_ids: formData.default_giver_ids,
        tag_color: formData.tag_color,
        tag_icon: formData.tag_icon,
      });
      setEditingTemplate(null);
      resetForm();
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplateId) return;
    
    try {
      await deleteTemplate(deletingTemplateId);
      setDeletingTemplateId(null);
    } catch (err) {
      // Error handled in hook
    }
  };

  const openEditDialog = (template: any) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      default_cost: template.default_cost?.toString() || '',
      default_giver_ids: template.default_giver_ids || [],
      tag_color: template.tag_color,
      tag_icon: template.tag_icon,
    });
  };

  const toggleGiver = (giverId: string) => {
    setFormData(prev => ({
      ...prev,
      default_giver_ids: prev.default_giver_ids.includes(giverId)
        ? prev.default_giver_ids.filter(id => id !== giverId)
        : [...prev.default_giver_ids, giverId],
    }));
  };

  if (templatesLoading || giversLoading) {
    return <div className="p-6">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gift Templates</CardTitle>
              <CardDescription>Create reusable templates for common gifts</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Template</DialogTitle>
                  <DialogDescription>Create a reusable gift template</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Stocking Stuffer"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-cost">Default Cost (optional)</Label>
                    <Input
                      id="template-cost"
                      type="number"
                      step="0.01"
                      value={formData.default_cost}
                      onChange={(e) => setFormData({ ...formData, default_cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tag Icon</Label>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData({ ...formData, tag_icon: icon })}
                          className={`text-2xl p-2 rounded-lg border-2 transition-colors ${
                            formData.tag_icon === icon ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tag Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, tag_color: color.value })}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            formData.tag_color === color.value ? 'border-primary scale-110' : 'border-border'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Default Givers (optional)</Label>
                    <div className="space-y-2">
                      {givers.map(giver => (
                        <div key={giver.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`giver-${giver.id}`}
                            checked={formData.default_giver_ids.includes(giver.id)}
                            onCheckedChange={() => toggleGiver(giver.id)}
                          />
                          <label htmlFor={`giver-${giver.id}`} className="text-sm cursor-pointer">
                            {giver.icon} {giver.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg bg-muted/50">
                    <Label className="text-xs text-muted-foreground">Preview</Label>
                    <Badge style={{ backgroundColor: formData.tag_color }} className="mt-2">
                      {formData.tag_icon} {formData.name || 'Template Name'}
                    </Badge>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddTemplate}>Add Template</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No templates yet. Create your first template to speed up gift entry.</p>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                >
                  <Badge style={{ backgroundColor: template.tag_color }}>
                    {template.tag_icon} {template.name}
                  </Badge>
                  {template.default_cost && (
                    <span className="text-sm text-muted-foreground">${template.default_cost.toFixed(2)}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Used {(() => {
                      const { data: gifts = [] } = useQuery({
                        queryKey: ['gifts-for-template', template.id, householdId],
                        queryFn: async () => {
                          if (!householdId) return [];
                          const { data } = await supabase
                            .from('gifts')
                            .select('id')
                            .eq('household_id', householdId)
                            .eq('template_id', template.id);
                          return data || [];
                        },
                        enabled: !!householdId,
                      });
                      return gifts.length;
                    })()} {(() => {
                      const { data: gifts = [] } = useQuery({
                        queryKey: ['gifts-for-template', template.id, householdId],
                        queryFn: async () => {
                          if (!householdId) return [];
                          const { data } = await supabase
                            .from('gifts')
                            .select('id')
                            .eq('household_id', householdId)
                            .eq('template_id', template.id);
                          return data || [];
                        },
                        enabled: !!householdId,
                      });
                      return gifts.length === 1 ? 'time' : 'times';
                    })()}
                  </span>
                  <div className="flex-1" />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingTemplateId(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => {
        if (!open) {
          setEditingTemplate(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Update template details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-template-name">Template Name</Label>
              <Input
                id="edit-template-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-template-cost">Default Cost (optional)</Label>
              <Input
                id="edit-template-cost"
                type="number"
                step="0.01"
                value={formData.default_cost}
                onChange={(e) => setFormData({ ...formData, default_cost: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tag Icon</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, tag_icon: icon })}
                    className={`text-2xl p-2 rounded-lg border-2 transition-colors ${
                      formData.tag_icon === icon ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tag Color</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, tag_color: color.value })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      formData.tag_color === color.value ? 'border-primary scale-110' : 'border-border'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Default Givers (optional)</Label>
              <div className="space-y-2">
                {givers.map(giver => (
                  <div key={giver.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-giver-${giver.id}`}
                      checked={formData.default_giver_ids.includes(giver.id)}
                      onCheckedChange={() => toggleGiver(giver.id)}
                    />
                    <label htmlFor={`edit-giver-${giver.id}`} className="text-sm cursor-pointer">
                      {giver.icon} {giver.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <Badge style={{ backgroundColor: formData.tag_color }} className="mt-2">
                {formData.tag_icon} {formData.name}
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
            <Button onClick={handleEditTemplate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTemplateId} onOpenChange={(open) => !open && setDeletingTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This template will be removed. Existing gifts created from this template will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TemplatesManager;
