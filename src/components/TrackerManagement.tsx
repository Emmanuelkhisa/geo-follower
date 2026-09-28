import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  SavedTracker, 
  getSavedTrackers, 
  saveTracker, 
  deleteTracker, 
  startBackgroundTracking, 
  stopBackgroundTracking 
} from "@/utils/locationUtils";
import { copyTextToClipboard } from "@/utils/shareUtils";
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
import { 
  Trash2, 
  Edit2, 
  Plus, 
  Save, 
  Zap, 
  ZapOff, 
  Map, 
  Radio, 
  Share2, 
  Check, 
  Copy,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TrackerManagementProps {
  currentTrackerId?: string;
  onSelectTracker?: (trackerId: string) => void;
}

const TrackerManagement = ({ currentTrackerId, onSelectTracker }: TrackerManagementProps) => {
  const [trackers, setTrackers] = useState<SavedTracker[]>([]);
  const [editingTracker, setEditingTracker] = useState<SavedTracker | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setTrackers(getSavedTrackers());
    
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type } = event.data;
      if (type === 'TRACKING_STARTED' || type === 'TRACKING_STOPPED') {
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
        description: `Tracker "${editingTracker.name}" has been updated.`,
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
        description: `Tracker "${tracker.name}" has been removed.`,
        variant: "destructive",
      });
    }
  };

  const handleCopyTrackerUrl = async (id: string) => {
    const url = `${window.location.origin}/track/${id}`;
    const success = await copyTextToClipboard(url);
    if (success) {
      setCopiedId(id);
      toast({
        title: "Tracking link copied",
        description: `Direct link for tracker "${id}" copied to clipboard.`,
        duration: 3000,
      });
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSelectTracker = (id: string) => {
    if (onSelectTracker) {
      onSelectTracker(id);
    } else {
      navigate(`/map/${id}`);
    }
  };
  
  const toggleTracking = (tracker: SavedTracker) => {
    if (tracker.isTracking) {
      stopBackgroundTracking(tracker.id);
      toast({
        title: "Tracking stopped",
        description: `Background broadcasting disabled for "${tracker.name}".`,
      });
    } else {
      startBackgroundTracking(tracker.id);
      toast({
        title: "Tracking started",
        description: `Background broadcasting active for "${tracker.name}".`,
      });
    }
    
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
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Active & Saved Tracking Sessions
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {trackers.length} {trackers.length === 1 ? "session" : "sessions"} stored locally
            </p>
          </div>
          {currentTrackerId && (
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs gap-1 border-slate-300"
                  onClick={() => {
                    if (currentTrackerId) {
                      setEditingTracker({
                        id: currentTrackerId,
                        name: `Tracker ${trackers.length + 1}`
                      });
                    }
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Save Current
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base">Save Tracker</DialogTitle>
                </DialogHeader>
                {editingTracker && (
                  <div className="space-y-3 py-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Tracker ID</label>
                      <Input 
                        value={editingTracker.id} 
                        readOnly 
                        className="font-mono text-xs bg-slate-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Tracker Name</label>
                      <Input 
                        value={editingTracker.name} 
                        onChange={(e) => setEditingTracker({
                          ...editingTracker,
                          name: e.target.value
                        })}
                        placeholder="e.g. Work Van, Family Phone"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Notes (Optional)</label>
                      <Input 
                        value={editingTracker.notes || ''}
                        onChange={(e) => setEditingTracker({
                          ...editingTracker,
                          notes: e.target.value
                        })}
                        placeholder="Notes or description"
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}
                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose asChild>
                    <Button variant="outline" size="sm" className="text-xs">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={handleSaveTracker} size="sm" className="bg-geo-blue text-xs gap-1">
                      <Save className="h-3.5 w-3.5" /> Save Tracker
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="p-4">
          {trackers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground space-y-2">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Radio className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-700">No saved tracking sessions</p>
              <p className="text-xs max-w-xs mx-auto">
                Generate a new tracker to start streaming or monitoring live device coordinates.
              </p>
              <Button asChild size="sm" className="mt-3 bg-geo-blue hover:bg-geo-blue/90 text-xs gap-1.5">
                <Link to="/create">
                  <Plus className="h-3.5 w-3.5" /> Create Your First Tracker
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {trackers.map(tracker => {
                const isSelected = currentTrackerId === tracker.id;
                const isCopied = copiedId === tracker.id;

                return (
                  <div 
                    key={tracker.id}
                    className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected 
                        ? 'bg-geo-blue/5 border-geo-blue/40 shadow-sm' 
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="overflow-hidden space-y-1">
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-semibold text-slate-900 text-sm hover:text-geo-blue cursor-pointer transition-colors"
                          onClick={() => handleSelectTracker(tracker.id)}
                        >
                          {tracker.name}
                        </span>
                        {tracker.isTracking ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Broadcasting
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Idle
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                        <span className="text-slate-600 font-mono text-[11px]">{tracker.id}</span>
                        {tracker.lastSeen && (
                          <>
                            <span aria-hidden="true" className="text-slate-300 font-sans">·</span>
                            <span className="text-[11px] font-sans">
                              {new Date(tracker.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                        {tracker.notes && (
                          <>
                            <span aria-hidden="true" className="text-slate-300 font-sans">·</span>
                            <span className="text-[11px] font-sans italic text-slate-500 truncate max-w-[200px]">
                              {tracker.notes}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {/* Open Map Button */}
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-slate-700 hover:text-geo-blue gap-1"
                        title="View on Map"
                      >
                        <Link to={`/map/${tracker.id}`}>
                          <Map className="h-3.5 w-3.5 text-geo-blue" />
                          <span className="hidden sm:inline">Map</span>
                        </Link>
                      </Button>

                      {/* Open Transmitter Button */}
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-slate-700 hover:text-geo-blue gap-1"
                        title="Open Transmitter"
                      >
                        <Link to={`/track/${tracker.id}`}>
                          <Radio className="h-3.5 w-3.5 text-slate-500" />
                          <span className="hidden sm:inline">Transmitter</span>
                        </Link>
                      </Button>

                      {/* Copy Share URL */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-slate-700 hover:text-geo-blue gap-1"
                        onClick={() => handleCopyTrackerUrl(tracker.id)}
                        title="Copy tracking link"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-700 hidden sm:inline">Copied</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Share</span>
                          </>
                        )}
                      </Button>

                      {/* Background Tracking Toggle */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${tracker.isTracking ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-slate-400 hover:text-slate-700'}`}
                        onClick={() => toggleTracking(tracker)}
                        title={tracker.isTracking ? "Pause background broadcast" : "Start background broadcast"}
                      >
                        {tracker.isTracking ? (
                          <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
                        ) : (
                          <ZapOff className="h-4 w-4" />
                        )}
                      </Button>
                      
                      {/* Edit Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-slate-800"
                            onClick={() => setEditingTracker(tracker)}
                            title="Edit tracker name"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-base">Edit Tracker</DialogTitle>
                          </DialogHeader>
                          {editingTracker && (
                            <div className="space-y-3 py-2">
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">Tracker ID</label>
                                <Input 
                                  value={editingTracker.id} 
                                  readOnly 
                                  className="font-mono text-xs bg-slate-100"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">Name</label>
                                <Input 
                                  value={editingTracker.name} 
                                  onChange={(e) => setEditingTracker({
                                    ...editingTracker,
                                    name: e.target.value
                                  })}
                                  placeholder="Enter tracker name"
                                  className="text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-700">Notes (Optional)</label>
                                <Input 
                                  value={editingTracker.notes || ''}
                                  onChange={(e) => setEditingTracker({
                                    ...editingTracker,
                                    notes: e.target.value
                                  })}
                                  placeholder="Add notes"
                                  className="text-xs"
                                />
                              </div>
                            </div>
                          )}
                          <DialogFooter className="gap-2 sm:gap-0">
                            <DialogClose asChild>
                              <Button variant="outline" size="sm" className="text-xs">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button onClick={handleSaveTracker} size="sm" className="bg-geo-blue text-xs gap-1">
                                <Save className="h-3.5 w-3.5" /> Save Changes
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      {/* Delete */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteTracker(tracker.id)}
                        title="Delete tracker"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackerManagement;
