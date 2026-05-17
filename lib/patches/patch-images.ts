/**
 * Maps IATA airport codes to their corresponding city patch PNG filename.
 * Images live at: public/images/city_patches/{filename}
 *
 * Codes not listed here fall back to the inline SVG illustration.
 * Add entries as new artwork is created.
 */
export const PATCH_IMAGE_MAP: Record<string, string> = {
  // Malaysia
  KUL: 'kuala_lumpur_patch.png',
  JHB: 'johor_bahru_patch.png',
  KBR: 'kota_bharu_patch.png',
  BKI: 'kota_kinabalu_patch.png',
  TGG: 'kuala_terengganu_patch.png',
  KCH: 'kuching_patch.png',
  LBU: 'labuan_patch.png',
  LGK: 'langkawi_patch.png',
  MYY: 'miri_patch.png',
  PEN: 'penang_patch.png',
  SDK: 'sandakan_patch.png',
  SBW: 'sibu_patch.png',
  TWU: 'tawau_patch.png',
  BTU: 'bintulu_patch.png',
  // Southeast Asia
  SIN: 'singapore_patch.png',
  BKK: 'bangkok_patch.png',
  HKT: 'phuket_patch.png',
  DMK: 'don_mueang_patch.png',
  CGK: 'jakarta_patch.png',
  DPS: 'bali_patch.png',
  SUB: 'surabaya_patch.png',
  KNO: 'medan_patch.png',
  MNL: 'manila_patch.png',
  RGN: 'yangon_patch.png',
  HAN: 'hanoi_patch.png',
  SGN: 'ho_chi_minh_city_patch.png',
  DAD: 'da_nang_patch.png',
  PQC: 'phu_quoc_patch.png',
  KTI: 'kertajati_patch.png',
  // East Asia
  HKG: 'hong_kong_patch.png',
  CAN: 'guangzhou_patch.png',
  PVG: 'shanghai_patch.png',
  PEK: 'beijing_capital_patch.png',
  PKX: 'beijing_daxing_patch.png',
  SZX: 'shenzhen_patch.png',
  XMN: 'xiamen_patch.png',
  TFU: 'chengdu_tianfu_patch.png',
  CKG: 'chongqing_patch.png',
  HGH: 'hangzhou_patch.png',
  NRT: 'japan_patch.png',
  KIX: 'osaka_patch.png',
  ICN: 'seoul_patch.png',
  TPE: 'taipei_patch.png',
  MFM: 'macau_patch.png',
  // Oceania
  SYD: 'sydney_patch.png',
  MEL: 'melbourne_patch.png',
  PER: 'perth_patch.png',
  BNE: 'brisbane_patch.png',
  AKL: 'auckland_patch.png',
  // Middle East
  DOH: 'doha_patch.png',
  DXB: 'dubai_patch.png',
  JED: 'jeddah_patch.png',
  MED: 'medina_patch.png',
  // Europe
  LHR: 'london_patch.png',
  // South Asia
  DEL: 'delhi_patch.png',
  BOM: 'mumbai_patch.png',
  MAA: 'chennai_patch.png',
  BLR: 'bengaluru_patch.png',
  HYD: 'hyderabad_patch.png',
  COK: 'kochi_patch.png',
  TRV: 'thiruvananthapuram_patch.png',
  ATQ: 'amritsar_patch.png',
  DAC: 'dhaka_patch.png',
  KTM: 'kathmandu_patch.png',
  CMB: 'colombo_patch.png',
  MLE: 'male_patch.png',
};

/** Returns the URL path for a city patch PNG, or null if no artwork exists yet. */
export function getPatchImageUrl(iata: string): string | null {
  const filename = PATCH_IMAGE_MAP[iata];
  if (!filename) return null;
  return `/images/city_patches/${filename}`;
}
