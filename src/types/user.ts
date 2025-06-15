
import { UserRole } from '@/types/permissions';

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  status: 'Actief' | 'Inactief';
  // Note: email is not in the profiles table but we will fetch it separately
  email?: string;
};
