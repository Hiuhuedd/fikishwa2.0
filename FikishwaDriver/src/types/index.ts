export interface Driver {
    uid: string;
    phone: string;
    name?: string;
    email?: string;
    registrationStatus: 'pending' | 'submitted' | 'pending_review' | 'approved' | 'rejected';
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    profilePhotoUrl?: string;
    vehicleType?: string;
    isOnline?: boolean;
}

export interface AuthState {
    token: string | null;
    user: Driver | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: Driver) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<Driver>) => void;
    checkAuth: () => Promise<void>;
}
