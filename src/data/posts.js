import { supabase } from '../lib/supabase.js'

export const POST_CATEGORIES = ['Portfolio', '새롬 이야기', '후기', '공지']
export const ADMIN_ONLY_CATEGORIES = ['Portfolio', '공지']
export const POST_IMAGE_BUCKET = 'community-post-images'

const mapPost = (post) => {
  const imagePaths = post.image_paths?.length
    ? post.image_paths
    : post.image_path ? [post.image_path] : []
  const images = imagePaths.map((path) =>
    supabase.storage.from(POST_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl,
  )

  return {
    id: post.id,
    title: post.title,
    description: post.description,
    category: post.category,
    authorId: post.author_id,
    authorRole: post.author_role,
    imagePaths,
    images,
    imagePath: imagePaths[0] ?? null,
    image: images[0] ?? '',
    createdAt: post.created_at,
  }
}

export const fetchPosts = async ({ category, authorId, categories, featuredOnly = false } = {}) => {
  if (!supabase) throw new Error('Supabase is not configured.')

  let query = supabase.from('community_posts').select('*').order('created_at', { ascending: false })
  if (category) query = query.eq('category', category)
  if (authorId) query = query.eq('author_id', authorId)
  if (categories) query = query.in('category', categories)
  if (featuredOnly) query = query.eq('author_role', 'admin').not('image_path', 'is', null)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapPost)
}

export const fetchPost = async (id) => {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? mapPost(data) : null
}

export const uploadPostImage = async (file, userId) => {
  if (!supabase) throw new Error('Supabase is not configured.')
  const extension = file.name.split('.').pop()?.toLowerCase() || 'image'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from(POST_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  return path
}

export const deletePostImage = async (path) => {
  if (!path) return
  return deletePostImages([path])
}

export const deletePostImages = async (paths) => {
  if (!supabase || !paths?.length) return
  const { error } = await supabase.storage.from(POST_IMAGE_BUCKET).remove(paths)
  if (error) throw error
}

export const createPost = async (post) => {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase
    .from('community_posts')
    .insert(post)
    .select('*')
    .single()
  if (error) throw error
  return mapPost(data)
}

export const updatePost = async (id, post) => {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase
    .from('community_posts')
    .update(post)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapPost(data)
}

export const removePost = async (id) => {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.from('community_posts').delete().eq('id', id)
  if (error) throw error
}
