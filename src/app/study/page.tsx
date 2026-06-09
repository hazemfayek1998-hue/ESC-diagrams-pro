import { redirect } from 'next/navigation'

// /study is handled per-diagram via /study/[id]
// Redirect the bare route to the library
export default function StudyRedirect() {
  redirect('/')
}
