export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'dispatcher' | 'driver' | 'business_user';
  organizationId: string;
  businessId?: string | null;
  businessName?: string | null;
  phone?: string | null;
  driverStatus?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  address: string;
  organizationId: string;
}

export interface Driver {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  status?: 'available' | 'on_route' | 'off_duty';
  driverStatus?: string | null;
  organizationId: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  capacityKg: number;
  currentLoadKg: number;
  status: 'available' | 'in_use' | 'dispatched' | 'maintenance' | 'out_of_service';
  organizationId: string;
}

export interface PickupLocation {
  id: string;
  name?: string;
  address: string;
  latitude: number;
  longitude: number;
  businessId: string;
  businessName?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Pickup {
  id: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  weightKg: number;
  wasteCategory: string;
  locationId: string;
  location?: PickupLocation;
  organizationId: string;
  scheduledAt: string;
  completedAt?: string;
}

export interface Route {
  id: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  vehicleId: string;
  driverId?: string;
  distance?: number;
  totalDistanceM?: number;
  estimatedDuration?: number;
  totalDurationS?: number;
  organizationId: string;
  createdAt: string;
}

export interface DashboardStats {
  activeRoutes: number;
  pendingPickups: number;
  availableVehicles: number;
  completedToday: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface WasteCategory {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
