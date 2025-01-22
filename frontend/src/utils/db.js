import { supabase } from '../lib/supabase';

export async function upsertUser(userData) {
  try {
    const { id: user_id, email, provider } = userData;

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user_id,
        email: email,
        auth_provider: provider,
        provider_id: user_id,
        status: 'active',
        updated_at: new Date()
      }, {
        onConflict: 'id',
        returning: true
      });

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Error upserting user:', error);
    throw error;
  }
}