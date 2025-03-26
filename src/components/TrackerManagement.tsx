
import { useState, useEffect } from "react";
import { SavedTracker, getSavedTrackers, saveTracker, deleteTracker } from "@/utils/locationUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Trash2, Edit2, Plus, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TrackerManagementProps {
  currentTrackerId?: string;
  onSelectTracker?: (trackerId: string) => void;
}

const TrackerManagement = ({ currentTrackerId, onSelectTracker }: TrackerManagementProps) => {
  const [trackers, setTrackers] = useState<SavedTracker[]>([]);
  const [editingTracker, setEditingTracker] = useState<SavedTracker | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved trackers from local storage
    setTrackers(getSavedTrackers());
  }, []);
  
  useEffect(() => {
    // If we have a current tracker ID and it's not saved, let's pre-populate for saving
    if (currentTrackerId && !trackers.some(t => t.id === currentTrackerId)) {
      setEditingTracker({
        id: currentTrackerId,
        name: `Tracker ${trackers.length + 1}`
      });
    }
  }, [currentTrackerId, trackers]);

  const handleSaveTracker = () => {
    if (editingTracker) {
      saveTracker(editingTracker);
      setTrackers(getSavedTrackers());
      setEditingTracker(null);
      
      toast({
        title: "Tracker saved",
        description: `Tracker "${editingTracker.name}" has been saved`,
      });
    }
  };

  const handleDeleteTracker = (id: string) => {
    const tracker = trackers.find(t => t.id === id);
    if (tracker) {
      deleteTracker(id);
      setTrackers(trackers.filter(t => t.id !== id));
      
      toast({
        title: "Tracker deleted",
        description: `Tracker "${tracker.name}" has been deleted`,
        variant: "destructive",
      });
    }
  };

  const handleSelectTracker = (id: string) => {
    if (onSelectTracker) {
      onSelectTracker(id);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            Saved Trackers
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => {
                    if (currentTrackerId) {
                      setEditingTracker({
                        id: currentTrackerId,
                        name: `Tracker ${trackers.length + 1}`
                      });
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Save Current
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Tracker</DialogTitle>
                </DialogHeader>
                {editingTracker && (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tracker ID</label>
                      <Input 
                        value={editingTracker.id} 
                        readOnly 
                        className="font-mono text-sm bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input 
                        value={editingTracker.name} 
                        onChange={(e) => setEditingTracker({
                          ...editingTracker,
                          name: e.target.value
                        })}
                        placeholder="Enter a name for this tracker"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notes (optional)</label>
                      <Input 
                        value={editingTracker.notes || ''}
                        onChange={(e) => setEditingTracker({
                          ...editingTracker,
                          notes: e.target.value
                        })}
                        placeholder="Add optional notes"
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={handleSaveTracker}>
                      <Save className="h-4 w-4 mr-1" /> Save Tracker
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trackers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No saved trackers yet</p>
              <p className="text-sm mt-2">Save trackers to easily access them later</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trackers.map(tracker => (
                <div 
                  key={tracker.id}
                  className={`p-3 rounded-md border flex items-center justify-between ${
                    currentTrackerId === tracker.id ? 'bg-primary/10 border-primary/30' : ''
                  }`}
                >
                  <div className="overflow-hidden">
                    <div 
                      className="font-medium truncate cursor-pointer"
                      onClick={() => handleSelectTracker(tracker.id)}
                    >
                      {tracker.name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {tracker.id}
                    </div>
                    {tracker.notes && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {tracker.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setEditingTracker(tracker)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Tracker</DialogTitle>
                        </DialogHeader>
                        {editingTracker && (
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Tracker ID</label>
                              <Input 
                                value={editingTracker.id} 
                                readOnly 
                                className="font-mono text-sm bg-muted"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Name</label>
                              <Input 
                                value={editingTracker.name} 
                                onChange={(e) => setEditingTracker({
                                  ...editingTracker,
                                  name: e.target.value
                                })}
                                placeholder="Enter a name for this tracker"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Notes (optional)</label>
                              <Input 
                                value={editingTracker.notes || ''}
                                onChange={(e) => setEditingTracker({
                                  ...editingTracker,
                                  notes: e.target.value
                                })}
                                placeholder="Add optional notes"
                              />
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button onClick={handleSaveTracker}>
                              <Save className="h-4 w-4 mr-1" /> Save Changes
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive/90"
                      onClick={() => handleDeleteTracker(tracker.id)}
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
    </div>
  );
};

export default TrackerManagement;
