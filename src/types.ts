/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Participant {
  name: string;
  email: string;
  phone?: string;
  registeredAt: string; // ISO String
}

export interface Prediction {
  matchId: number;
  homeScore: number | "";
  awayScore: number | "";
}

export interface QuinielaSubmission {
  id?: string; // Firebase Document ID
  participant: Participant;
  predictions: { [matchId: number]: { homeScore: number; awayScore: number } };
  submittedAt: string;
  totalMatchesPredicted: number;
}
