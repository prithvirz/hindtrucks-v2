import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useShell } from '../state/ShellContext'
import Button from './Button'

interface TourStep {
  target?: string // CSS selector (e.g. '#online-toggle')
  titleKey: string
  contentKey: string
  placement: 'top' | 'bottom' | 'center'
}

const TOUR_STEPS: TourStep[] = [
  {
    titleKey: 'tour.welcome.title',
    contentKey: 'tour.welcome.content',
    placement: 'center',
  },
  {
    target: '#nav-tab-home',
    titleKey: 'tour.navHome.title',
    contentKey: 'tour.navHome.content',
    placement: 'top',
  },
  {
    target: '#online-toggle',
    titleKey: 'tour.toggle.title',
    contentKey: 'tour.toggle.content',
    placement: 'bottom',
  },
  {
    target: '#nav-tab-loads',
    titleKey: 'tour.navLoads.title',
    contentKey: 'tour.navLoads.content',
    placement: 'top',
  },
  {
    target: '#nav-tab-earnings',
    titleKey: 'tour.navEarnings.title',
    contentKey: 'tour.navEarnings.content',
    placement: 'top',
  },
  {
    target: '#nav-tab-profile',
    titleKey: 'tour.navProfile.title',
    contentKey: 'tour.navProfile.content',
    placement: 'top',
  },
]

export default function OnboardingTour() {
  const { t } = useTranslation()
  const { isTourActive, endTour, tourStep, setTourStep } = useShell()
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number; shellWidth: number } | null>(null)
  const tourRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isTourActive) {
      return
    }

    const step = TOUR_STEPS[tourStep]
    if (!step || !step.target) {
      setCoords(null)
      return
    }

    const targetEl = document.querySelector(step.target!)
    const shellEl = document.getElementById('phone-shell')
    if (targetEl) {
      // Smooth scroll target element into the center of the view
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    const updateCoords = () => {
      const currentTarget = document.querySelector(step.target!)
      const currentShell = document.getElementById('phone-shell')

      if (currentTarget && currentShell) {
        const targetRect = currentTarget.getBoundingClientRect()
        const shellRect = currentShell.getBoundingClientRect()

        setCoords({
          top: targetRect.top - shellRect.top,
          left: targetRect.left - shellRect.left,
          width: targetRect.width,
          height: targetRect.height,
          shellWidth: shellRect.width,
        })
      } else {
        setCoords(null)
      }
    }

    // Delay slightly to allow layout and DOM rendering to stabilize
    updateCoords()
    const timeoutId = setTimeout(updateCoords, 100)

    // Set up ResizeObserver to watch for layout/size shifts on target and shell
    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateCoords()
      })
      if (targetEl) resizeObserver.observe(targetEl)
      if (shellEl) resizeObserver.observe(shellEl)
    }

    window.addEventListener('resize', updateCoords)

    // Listen to scroll events on the nearest scroll container to dynamically track positioning
    const scrollParent = targetEl?.closest('.app-scroll') || document.querySelector('.app-scroll')
    if (scrollParent) {
      scrollParent.addEventListener('scroll', updateCoords, { passive: true })
    }

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateCoords)
      if (scrollParent) {
        scrollParent.removeEventListener('scroll', updateCoords)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [isTourActive, tourStep])

  if (!isTourActive) return null

  const step = TOUR_STEPS[tourStep]
  const isLast = tourStep === TOUR_STEPS.length - 1

  function handleNext() {
    if (isLast) {
      endTour()
    } else {
      setTourStep((s) => s + 1)
    }
  }

  function handleBack() {
    if (tourStep > 0) {
      setTourStep((s) => s - 1)
    }
  }

  const tooltipStyle: React.CSSProperties = {}

  if (coords && step.placement === 'bottom') {
    tooltipStyle.top = coords.top + coords.height + 14
    tooltipStyle.bottom = 'auto'
    tooltipStyle.left = 16
    tooltipStyle.right = 16
    tooltipStyle.transform = 'none'
  } else if (coords && step.placement === 'top') {
    tooltipStyle.top = 'auto'
    tooltipStyle.bottom = `calc(100% - ${coords.top}px + 14px)`
    tooltipStyle.left = 16
    tooltipStyle.right = 16
    tooltipStyle.transform = 'none'
  } else {
    // center placement
    tooltipStyle.top = '50%'
    tooltipStyle.bottom = 'auto'
    tooltipStyle.left = 16
    tooltipStyle.right = 16
    tooltipStyle.transform = 'translateY(-50%)'
  }

  return (
    <div
      ref={tourRef}
      className="absolute inset-0 z-40 bg-transparent overflow-hidden select-none"
    >
      {/* SVG Spotlight mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            {/* White area retains mask */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black area punches hole */}
            {coords && (
              <rect
                x={coords.left - 6}
                y={coords.top - 6}
                width={coords.width + 12}
                height={coords.height + 12}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Backdrop overlay with slight opacity */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(11, 11, 15, 0.78)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Tooltip Card with Glassmorphism */}
      <div
        key={tourStep}
        className="absolute bg-surface backdrop-blur-md boxed-border boxed-shadow p-5 flex flex-col z-50 text-ink animate-scale-in boxed-rounded-lg border border-hairline"
        style={tooltipStyle}
      >
        {/* Speech Bubble Arrow Indicator */}
        {coords && step.placement !== 'center' && (
          <div
            className={`absolute w-3 h-3 bg-surface border-hairline pointer-events-none ${
              step.placement === 'bottom'
                ? 'border-t border-l'
                : 'border-b border-r'
            }`}
            style={{
              left: Math.max(16, Math.min(coords.shellWidth - 48, coords.left + coords.width / 2 - 16)),
              top: step.placement === 'bottom' ? -6 : 'auto',
              bottom: step.placement === 'top' ? -6 : 'auto',
              transform: 'translateX(-50%) rotate(45deg)',
            }}
          />
        )}
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-accent-soft px-2 py-0.5 boxed-rounded boxed-border border-accent">
            Tour {tourStep + 1} / {TOUR_STEPS.length}
          </span>
          <button
            onClick={endTour}
            className="text-xs font-black text-ink-muted hover:text-ink hover:underline transition-colors"
          >
            {t('common.skip')}
          </button>
        </div>
        <h3 className="text-[17px] font-black text-ink mb-1.5 leading-tight">
          {t(step.titleKey)}
        </h3>
        <p className="text-xs font-semibold text-ink-muted leading-relaxed mb-4">
          {t(step.contentKey)}
        </p>
        <div className="flex justify-between items-center gap-3">
          {tourStep > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="px-4 shadow-[2px_2px_0px_0px_#0B0B0F]"
            >
              {t('common.back')}
            </Button>
          ) : (
            <div />
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleNext}
            className="px-6 shadow-[2px_2px_0px_0px_#0B0B0F]"
          >
            {isLast ? t('common.continue') : t('common.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
