import { type OrderStatus } from "@/lib/order-workflow";

type StepState = "complete" | "current" | "upcoming";

const steps = [
  ["店家建立訂單", "建立客製內容與價格"],
  ["客戶確認訂單", "確認內容或提出修改"],
  ["訂單建立完成", "內容鎖定並準備製作"],
  ["製作中", "工作室開始製作"],
  ["運送中", "商品已交付物流"],
  ["已抵達", "商品已送達"],
  ["訂單完成", "整筆訂單完成"],
] as const;

const productionStep: Partial<Record<OrderStatus, number>> = {
  pending: 2,
  making: 3,
  shipped: 4,
  delivered: 5,
  completed: 6,
};

function currentStep(quoteStatus: string, orderStatus?: OrderStatus) {
  if (quoteStatus === "draft") return 0;
  if (quoteStatus === "sent" || quoteStatus === "revision_requested") return 1;
  if (quoteStatus === "accepted") return orderStatus ? productionStep[orderStatus] ?? 2 : 2;
  return 0;
}

export default function CustomOrderProgress({ quoteStatus, orderStatus }: { quoteStatus: string; orderStatus?: OrderStatus }) {
  if (quoteStatus === "cancelled" || orderStatus === "cancelled") return <p className="order-progress-cancelled">此客製訂單已取消</p>;

  const activeStep = currentStep(quoteStatus, orderStatus);
  return <ol className="custom-order-overview custom-order-lifecycle" aria-label="客製訂單與製作流程">
    {steps.map(([title, description], index) => {
      const state: StepState = index < activeStep ? "complete" : index === activeStep ? "current" : "upcoming";
      return <li className={state} key={title} aria-current={state === "current" ? "step" : undefined}>
        <span>{state === "complete" ? "✓" : index + 1}</span>
        <div><b>{title}</b><small>{description}</small></div>
      </li>;
    })}
  </ol>;
}
