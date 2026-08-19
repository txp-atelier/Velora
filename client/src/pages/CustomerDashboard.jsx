import { useEffect, useState } from "react";
import { Package, MapPin } from "lucide-react";
import { ordersApi } from "../services/api";
import { formatINR, getStatusVariant, getStatusIcon, statusLabel, nextOrderActions } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import OrderStepper from "../components/ui/OrderStepper";
import ConfirmDialog from "../components/ui/ConfirmDialog";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionError, setActionError] = useState("");

  const load = () => ordersApi.list().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  if (!user) {
    return (
      <EmptyState
        title="Sign in to view orders"
        message="Your order history is available after you sign in."
        action={<Button variant="primary" to="/">Go home</Button>}
      />
    );
  }

  const runAction = async () => {
    if (!confirmAction) return;
    setActionError("");
    try {
      await ordersApi.updateStatus(confirmAction.orderId, confirmAction.status);
      load();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="customer-dashboard">
      <h1>My Orders</h1>
      <p className="text-secondary page-subtitle">Track and review your Velora purchases</p>
      {actionError && <p className="form-error">{actionError}</p>}
      {loading ? <Skeleton height="200px" /> : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          message="When you place an order, it will show up here."
          action={<Button variant="accent" to="/">Start shopping</Button>}
        />
      ) : (
        <div className="orders-list">
          {orders.map((o) => {
            const actions = nextOrderActions(o.status, "customer");
            return (
              <div key={o._id} className={`order-card status-${o.status}`}>
                <div className="order-header">
                  <div>
                    <span className="order-id">Order #{o._id.slice(-8).toUpperCase()}</span>
                    <p className="order-date">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{formatINR(o.total)}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(o.status)} icon={getStatusIcon(o.status)}>{statusLabel(o.status)}</Badge>
                </div>
                <OrderStepper status={o.status} />
                <div className="order-items-preview">
                  {o.items.map((item, i) => (
                    <div key={i} className="order-item-preview">
                      {item.image && <img src={item.image} alt="" />}
                      <span>{item.name} x {item.quantity}</span>
                    </div>
                  ))}
                </div>
                {o.shippingAddress && (
                  <p className="order-address">
                    <MapPin size={13} /> Ships to: {o.shippingAddress.fullName}, {o.shippingAddress.city}
                  </p>
                )}
                {actions.length > 0 && (
                  <div className="order-actions">
                    {actions.map((a) => (
                      <Button
                        key={a.status}
                        variant={a.danger ? "outline" : "primary"}
                        size="sm"
                        onClick={() => setConfirmAction({ orderId: o._id, ...a })}
                      >
                        {a.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={runAction}
        title={confirmAction?.label || "Confirm"}
        message={
          confirmAction?.status === "cancelled"
            ? "This will cancel your order and can't be undone."
            : "This will start a return for this order."
        }
        confirmLabel={confirmAction?.label || "Confirm"}
      />
    </div>
  );
}
