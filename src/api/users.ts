
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Profile } from '@/types/user';

// We use a postgres function to securely fetch all user details.
// This function can only be called by an 'Administrator'.
export async function fetchUsers() {
  const { data, error } = await supabase.rpc('get_all_user_details');
  
  if (error) {
    // Provide a more user-friendly error message for permission issues
    if (error.message.includes('U heeft geen rechten om gebruikersgegevens op te halen.')) {
        toast({ title: 'Geen Toegang', description: 'U heeft niet de benodigde rechten om gebruikers te zien.', variant: 'destructive' });
    }
    throw new Error(error.message);
  }

  // The RPC function returns all necessary fields, including email.
  return data as (Profile & { email: string })[];
}

export async function updateUser(profile: Partial<Profile> & { id: string }) {
  const { id, ...updateData } = profile;
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
