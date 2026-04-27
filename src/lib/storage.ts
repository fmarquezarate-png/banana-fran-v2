import { supabase } from './supabase'

const BUCKETS = {
  avatars: 'avatars',
  documents: 'documents',
  photos: 'photos',
} as const

// Sube un archivo y devuelve el path en Storage
export async function uploadFile(
  bucket: keyof typeof BUCKETS,
  path: string,
  file: File
): Promise<string> {
  const { error } = await supabase.storage.from(BUCKETS[bucket]).upload(path, file, {
    upsert: true,
  })
  if (error) throw error
  return path
}

// URL pública (solo para bucket avatars que es público)
export function getPublicUrl(bucket: keyof typeof BUCKETS, path: string): string {
  const { data } = supabase.storage.from(BUCKETS[bucket]).getPublicUrl(path)
  return data.publicUrl
}

// Signed URL para buckets privados (documents, photos) — válida 1 hora
export async function getSignedUrl(
  bucket: keyof typeof BUCKETS,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKETS[bucket])
    .createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export async function deleteFile(bucket: keyof typeof BUCKETS, path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKETS[bucket]).remove([path])
  if (error) throw error
}
