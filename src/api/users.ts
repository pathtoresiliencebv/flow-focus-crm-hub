
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Profile } from '@/types/user';

// We use a postgres function to securely fetch all user details.
// This function can only be called by an 'Administrator'.
export async function fetchUsers() {
  console.log('🔍 fetchUsers: Starting...');
  
  const { data, error } = await supabase.rpc('get_all_user_details');
  
  console.log('📦 fetchUsers: Response -', { data, error });
  
  if (error) {
    console.error('❌ fetchUsers: RPC error:', error);
    
    // Provide a more user-friendly error message for permission issues
    if (error.message.includes('U heeft geen rechten om gebruikersgegevens op te halen.')) {
      toast({ 
        title: 'Geen Toegang', 
        description: 'U heeft niet de benodigde Administrator rechten om gebruikers te beheren.', 
        variant: 'destructive' 
      });
    } else if (error.message.includes('function') && error.message.includes('does not exist')) {
      console.error('❌ Database function get_all_user_details does not exist!');
      toast({ 
        title: 'Database Fout', 
        description: 'De database functie bestaat niet. Neem contact op met de systeembeheerder.', 
        variant: 'destructive' 
      });
    } else {
      toast({ 
        title: 'Fout', 
        description: `Er is een fout opgetreden bij het laden van gebruikers: ${error.message}`, 
        variant: 'destructive' 
      });
    }
    throw new Error(error.message);
  }

  console.log(`✅ fetchUsers: Loaded ${data?.length || 0} users`);
  // The RPC function returns all necessary fields, including email.
  return data as (Profile & { email: string })[];
}

export async function updateUser(profile: Partial<Profile> & { id: string }) {
  const { id, ...updateData } = profile;
  
  // Check if trying to update super admin by getting user details via RPC
  const { data: allUsers } = await supabase.rpc('get_all_user_details');
  const targetUser = allUsers?.find((u: any) => u.id === id);
  if (targetUser?.email === 'joery@smanscrm.nl') {
    throw new Error('Super Administrator kan niet worden bewerkt.');
  }
  
  // remove email if it exists, as it's not in the profiles table
  delete (updateData as any).email; 
  const { data, error } = await supabase.from('profiles').update(updateData).eq('id', id).select().single();
  if (error) throw new Error(error.message);

  // If role is updated to Administrator, demote other admins
  if (updateData.role === 'Administrator') {
    const { error: rpcError } = await supabase.rpc('demote_other_admins', {
      p_user_id_to_keep: id,
    });
    if (rpcError) {
      // Don't throw, just toast a warning that this part failed.
      toast({ title: 'Waarschuwing', description: `Gebruikersrol is bijgewerkt, maar het degraderen van andere beheerders is mislukt: ${rpcError.message}`, variant: 'destructive' });
    }
  }

  return data;
}

export async function deleteUser(userId: string) {
  console.log('deleteUser function called with userId:', userId);
  
  // Extra frontend check for super admin protection by getting user details via RPC
  const { data: allUsers } = await supabase.rpc('get_all_user_details');
  const targetUser = allUsers?.find((u: any) => u.id === userId);
  if (targetUser?.email === 'joery@smanscrm.nl') {
    throw new Error('Super Administrator kan niet worden verwijderd.');
  }
  
  const { error } = await supabase.rpc('delete_user_safely', {
    p_user_id: userId,
  });
  
  if (error) {
    if (error.message.includes('You cannot delete your own account')) {
      toast({ title: 'Fout', description: 'U kunt uw eigen account niet verwijderen.', variant: 'destructive' });
    } else if (error.message.includes('Only Administrators can delete users')) {
      toast({ title: 'Geen Toegang', description: 'Alleen beheerders kunnen gebruikers verwijderen.', variant: 'destructive' });
    } else {
      toast({ title: 'Fout', description: `Het verwijderen van de gebruiker is mislukt: ${error.message}`, variant: 'destructive' });
    }
    throw new Error(error.message);
  }

  toast({ title: 'Gebruiker Verwijderd', description: 'De gebruiker is succesvol verwijderd.', variant: 'default' });
}

export async function resetUserPassword(userId: string, newPassword: string) {
  // Extra frontend check for super admin protection by getting user details via RPC
  const { data: allUsers } = await supabase.rpc('get_all_user_details');
  const targetUser = allUsers?.find((u: any) => u.id === userId);
  if (targetUser?.email === 'joery@smanscrm.nl') {
    throw new Error('Wachtwoord van Super Administrator kan niet worden gereset.');
  }
  
  const { error } = await supabase.rpc('admin_reset_user_password', {
    p_user_id: userId,
    p_new_password: newPassword,
  });
  
  if (error) {
    if (error.message.includes('Use the normal password change process')) {
      toast({ title: 'Fout', description: 'U kunt uw eigen wachtwoord niet via deze methode wijzigen.', variant: 'destructive' });
    } else if (error.message.includes('Only Administrators can reset')) {
      toast({ title: 'Geen Toegang', description: 'Alleen beheerders kunnen wachtwoorden resetten.', variant: 'destructive' });
    } else {
      toast({ title: 'Fout', description: `Het resetten van het wachtwoord is mislukt: ${error.message}`, variant: 'destructive' });
    }
    throw new Error(error.message);
  }

  toast({ title: 'Wachtwoord Gereset', description: 'Het wachtwoord is succesvol gewijzigd.', variant: 'default' });
}
