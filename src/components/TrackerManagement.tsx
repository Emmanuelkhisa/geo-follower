
import { useState, useEffect } from "react";
import { SavedTracker, getSavedTrackers, saveTracker, deleteTracker, startBackgroundTracking, stopBackgroundTracking } from "@/utils/locationUtils";
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
import { Trash2, Edit2, Plus, Save, Zap, ZapOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface TrackerManagementProps {
  currentTrackerId?: string;
  onSelectTracker?: (trackerId: string) => void;
}

const TrackerManagement = ({ currentTrackerId, onSelectTracker }: TrackerManagementProps) => {
  const [trackers, setTrackers] = useState<SavedTracker[]>([]);
  const [editingTracker, setEditingTracker] = useState<SavedTracker | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Load saved trackers from local storage
    setTrackers(getSavedTrackers());
    
    // Setup listener for service worker messages
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, trackerId } = event.data;
      
      if (type === 'TRACKING_STARTED' || type === 'TRACKING_STOPPED') {
        // Refresh the tracker list to update status
        setTrackers(getSavedTrackers());
      }
    };
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }
    
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
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
    } else {
      // Navigate to tracker page
      navigate(`/track/${id}`);
    }
  };
  
  const toggleTracking = (tracker: SavedTracker) => {
    if (tracker.isTracking) {
      stopBackgroundTracking(tracker.id);
      toast({
        title: "Tracking stopped",
        description: `Background tracking stopped for "${tracker.name}"`,
      });
    } else {
      startBackgroundTracking(tracker.id);
      toast({
        title: "Tracking started",
        description: `Background tracking started for "${tracker.name}"`,
      });
    }
    
    // Update local state immediately for better UX
    setTrackers(prev => 
      prev.map(t => 
        t.id === tracker.id 
          ? { ...t, isTracking: !t.isTracking } 
          : t
      )
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            Saved Trackers
            {currentTrackerId && (
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
            )}
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
                      {tracker.isTracking && (
                        <span className="inline-flex items-center ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {tracker.id}
                    </div>
                    {tracker.notes && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {tracker.notes}
                      </div>
                    )}
                    {tracker.lastSeen && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Last seen: {new Date(tracker.lastSeen).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${tracker.isTracking ? 'text-green-600' : ''}`}
                      onClick={() => toggleTracking(tracker)}
                      title={tracker.isTracking ? "Stop tracking" : "Start tracking"}
                    >
                      {tracker.isTracking ? (
                        <ZapOff className="h-4 w-4" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                    </Button>
                    
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
