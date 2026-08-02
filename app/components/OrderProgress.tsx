import { orderProgressStatuses, orderStatusLabels, type OrderStatus } from "@/lib/order-workflow";

type HistoryEntry = { status: string; created_at: string };

export default function OrderProgress({ status, history = [] }: { status: string; history?: HistoryEntry[] }) {
  if (status === "cancelled") return <p className="order-progress-cancelled">此訂單已取消</p>;

  const currentIndex = Math.max(0, orderProgressStatuses.indexOf(status as (typeof orderProgressStatuses)[number]));
  return <ol className="order-progress" aria-label="訂單製作流程">
    {orderProgressStatuses.map((step, index) => {
      const entry = history.find((item) => item.status === step);
      const state = index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming";
      return <li className={state} key={step} aria-current={state === "current" ? "step" : undefined}>
        <span>{index < currentIndex ? "✓" : index + 1}</span>
        <div><b>{orderStatusLabels[step as OrderStatus]}</b>{entry && <small>{new Date(entry.created_at).toLocaleDateString("zh-TW")}</small>}</div>
      </li>;
    })}
  </ol>;
}
