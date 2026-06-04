/** Format a number as Indian Rupees, e.g. 18500 -> "₹18,500". */
export function inr(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN')
}

/** Short form for big numbers, e.g. 41250 -> "₹41,250" (kept full for clarity). */
export function inrShort(amount: number): string {
  return inr(amount)
}
