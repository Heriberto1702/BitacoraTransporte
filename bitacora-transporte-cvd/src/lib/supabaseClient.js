import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xzgpfkjshgbshegdioyu.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

// Exportar el cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey)