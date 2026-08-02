type StepState = "complete" | "current" | "upcoming";

function confirmationStates(status: string, hasOrder: boolean): StepState[] {
  if (status === "accepted") return ["complete", "complete", hasOrder ? "complete" : "current"];
  if (status === "sent" || status === "revision_requested") return ["complete", "current", "upcoming"];
  if (status === "draft") return ["current", "upcoming", "upcoming"];
  return ["complete", "upcoming", "upcoming"];
}

export default function QuoteConfirmationProgress({ status, hasOrder }: { status: string; hasOrder: boolean }) {
  const states = confirmationStates(status, hasOrder);
  const steps = [
    ["店家建立訂單", "建立專屬內容與價格"],
    ["客戶確認訂單", "確認或提出修改需求"],
    ["訂單建立完成", "確認後進入製作流程"],
  ];

  return <ol className="custom-order-overview quote-confirmation-progress" aria-label="客製訂單確認流程">
    {steps.map(([title, description], index) => <li className={states[index]} key={title} aria-current={states[index] === "current" ? "step" : undefined}>
      <span>{states[index] === "complete" ? "✓" : index + 1}</span><div><b>{title}</b><small>{description}</small></div>
    </li>)}
  </ol>;
}
