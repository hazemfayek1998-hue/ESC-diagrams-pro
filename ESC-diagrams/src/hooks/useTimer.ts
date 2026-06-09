import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseTimerReturn {
  secondsLeft: number
  isRunning: boolean
  isExpired: boolean
  start: () => void
  pause: () => void
  reset: (newSeconds?: number) => void
  formatted: string
  percentLeft: number
}

export function useTimer(initialSeconds: number | null): UseTimerReturn {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds ?? 0)
  const [isRunning, setIsRunning] = useState(false)
  const totalRef = useRef(initialSeconds ?? 0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  const start = useCallback(() => { if (initialSeconds !== null) setIsRunning(true) }, [initialSeconds])
  const pause = useCallback(() => setIsRunning(false), [])
  const reset = useCallback((newSeconds?: number) => {
    clear()
    const s = newSeconds ?? totalRef.current
    totalRef.current = s
    setSecondsLeft(s)
    setIsRunning(false)
  }, [])

  useEffect(() => {
    if (!isRunning || initialSeconds === null) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clear(); setIsRunning(false); return 0 }
        return prev - 1
      })
    }, 1000)
    return clear
  }, [isRunning, initialSeconds])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const percentLeft = totalRef.current > 0 ? (secondsLeft / totalRef.current) * 100 : 100

  return { secondsLeft, isRunning, isExpired: initialSeconds !== null && secondsLeft === 0, start, pause, reset, formatted, percentLeft }
}
