import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { createClient } from '@supabase/supabase-js'

async function getNotes() {
  'use cache'
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
  const { data: notes } = await supabase.from('notes').select()
  return notes
}

export default async function Page() {
  const notes = await getNotes()

  return (
    <>
      <Header />
      <pre>{JSON.stringify(notes, null, 2)}</pre>
      <Footer />
    </>
  )
}
