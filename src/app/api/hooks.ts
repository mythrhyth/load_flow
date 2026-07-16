import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { toast } from 'sonner';

// ─── AUTHENTICATION HOOKS ───────────────────────────────────────────────────
export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError, refetch } = useQuery({
    queryKey: ['auth-user'],
    queryFn: () => api.get('/auth/me').then(res => (res as any)?.user ?? null).catch(() => null),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: any) => api.post('/auth/login', credentials),
    onSuccess: (data: any) => {
      queryClient.setQueryData(['auth-user'], data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
    },
  });

  const signupMutation = useMutation({
    mutationFn: (details: any) => api.post('/auth/signup', details),
    onSuccess: (data: any) => {
      queryClient.setQueryData(['auth-user'], data.user);
      toast.success(`Account created successfully! Welcome, ${data.user.name}.`);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      queryClient.setQueryData(['auth-user'], null);
      queryClient.clear();
      toast.success('Signed out successfully.');
    },
  });

  return {
    user,
    isLoading,
    isError,
    refetch,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    signup: signupMutation.mutateAsync,
    isSigningUp: signupMutation.isPending,
    logout: logoutMutation.mutate,
  };
}

// ─── DASHBOARD HOOKS ────────────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard'),
    refetchInterval: 15000, // Auto refresh dashboard stats every 15s
  });
}

// ─── LOADS HOOKS ────────────────────────────────────────────────────────────
export function useLoads(filters?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ['loads', filters],
    queryFn: () => api.get('/loads', { params: filters }),
  });
}

export function useLoadDetail(id: string | null) {
  return useQuery({
    queryKey: ['load-detail', id],
    queryFn: () => (id ? api.get(`/loads/${id}`) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useCreateLoad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (loadData: any) => api.post('/loads', loadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Load created successfully!');
    },
  });
}

export function useUpdateLoad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/loads/${id}`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['load-detail', data.loadNumber] });
      queryClient.invalidateQueries({ queryKey: ['load-detail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Load updated successfully!');
    },
  });
}

export function useDeleteLoad() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/loads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Load deleted successfully.');
    },
  });
}

// ─── CARRIERS HOOKS ─────────────────────────────────────────────────────────
export function useCarriers() {
  return useQuery({
    queryKey: ['carriers'],
    queryFn: () => api.get('/carriers'),
  });
}

export function useCarrierDetail(id: string | null) {
  return useQuery({
    queryKey: ['carrier-detail', id],
    queryFn: () => (id ? api.get(`/carriers/${id}`) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useUpdateCarrierCompliance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/carriers/${id}/compliance`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      queryClient.invalidateQueries({ queryKey: ['carrier-detail', data.carrierId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Compliance records updated!');
    },
  });
}

// ─── SHIPPERS HOOKS ─────────────────────────────────────────────────────────
export function useShippers() {
  return useQuery({
    queryKey: ['shippers'],
    queryFn: () => api.get('/shippers'),
  });
}

export function useCreateShipper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shipperData: any) => api.post('/shippers', shipperData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shippers'] });
      toast.success('Shipper added successfully!');
    },
  });
}

// ─── STAFF HOOKS ────────────────────────────────────────────────────────────
export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: () => api.get('/staff'),
  });
}

export function useInviteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteData: any) => api.post('/staff/invite', inviteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Invitation sent successfully!');
    },
  });
}

export function useSetStaffStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'deactivate' | 'reactivate' }) => 
      api.put(`/staff/${id}/${status}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff status updated successfully.');
    },
  });
}

export function useChangeStaffRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => 
      api.put(`/staff/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff role updated!');
    },
  });
}

// ─── ROLES & PERMISSIONS HOOKS ──────────────────────────────────────────────
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles'),
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => api.get('/roles/permissions'),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleData: any) => api.post('/roles', roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Custom role created!');
    },
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) =>
      api.put(`/roles/${id}/permissions`, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role permissions updated.');
    },
  });
}

// ─── AUDIT LOGS HOOK ────────────────────────────────────────────────────────
export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.get('/audit'),
  });
}

// ─── REPORTS HOOK ───────────────────────────────────────────────────────────
export function useReports(filters?: any) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: () => api.get('/reports', { params: filters }),
  });
}

// ─── NOTIFICATIONS HOOKS ────────────────────────────────────────────────────
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications'),
    refetchInterval: 10000, // Poll notifications every 10s
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read.');
    },
  });
}

// ─── DOCUMENT & POD HOOKS ───────────────────────────────────────────────────
export function useUploadPOD() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ loadId, file }: { loadId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/pod/upload/${loadId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['load-detail'] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      toast.success('POD uploaded successfully!');
    },
  });
}

export function useApproveRC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rcId: string) => api.put(`/rate-confirmations/${rcId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load-detail'] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      toast.success('Rate confirmation approved!');
    },
  });
}

export function useCreateRC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rcData: any) => api.post('/rate-confirmations', rcData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load-detail'] });
      toast.success('Rate confirmation version created!');
    },
  });
}

// ─── SEARCH HOOK ────────────────────────────────────────────────────────────
export function useGlobalSearch(q: string) {
  return useQuery({
    queryKey: ['global-search', q],
    queryFn: () => api.get('/search', { params: { q } }),
    enabled: q.length >= 2,
  });
}

export function useCreateCarrier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (carrierData: any) => api.post('/carriers', carrierData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast.success('Carrier onboarded successfully!');
    },
  });
}

export function useUpdateCarrier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/carriers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast.success('Carrier updated successfully!');
    },
  });
}

export function useDeleteCarrier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/carriers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
      toast.success('Carrier suspended successfully!');
    },
  });
}

export function useUpdateShipper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/shippers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shippers'] });
      toast.success('Shipper updated successfully!');
    },
  });
}

export function useDeleteShipper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/shippers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shippers'] });
      toast.success('Shipper deleted successfully!');
    },
  });
}

export function useUpdateRC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/rate-confirmations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load-detail'] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      toast.success('Rate confirmation updated!');
    },
  });
}

export function useDeleteRC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/rate-confirmations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load-detail'] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
      toast.success('Rate confirmation version deleted!');
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully!');
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member deleted successfully!');
    },
  });
}
