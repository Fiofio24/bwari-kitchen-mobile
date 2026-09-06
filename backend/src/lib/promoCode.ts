const TYPE_TAGS: Record<string, string> = {
  percentage: 'PCT',
  fixed: 'FIX',
  free_delivery: 'FREEDEL',
  bogo: 'BOGO',
}

export const generatePromoCode = (type: string): string => {
  const tag = TYPE_TAGS[type] || 'GEN'
  const randomSuffix = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()

  return `BK${tag}${randomSuffix}`
}