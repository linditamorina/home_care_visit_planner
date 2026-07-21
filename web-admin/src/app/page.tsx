import { redirect } from 'next/navigation'

export default function RootPage() {
  // Për ta dërguar menjëherë te login pa krijuarloop të databazës
  redirect('/login')
}