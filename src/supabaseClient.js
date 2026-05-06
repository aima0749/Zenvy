import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iscbvbqbwympuiqdnbca.supabase.co'
const supabaseKey = 'sb_publishable_8NBFhpTEf9Jz9Cd2xhgaxw_6UXme63u'

export const supabase = createClient(supabaseUrl, supabaseKey)
