import { inr, inrShort } from './format'

describe('inr', () => {
    it('formats integer amounts', () => {
        expect(inr(18500)).toBe('₹18,500')
    })

    it('formats zero', () => {
        expect(inr(0)).toBe('₹0')
    })

    it('formats large numbers', () => {
        expect(inr(100000)).toBe('₹1,00,000')
    })

    it('formats decimals', () => {
        expect(inr(1234.56)).toBe('₹1,234.56')
    })

    it('formats negative amounts', () => {
        expect(inr(-500)).toBe('₹-500')
    })
})

describe('inrShort', () => {
    it('delegates to inr', () => {
        expect(inrShort(41250)).toBe('₹41,250')
    })
})