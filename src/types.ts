/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PatientData {
  bsa: number; // m²
  weight: number; // kg
  height: number; // cm
  tlc: number; // mL
  frc: number; // mL
  nr: number; // Right lung normal mL
  nl: number; // Left lung normal mL
  nvt: number; // Normal tidal volume mL
}

export interface CalculationResults extends PatientData {
  // Scores
  s_r_score: number;
  s_l_score: number;
  sus_r_score: number;
  sus_l_score: number;
  post_r_score: number;
  post_l_score: number;

  // Standard volumes
  s_r: number;
  s_l: number;
  s_total: number;
  s_pct: number;
  s_vt: number;

  // Suspected volumes
  sus_r: number;
  sus_l: number;
  sus_total: number;
  sus_pct: number;
  sus_vt: number;

  // Post-Plication volumes
  post_r: number;
  post_l: number;
  post_total: number;
  post_pct: number;
  post_vt: number;

  // Differences & Percentages: Suspected vs Standard
  v_r_sus: number;
  v_r_sus_p: number;
  v_l_sus: number;
  v_l_sus_p: number;
  v_sus: number;
  v_sus_p: number;
  v_vt_sus: number;
  v_vt_sus_p: number;
  pp_sus: number; // percentage points difference

  // Differences & Percentages: Post-Plication vs Suspected
  v_r_post: number;
  v_r_post_p: number;
  v_l_post: number;
  v_l_post_p: number;
  v_post: number;
  v_post_p: number;
  v_vt_post: number;
  v_vt_post_p: number;
  pp_post: number;

  // Differences & Percentages: Post-Plication vs Standard (Net change)
  v_post_std: number;
  v_post_std_p: number;
  pp_post_std: number;
}
