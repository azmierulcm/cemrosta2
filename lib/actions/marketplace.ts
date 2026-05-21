'use server'

// Marketplace actions — rebuilt in the marketplace phase

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function reportListing(_data: {
  listingId: string
  reporterId: string
  reason: string
  details?: string
}) {
  return { success: true }
}
