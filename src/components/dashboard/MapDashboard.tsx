import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import { Icon, LatLngTuple } from "leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin,
  AlertTriangle,
  Heart,
  Home,
  Utensils,
  Shield,
  Filter,
  RefreshCw,
  Clock,
  Users,
  Eye,
  CheckCircle,
  X,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Phone,
  MessageSquare,
  type LucideIcon
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import { type Issue, issues as mockIssues, type Urgency, type IssueStatus, type Category } from "@/data/mockData";
import { getLatLng } from "@/lib/map-utils";
import { useCrisis } from "@/contexts/CrisisContext";
import { copyCrisisLink, generateCrisisLink } from "@/lib/crisis-utils";
import { emergencyServices, serviceTypeEmoji, serviceTypeLabel } from "@/data/emergencyServices";

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapDashboardProps {
  userRole: 'admin' | 'ngo' | 'volunteer' | 'public';
  userLocation?: LatLngTuple;
  issues: Issue[];
  onIssueClick?: (issue: Issue) => void;
  onReportIssue?: () => void;
  className?: string;
}

const categoryIcons: Record<Category, LucideIcon> = {
  Health: Utensils, // Fallback if specific icon not found
  Disaster: AlertTriangle,
  Food: Utensils,
  Infrastructure: Home,
  Environment: Heart,
  Safety: Shield,
  Communication: MessageSquare,
  Shelter: Home
};

const urgencyColors: Record<Urgency, string> = {
  High: 'text-red-600 bg-red-100 border-red-200',
  Medium: 'text-yellow-600 bg-yellow-100 border-yellow-200',
  Low: 'text-green-600 bg-green-100 border-green-200'
};

const statusColors: Record<IssueStatus, string> = {
  Pending: 'text-muted-foreground bg-muted',
  Verified: 'text-warning-600 bg-warning-100',
  "In Progress": 'text-primary-600 bg-primary-100',
  Solved: 'text-success-600 bg-success-100'
};

// Custom marker component
function CustomMarker({ issue, onClick }: { issue: Issue; onClick?: (issue: Issue) => void }) {
  const IconComponent = categoryIcons[issue.category] || MapPin;

  const color = issue.urgency === 'High' ? '#dc2626' : issue.urgency === 'Medium' ? '#ca8a04' : '#16a34a';

  const customIcon = new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="14" fill="white" stroke="${color}" stroke-width="3"/>
        <circle cx="16" cy="16" r="10" fill="${color}"/>
        <path d="M16 8 L20 16 L16 20 L12 16 Z" fill="white"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  return (
    <Marker position={getLatLng(issue.coords)} icon={customIcon} eventHandlers={{ click: () => onClick?.(issue) }}>
      <Popup>
        <div className="p-2 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <IconComponent className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">{issue.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{issue.description}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${urgencyColors[issue.urgency]}`}>
              {issue.urgency}
            </Badge>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[issue.status]}`}>
              {issue.status}
            </Badge>
          </div>
          <div className="text-[10px] text-muted-foreground space-y-1">
            <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {issue.location}</p>
            <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(issue.createdAt).toLocaleString()}</p>
            <p className="flex items-center gap-1"><Users className="h-3 w-3" /> Volunteers: {issue.assignedVolunteers.length}</p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// Map controller for centering
function MapController({ center }: { center: LatLngTuple }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export function MapDashboard({
  userRole,
  userLocation = [20.5937, 78.9629], // Center of India
  issues = mockIssues,
  onIssueClick,
  onReportIssue,
  className
}: MapDashboardProps) {
  const [center, setCenter] = useState<LatLngTuple>(userLocation);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Filter issues based on current filters
  const filteredIssues = useMemo(() => issues.filter(issue => {
    if (filterType !== 'all' && issue.category !== filterType) return false;
    if (filterStatus !== 'all' && issue.status !== filterStatus) return false;
    if (filterPriority !== 'all' && issue.urgency !== filterPriority) return false;
    return true;
  }), [issues, filterType, filterStatus, filterPriority]);

  // Calculate stats
  const stats = useMemo(() => ({
    total: issues.length,
    active: issues.filter(i => i.status !== 'Solved').length,
    assigned: issues.filter(i => i.assignedNgo !== null).length,
    resolved: issues.filter(i => i.status === 'Solved').length,
  }), [issues]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
    onIssueClick?.(issue);
  };

  const getRoleSpecificActions = () => {
    switch (userRole) {
      case 'admin':
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              System View
            </Button>
          </div>
        );
      case 'ngo':
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              My Assignments
            </Button>
          </div>
        );
      case 'volunteer':
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setCenter(userLocation)}>
              <Navigation className="h-4 w-4 mr-2" />
              My Location
            </Button>
            <Button size="sm" variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Available Tasks
            </Button>
          </div>
        );
      case 'public':
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={onReportIssue}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCenter(userLocation)}>
              <Navigation className="h-4 w-4 mr-2" />
              My Area
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Live Crisis Map</h2>
          <p className="text-muted-foreground">
            {userRole === 'admin' && 'Monitor all crisis situations and response activities'}
            {userRole === 'ngo' && 'View issues in your operational area and coordinate responses'}
            {userRole === 'volunteer' && 'Find nearby issues and navigate to assignment locations'}
            {userRole === 'public' && 'View community issues and report new emergencies'}
          </p>
        </div>
        {getRoleSpecificActions()}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.assigned}</p>
                <p className="text-xs text-muted-foreground">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.resolved}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Issue Category</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Disaster">Disaster</SelectItem>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="Environment">Environment</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Communication">Communication</SelectItem>
                  <SelectItem value="Shelter">Shelter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Solved">Solved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Urgency</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="h-[400px] sm:h-[500px] lg:h-[600px] relative">
            <MapContainer
              center={center}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              className="rounded-lg"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController center={center} />
              {filteredIssues.map((issue) => (
                <CustomMarker
                  key={issue.id}
                  issue={issue}
                  onClick={handleIssueClick}
                />
              ))}
            </MapContainer>

            {/* Map Legend */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-background/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 shadow-lg border max-w-[140px] sm:max-w-none z-[1000]">
              <h4 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2">Urgency</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-600"></div>
                  <span className="text-xs">High</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-600"></div>
                  <span className="text-xs">Medium</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-600"></div>
                  <span className="text-xs">Low</span>
                </div>
              </div>
            </div>

            {/* Issue Details Panel (when issue is selected) */}
            {selectedIssue && (
              <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border z-[1000]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{selectedIssue.title}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedIssue(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{selectedIssue.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge variant="outline" className={`text-[10px] ${urgencyColors[selectedIssue.urgency]}`}>
                    {selectedIssue.urgency}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${statusColors[selectedIssue.status]}`}>
                    {selectedIssue.status}
                  </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground space-y-1 mb-3">
                  <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {selectedIssue.location}</p>
                  <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(selectedIssue.createdAt).toLocaleDateString()}</p>
                  <p className="flex items-center gap-1"><Users className="h-3 w-3" /> Volunteers: {selectedIssue.assignedVolunteers.length}</p>
                </div>
                {userRole === 'volunteer' && selectedIssue.status === 'Verified' && (
                  <Button size="sm" className="w-full mt-3">
                    Accept Task
                  </Button>
                )}
                {userRole === 'ngo' && selectedIssue.status === 'Verified' && (
                  <Button size="sm" className="w-full mt-3">
                    Assign Volunteers
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}