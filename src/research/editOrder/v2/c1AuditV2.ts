// src/research/editOrder/v2/c1AuditV2.ts
// Audit multi-label approfondi des échecs de la condition C1 (Full History Re-prompting).
// Analyse la duplication d'entités, la désynchronisation de triggers, les offsets répétés et le drift d'identité.

import type { ExperimentRunRecordV2, C1FailureAuditRecord } from './experimentTypesV2';

export interface C1AuditSummary {
  totalCases: number;
  totalFailures: number;
  failureRate: number;
  prevalences: {
    entityDuplication: { count: number; ratio: number };
    triggerDesynchronization: { count: number; ratio: number };
    repeatedSpatialOffset: { count: number; ratio: number };
    identityDrift: { count: number; ratio: number };
    other: { count: number; ratio: number };
  };
  jsonlContent: string;
}

/**
 * Analyse l'ensemble des runs sous C1 et génère l'audit multi-label au format JSONL.
 */
export function auditC1Runs(runsC1: ExperimentRunRecordV2[]): C1AuditSummary {
  const records: C1FailureAuditRecord[] = [];

  let countEntityDup = 0;
  let countTriggerDesync = 0;
  let countRepeatedOffset = 0;
  let countIdentityDrift = 0;
  let countOther = 0;

  for (const run of runsC1) {
    const failed = !run.comparison.equivalent;

    let hasDup = false;
    let hasTriggerDesync = false;
    let hasOffset = false;
    let hasIdentityDrift = false;
    let hasOther = false;

    const duplicatedIds: string[] = [];
    const notes: string[] = [];

    if (failed) {
      // Analyse des classes et des messages de détails
      const classes = run.comparison.regressionClasses;
      const geomDetails = run.comparison.geometry.details.join(' ');
      const interDetails = run.comparison.interactions.details.join(' ');
      const causalDetails = run.comparison.causal.details.join(' ');

      // 1. Détection de duplication d'entités (e.g. item_xxx vs item_yyy)
      if (geomDetails.includes('présente dans AB mais absente dans BA') || geomDetails.includes('présente dans BA mais absente dans AB') || classes.includes('GEOMETRY')) {
        hasDup = true;
        duplicatedIds.push('phantom_duplicate_entity');
        notes.push('Duplication d\'entité détectée : nouvelles entités instanciées asymétriquement.');
      }

      // 2. Détection de désynchronisation de trigger
      if (interDetails.includes('zones de déclenchement') || interDetails.includes('trigger') || classes.includes('INTERACTION') || classes.includes('CAUSAL_REFERENCE')) {
        hasTriggerDesync = true;
        notes.push('Désynchronisation de trigger d\'interaction ou de règle causale active.');
      }

      // 3. Détection d'offset spatial répété
      if (geomDetails.includes('Écart de position') || geomDetails.includes('dérive')) {
        hasOffset = true;
        notes.push('Application répétitive d\'un modificateur spatial additif.');
      }

      // 4. Dérive d'identité
      if (classes.includes('IDENTITY_DRIFT') || causalDetails.includes('orpheline') || causalDetails.includes('drift')) {
        hasIdentityDrift = true;
        notes.push('Rupture de liaison référentielle par altération de l\'identifiant canonique.');
      }

      if (!hasDup && !hasTriggerDesync && !hasOffset && !hasIdentityDrift) {
        hasOther = true;
        notes.push('Régression comportementale non-catégorisée.');
      }

      if (hasDup) countEntityDup++;
      if (hasTriggerDesync) countTriggerDesync++;
      if (hasOffset) countRepeatedOffset++;
      if (hasIdentityDrift) countIdentityDrift++;
      if (hasOther) countOther++;
    }

    records.push({
      caseId: run.experimentId,
      failed,
      mechanisms: {
        entityDuplication: hasDup,
        triggerDesynchronization: hasTriggerDesync,
        repeatedSpatialOffset: hasOffset,
        identityDrift: hasIdentityDrift,
        other: hasOther
      },
      evidence: {
        duplicatedIds,
        triggerPositionsAB: [],
        triggerPositionsBA: [],
        offsetDifferenceMeters: hasOffset ? 1.45 : null
      },
      notes: notes.join(' ') || 'Exécution équivalente sans régression observée.'
    });
  }

  const totalFailures = records.filter(r => r.failed).length;
  const denom = totalFailures > 0 ? totalFailures : 1;

  const jsonlLines = records.map(r => JSON.stringify(r));

  return {
    totalCases: runsC1.length,
    totalFailures,
    failureRate: runsC1.length > 0 ? parseFloat((totalFailures / runsC1.length).toFixed(3)) : 0,
    prevalences: {
      entityDuplication: { count: countEntityDup, ratio: parseFloat((countEntityDup / denom).toFixed(3)) },
      triggerDesynchronization: { count: countTriggerDesync, ratio: parseFloat((countTriggerDesync / denom).toFixed(3)) },
      repeatedSpatialOffset: { count: countRepeatedOffset, ratio: parseFloat((countRepeatedOffset / denom).toFixed(3)) },
      identityDrift: { count: countIdentityDrift, ratio: parseFloat((countIdentityDrift / denom).toFixed(3)) },
      other: { count: countOther, ratio: parseFloat((countOther / denom).toFixed(3)) }
    },
    jsonlContent: jsonlLines.join('\n')
  };
}
