/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalculationResults, PatientData } from "./types";

export function getPatientData(bsa: number): PatientData {
  const weight = 14.5 * Math.pow(bsa, 1.5);
  const height = 97.3 * Math.pow(bsa, 0.5);
  const tlc = weight * 63;
  const frc = weight * 28;
  const nr = tlc * 0.53;
  const nl = tlc * 0.47;
  const nvt = weight * 6;

  return { bsa, weight, height, tlc, frc, nr, nl, nvt };
}

export function calc(
  bsa: number,
  s_r: number,
  s_l: number,
  sus_r: number,
  sus_l: number,
  post_r: number,
  post_l: number,
  projectionMode: "PA" | "AP" = "PA",
  inspiratoryEffort: "normal" | "shallow" | "deep" = "normal",
  magnificationFactor: number = 1.0
): CalculationResults {
  const patient = getPatientData(bsa);
  let { nr, nl, tlc, weight, nvt } = patient;

  // Precision Calibration Normalizers for Projection and Effort differences
  // In AP view or shallow inspiration (common in ICU/bedside), apparent volume is artificially compressed.
  // We apply scientific normalization factors of diaphragmatic excursion to calculate standard TLC/FRC equivalence.
  let normalizationFactor = 1.0;
  if (projectionMode === "AP") {
    normalizationFactor *= 1.14; // Magnification and dome altitude correction
  }
  if (inspiratoryEffort === "shallow") {
    normalizationFactor *= 1.20; // Corrects for restriction of shallow inhalation hold
  } else if (inspiratoryEffort === "deep") {
    normalizationFactor *= 0.95; // Adjusts hyper-inflation peak
  }
  
  // Custom manual tuning adjustment (default 1.0)
  normalizationFactor *= magnificationFactor;

  // Apply calibration factor to patient base lung reference volumes
  nr = nr * normalizationFactor;
  nl = nl * normalizationFactor;
  tlc = tlc * normalizationFactor;

  const s_r_loss = Math.min(s_r * 0.05, 0.50);
  const s_l_loss = Math.min(s_l * 0.05, 0.50);
  const sus_r_loss = Math.min(sus_r * 0.05, 0.50);
  const sus_l_loss = Math.min(sus_l * 0.05, 0.50);
  const post_r_loss = Math.min(post_r * 0.05, 0.50);
  const post_l_loss = Math.min(post_l * 0.05, 0.50);

  const s_r_vol = nr * (1 - s_r_loss);
  const s_l_vol = nl * (1 - s_l_loss);
  const s_total = s_r_vol + s_l_vol;
  const s_pct = (s_total / tlc) * 100;
  const s_vt = weight * 6 * (s_total / tlc);

  const sus_r_vol = nr * (1 - sus_r_loss);
  const sus_l_vol = nl * (1 - sus_l_loss);
  const sus_total = sus_r_vol + sus_l_vol;
  const sus_pct = (sus_total / tlc) * 100;
  const sus_vt = weight * 6 * (sus_total / tlc);

  const post_r_vol = nr * (1 - post_r_loss);
  const post_l_vol = nl * (1 - post_l_loss);
  const post_total = post_r_vol + post_l_vol;
  const post_pct = (post_total / tlc) * 100;
  const post_vt = weight * 6 * (post_total / tlc);

  const v = (a: number, b: number): [number, number] => {
    const d = b - a;
    return [d, a ? (d / a) * 100 : 0];
  };

  const [v_sus, v_sus_p] = v(s_total, sus_total);
  const [v_post, v_post_p] = v(sus_total, post_total);
  const [v_post_std, v_post_std_p] = v(s_total, post_total);

  const [v_r_sus, v_r_sus_p] = v(s_r_vol, sus_r_vol);
  const [v_l_sus, v_l_sus_p] = v(s_l_vol, sus_l_vol);

  const [v_r_post, v_r_post_p] = v(sus_r_vol, post_r_vol);
  const [v_l_post, v_l_post_p] = v(sus_l_vol, post_l_vol);

  const [v_vt_sus, v_vt_sus_p] = v(s_vt, sus_vt);
  const [v_vt_post, v_vt_post_p] = v(sus_vt, post_vt);

  return {
    ...patient,
    s_r_score: s_r,
    s_l_score: s_l,
    sus_r_score: sus_r,
    sus_l_score: sus_l,
    post_r_score: post_r,
    post_l_score: post_l,

    s_r: s_r_vol,
    s_l: s_l_vol,
    s_total,
    s_pct,
    s_vt,

    sus_r: sus_r_vol,
    sus_l: sus_l_vol,
    sus_total,
    sus_pct,
    sus_vt,

    post_r: post_r_vol,
    post_l: post_l_vol,
    post_total,
    post_pct,
    post_vt,

    v_r_sus,
    v_r_sus_p,
    v_l_sus,
    v_l_sus_p,
    v_sus,
    v_sus_p,
    v_vt_sus,
    v_vt_sus_p,
    pp_sus: sus_pct - s_pct,

    v_r_post,
    v_r_post_p,
    v_l_post,
    v_l_post_p,
    v_post,
    v_post_p,
    v_vt_post,
    v_vt_post_p,
    pp_post: post_pct - sus_pct,

    v_post_std,
    v_post_std_p,
    pp_post_std: post_pct - s_pct,
  };
}

export function assess(v: number): { label: "Improved" | "Reduced" | "Stable"; classColor: string } {
  if (v > 3) {
    return { label: "Improved", classColor: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  } else if (v < -3) {
    return { label: "Reduced", classColor: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  return { label: "Stable", classColor: "bg-blue-50 text-blue-700 border-blue-200" };
}

export function sev(s: number): { label: string; color: string; bg: string } {
  if (s === 0) {
    return { label: "Normal", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
  } else if (s <= 2) {
    return { label: "Mild", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
  } else if (s <= 4) {
    return { label: "Moderate", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" };
  } else {
    return { label: "Severe", color: "text-rose-700", bg: "bg-rose-50 border-rose-200" };
  }
}
