import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oucuwunhxglxliznidwc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91Y3V3dW5oeGdseGxpem5pZHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NDM3NjIsImV4cCI6MjA1MzAxOTc2Mn0.yR9hej96afALOEC-hrHfxhQDB1LaaV69X3jJ8gu-_Z8' // Get this from Supabase dashboard: Project Settings > API

export const supabase = createClient(supabaseUrl, supabaseAnonKey)