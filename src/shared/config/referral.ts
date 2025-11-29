/**
 * Referral configuration for STON.fi swap fees
 *
 * How it works:
 * - 1 bps = 0.01%
 * - With 30 bps (0.3%), on a $50 swap you earn $0.15
 * - DEX v1: max 10 bps (0.1%) - paid automatically
 * - DEX v2/DeDust/Tonco: max 100 bps (1%) - must withdraw from vault
 */

export const REFERRAL_CONFIG = {
  /**
   * Your TON wallet address to receive referral fees
   * IMPORTANT: Replace with your actual wallet address!
   */
  referrerAddress: 'UQCwy3KPorSYTJ_gD2gttqVjVf1ICUU_OEnssb1CxxVK8Ecu',

  /**
   * Referral fee in basis points (bps)
   * 1 bps = 0.01%
   *
   * Recommended: 30 bps (0.3%)
   * - Earnings on $50 swap: $0.15
   * - Earnings on $1000 swap: $3.00
   *
   * Range: 1-100 bps (0.01% - 1%)
   */
  referrerFeeBps: '100',

  /**
   * Allow protocol to reduce fee for better rates
   * When true: fee can be lowered (e.g., 30 bps → 10 bps for DEX v1)
   * to give user better swap rate while you still earn maximum possible
   *
   * Recommended: true
   */
  flexibleReferrerFee: true,
} as const;

/**
 * Calculate expected referral earnings
 */
export const calculateReferralEarnings = (
  swapAmountUsd: number,
  feeBps: number = REFERRAL_CONFIG.referrerFeeBps
): number => {
  return swapAmountUsd * (feeBps / 10000);
};

/**
 * Format referral fee for display
 */
export const formatReferralFee = (feeBps: number): string => {
  return `${(feeBps / 100).toFixed(2)}%`;
};
