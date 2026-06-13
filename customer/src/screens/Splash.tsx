import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { useAuth } from '../state/AuthContext'

export default function Splash() {
  const navigate = useNavigate()
  const { ready, isLoggedIn } = useAuth()

  useEffect(() => {
    if (!ready) return
    const hasLang = Boolean(localStorage.getItem('htc_lang'))
    const timer = setTimeout(() => {
      if (!hasLang) navigate('/language', { replace: true })
      else if (!isLoggedIn) navigate('/login', { replace: true })
      else navigate('/book', { replace: true })
    }, 900)
    return () => clearTimeout(timer)
  }, [ready, isLoggedIn, navigate])

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-night-900 text-white">
      <div className="flex h-20 w-20 animate-scale-in items-center justify-center rounded-3xl bg-accent shadow-accent">
        <Truck className="h-11 w-11" strokeWidth={2.2} />
      </div>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight">HindTrucks</h1>
      <p className="mt-1 text-sm text-white/60">Book a truck in minutes</p>
    </div>
  )
}
