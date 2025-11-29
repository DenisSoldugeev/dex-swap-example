/**
 * Referral configuration for STON.fi swap fees

 * How it works:
 * - 1 bps = 0.01%
 */
export const REFERRAL_CONFIG = {
  referrerAddress: 'UQCwy3KPorSYTJ_gD2gttqVjVf1ICUU_OEnssb1CxxVK8Ecu',
  referrerFeeBps: '100',
  flexibleReferrerFee: true,
} as const;

/**
 * Calculate expected referral earnings
 */
export const calculateReferralEarnings = (
  swapAmountUsd: number,
  feeBps: string = REFERRAL_CONFIG.referrerFeeBps
): number => {
  return swapAmountUsd * (+feeBps / 10000);
};

/**
 * Format referral fee for display
 */
export const formatReferralFee = (feeBps: number): string => {
  return `${(feeBps / 100).toFixed(2)}%`;
};
