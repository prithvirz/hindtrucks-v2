import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDownToLine, Wallet, CheckCircle2, Clock, X, Loader2, ArrowRight } from 'lucide-react'
import TopBar from '../components/TopBar'
import Button from '../components/Button'
import { WEEK_EARNINGS } from '../data/mockLoads'
import { inr } from '../lib/format'
import { useEarnings } from '../state/EarningsContext'

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function Confetti() {
  const colors = ['bg-accent', 'bg-success', 'bg-info', 'bg-yellow-400', 'bg-purple-500']
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50 rounded-t-3xl">
      {Array.from({ length: 30 }).map((_, i) => {
        const color = colors[i % colors.length]
        const left = Math.random() * 100 // %
        const delay = Math.random() * 1.5 // seconds
        const duration = 2.5 + Math.random() * 1.5 // seconds
        const size = 6 + Math.random() * 8 // px
        return (
          <div
            key={i}
            className={`absolute rounded-xs ${color} animate-confetti`}
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              top: `-20px`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              opacity: 0.8,
            }}
          />
        )
      })}
    </div>
  )
}

export default function Earnings() {
  const { t } = useTranslation()
  const { walletBalance, payouts, withdrawWallet } = useEarnings()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState(String(walletBalance))
  const [upiId, setUpiId] = useState('rajbir.singh@okaxis')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const max = Math.max(...WEEK_EARNINGS, 1)
  const weekTotal = WEEK_EARNINGS.reduce((a, b) => a + b, 0)

  const amountVal = Number(withdrawAmount)
  const isAmountValid = amountVal > 0 && amountVal <= walletBalance
  const isUpiValid = upiId.includes('@') && upiId.length > 3
  const isFormValid = isAmountValid && isUpiValid

  function handleWithdrawClick() {
    setWithdrawAmount(String(walletBalance))
    setSuccess(false)
    setSheetOpen(true)
  }

  function handleRequestWithdrawal() {
    if (!isFormValid) return
    setLoading(true)
    setTimeout(() => {
      withdrawWallet(amountVal, upiId)
      setLoading(false)
      setSuccess(true)
    }, 1800)
  }

  return (
    <div className="h-full flex flex-col relative">
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(480px) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti-fall linear infinite;
        }
        @keyframes pulse-success {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
          70% { transform: scale(1); box-shadow: 0 0 0 14px rgba(22, 163, 74, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }
        .animate-pulse-success {
          animation: pulse-success 2s infinite;
        }
      `}</style>

      <TopBar title={t('earnings.title')} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-32 space-y-5">
        {/* Wallet */}
        <div className="rounded-3xl bg-gradient-to-br from-[#8F43FF] to-[#3E7BFF] text-white p-5 shadow-pop relative overflow-hidden">
          <div className="pointer-events-none absolute -top-10 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Wallet size={16} /> {t('earnings.balance')}
            </div>
            <p className="text-4xl font-extrabold mt-1 nums tracking-tight">{inr(walletBalance)}</p>
            {walletBalance === 1500 && payouts.some(p => p.load === 'BONUS') && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg text-[11px] font-extrabold text-yellow-300 border border-white/10">
                <span>🎁 ₹1,500 Signup Bonus Active</span>
              </div>
            )}
            <Button
              className="mt-4"
              variant="white"
              size="md"
              disabled={walletBalance <= 0}
              onClick={handleWithdrawClick}
              leftIcon={<ArrowDownToLine size={18} />}
            >
              {t('earnings.withdraw')}
            </Button>
          </div>
        </div>

        {/* Weekly chart */}
        <div className="rounded-2xl bg-surface shadow-card border border-hairline p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-ink">{t('earnings.thisWeek')}</p>
            <p className="font-extrabold text-ink nums">{inr(weekTotal)}</p>
          </div>
          <div className="flex items-stretch justify-between gap-2 h-32">
            {WEEK_EARNINGS.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                <div className="w-full flex-1 flex items-end min-h-0">
                  <div
                    className={`w-full rounded-lg transition-all ${v === max ? 'bg-accent' : 'bg-accent/15'
                      }`}
                    style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
                  />
                </div>
                <span className="text-[11px] text-ink-faint font-medium">{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        <div>
          <p className="font-bold text-ink mb-3">{t('earnings.history')}</p>
          <div className="flex flex-col gap-2.5">
            {payouts.map((p) => {
              const credited = p.status === 'credited'
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl bg-surface shadow-card border border-hairline/60 p-3.5"
                >
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${credited ? 'bg-success/10 text-success' : 'bg-accent-soft text-accent'
                      }`}
                  >
                    {credited ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink text-sm truncate">{p.route}</p>
                    <p className="text-xs text-ink-faint">{p.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ink nums">{inr(p.amount)}</p>
                    <p
                      className={`text-[11px] font-semibold ${credited ? 'text-success' : 'text-accent'
                        }`}
                    >
                      {credited ? t('earnings.credited') : t('earnings.pending')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Interactive Withdrawal Bottom Sheet Drawer */}
      {sheetOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          {/* Backdrop with a very subtle blur to feel high-end */}
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-[1px]" onClick={() => !loading && setSheetOpen(false)} />

          <div className="relative bg-surface border-t border-hairline rounded-t-3xl shadow-pop flex flex-col max-h-[90%] max-w-app w-full mx-auto animate-slide-up safe-bottom overflow-hidden">
            {success && <Confetti />}

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-hairline shrink-0">
              <h3 className="text-lg font-black text-ink">
                {success ? 'Withdrawal Completed' : t('earnings.withdraw')}
              </h3>
              {!loading && (
                <button
                  onClick={() => setSheetOpen(false)}
                  className="h-9 w-9 flex items-center justify-center bg-surface-grey border border-hairline rounded-xl hover:bg-surface-sunken transition-all"
                >
                  <X size={18} className="text-ink-muted" strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {success ? (
                /* Success View */
                <div className="flex flex-col items-center text-center py-6 space-y-4 animate-scale-in">
                  <div className="h-16 w-16 bg-success rounded-full flex items-center justify-center text-white animate-pulse-success">
                    <CheckCircle2 size={36} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-ink">₹{withdrawAmount}</p>
                    <p className="text-sm font-bold text-success mt-1">Transferred Successfully!</p>
                    <p className="text-xs font-semibold text-ink-muted mt-2 max-w-[280px] leading-relaxed">
                      Instant withdrawal of <span className="text-ink font-bold">{inr(amountVal)}</span> has been credited to your UPI ID <span className="text-ink font-bold">{upiId}</span>.
                    </p>
                  </div>
                  <div className="w-full pt-4">
                    <Button full variant="dark" onClick={() => setSheetOpen(false)}>
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                /* Input Form View */
                <div className="space-y-4">
                  {/* Amount Field */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-ink-muted tracking-wider">
                      Withdrawal Amount (₹)
                    </label>
                    <div className="mt-1.5 flex items-center gap-2 h-14 rounded-xl bg-surface-grey ring-1 ring-hairline px-4 focus-within:bg-surface-sunken focus-within:ring-2 focus-within:ring-accent/40 focus-within:shadow-glow transition-all">
                      <span className="text-ink font-bold text-lg">₹</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="0.00"
                        value={withdrawAmount}
                        disabled={loading}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-ink text-lg font-black tracking-wide placeholder:text-ink-faint"
                      />
                      <button
                        onClick={() => setWithdrawAmount(String(walletBalance))}
                        disabled={loading}
                        className="text-xs font-black text-accent bg-accent-soft px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                      >
                        ALL
                      </button>
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] font-bold">
                      <span className="text-ink-faint">Available: {inr(walletBalance)}</span>
                      {amountVal > walletBalance && (
                        <span className="text-red-500">Insufficient balance</span>
                      )}
                    </div>
                  </div>

                  {/* UPI ID Field */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-ink-muted tracking-wider">
                      UPI ID (Instant Transfer)
                    </label>
                    <div className="mt-1.5 flex items-center gap-2 h-14 rounded-xl bg-surface-grey ring-1 ring-hairline px-4 focus-within:bg-surface-sunken focus-within:ring-2 focus-within:ring-accent/40 focus-within:shadow-glow transition-all">
                      <input
                        type="text"
                        placeholder="example@upi"
                        value={upiId}
                        disabled={loading}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-ink font-bold placeholder:text-ink-faint"
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-ink-faint font-semibold">
                      Your bank account must be linked to this UPI address.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-hairline">
                    <Button
                      full
                      disabled={!isFormValid || loading}
                      onClick={handleRequestWithdrawal}
                      leftIcon={loading ? <Loader2 className="animate-spin" size={18} /> : undefined}
                      rightIcon={!loading ? <ArrowRight size={18} /> : undefined}
                    >
                      {loading ? 'Processing Instant Transfer…' : 'Request Instant Payout'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

