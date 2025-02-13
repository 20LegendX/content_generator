import { supabase } from '../lib/supabase';

export async function upsertUser(userData) {
  try {
    const { id: user_id, email, provider, provider_id } = userData;

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user_id,
        email: email,
        auth_provider: provider,
        provider_id: provider_id,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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

export async function saveArticle(articleData) {
  try {
    const { data, error } = await supabase
      .from('articles')
      .upsert({
        id: articleData.id,
        user_id: articleData.user_id,
        title: articleData.title || 'Untitled',
        content: articleData.raw_content,
        template_name: articleData.template_name,
        preview_html: articleData.preview_html
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving article:', error);
    throw error;
  }
}

export async function getUserArticles() {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
}

export async function deleteArticle(articleId) {
  try {
    console.log('Attempting to delete article:', articleId);
    
    const { data, error } = await supabase
      .from('articles')
      .delete()
      .eq('id', articleId)
      .select();

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
    
    console.log('Delete response:', data);
    return data;
  } catch (error) {
    console.error('Error deleting article:', error);
    throw error;
  }
}