"use client";

import { proposalStatusLabels, studyLevelLabels } from "@/types/labels";
import type { HelpProposal, ProposalDecision } from "@/types/proposal";
import { useAppLanguage } from "@/components/layout/AppShell";

interface ProposalCardProps {
  proposal: HelpProposal;
  canDecide: boolean;
  busy: boolean;
  onDecision: (decision: ProposalDecision) => void;
}

export default function ProposalCard({
  proposal,
  canDecide,
  busy,
  onDecision,
}: ProposalCardProps) {
  const { translate } = useAppLanguage();

  return (
    <article className="proposal">
      <div className="proposal-head">
        <div>
          <b>{proposal.proposedBy.username}</b>
          <div className="help-text">
            {proposal.proposedBy.specialty} ·{" "}
            {translate(
              studyLevelLabels[proposal.proposedBy.studyLevel || ""] ||
                proposal.proposedBy.studyLevel ||
                "",
            )}
          </div>
        </div>
        <span className="pill">
          {translate(proposalStatusLabels[proposal.status])}
        </span>
      </div>
      <p className="proposal-message">{proposal.message}</p>
      {proposal.proposedBy.skills?.length ? (
        <div className="request-meta">
          {proposal.proposedBy.skills.map((skill) => (
            <span className="pill" key={skill}>
              {skill}
            </span>
          ))}
        </div>
      ) : null}
      {canDecide && proposal.status === "pending" && (
        <div className="inline-actions proposal-actions">
          <button
            className="btn btn-primary"
            type="button"
            disabled={busy}
            onClick={() => onDecision("accepted")}
          >
            {translate("Accepter l’aide")}
          </button>
          <button
            className="btn btn-outline"
            type="button"
            disabled={busy}
            onClick={() => onDecision("rejected")}
          >
            {translate("Refuser")}
          </button>
        </div>
      )}
    </article>
  );
}
