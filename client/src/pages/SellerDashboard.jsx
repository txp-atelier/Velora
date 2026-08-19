import { useEffect, useState } from "react";
import { Package, Plus, Pencil, Trash2, Store, ImageOff } from "lucide-react";
import { productsApi, ordersApi } from "../services/api";
import { formatINR, getProductId, getStatusVariant, statusLabel, nextOrderActions } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import { isValidPrice, isNonNegativeInteger, minLength, maxLength } from "../utils/validation";
import { emptyImageState, toImageState, imageCount, finalizeImages, rollbackUploads, cleanupRemovedImages, revokeImageState } from "../utils/imageUpload";
import EmptyState from "../components/EmptyState";
import OnboardingTooltip from "../components/OnboardingTooltip";
import FileUpload from "../components/FileUpload";
import { ProductGridSkeleton } from "../components/Skeleton";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import IconButton from "../components/ui/IconButton";
import Badge from "../components/ui/Badge";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Modal from "../components/ui/Modal";
import OrderStepper from "../components/ui/OrderStepper";

const CATEGORIES = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports", "Books"];

function emptyForm() {
  return { name: "", description: "", category: "Electronics", subcategory: "", brand: "", price: "", originalPrice: "", stock: "", images: emptyImageState(), specs: {} };
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("products");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [touched, setTouched] = useState({});
  const [serverFields, setServerFields] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionError, setActionError] = useState("");

  const runOrderAction = async () => {
    if (!confirmAction) return;
    setActionError("");
    try {
      await ordersApi.updateStatus(confirmAction.orderId, confirmAction.status);
      load();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [prods, ords] = await Promise.all([
        productsApi.list({ seller: user.id, limit: 60 }),
        ordersApi.list(),
      ]);
      setProducts(prods.products || []);
      setOrders(ords);
    } catch {
      setProducts([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  if (!user || user.role !== "seller") {
    return (
      <EmptyState
        icon={Store}
        title="Seller access required"
        message="Sign in with a seller account to manage your products."
        action={<Button variant="primary" to="/">Go home</Button>}
      />
    );
  }

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (serverFields[key]) setServerFields((f) => ({ ...f, [key]: undefined }));
  };
  const markTouched = (key) => setTouched((t) => ({ ...t, [key]: true }));

  const fieldValid = {
    name: minLength(form.name, 3) && maxLength(form.name, 120),
    description: minLength(form.description, 20),
    price: isValidPrice(form.price),
    stock: isNonNegativeInteger(form.stock),
    images: imageCount(form.images) > 0,
  };
  const clientError = {
    name: form.name.trim() ? "Name must be 3-120 characters." : "Product name is required.",
    description: form.description.trim() ? "Description must be at least 20 characters." : "Description is required.",
    price: "Enter a price greater than ₹0 (up to 2 decimal places).",
    stock: "Stock must be a whole number, 0 or more.",
    images: "Add at least one product image.",
  };
  const errorFor = (key) => serverFields[key] || (touched[key] && !fieldValid[key] ? clientError[key] : undefined);
  const isFormValid = () => Object.values(fieldValid).every(Boolean);

  const openAddForm = () => {
    setEditing(null);
    setForm(emptyForm());
    setTouched({});
    setServerFields({});
    setError("");
    setFormOpen(true);
  };

  const openEditForm = (p) => {
    setEditing(getProductId(p));
    setTouched({});
    setServerFields({});
    setError("");
    setForm({
      name: p.name,
      description: p.description,
      category: p.category,
      subcategory: p.subcategory || "",
      brand: p.brand || "",
      price: p.price,
      originalPrice: p.originalPrice || "",
      stock: p.stock,
      images: toImageState(p.images || []),
      specs: p.specs || {},
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    revokeImageState(form.images);
    setFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, description: true, price: true, stock: true, images: true });
    if (!isFormValid()) return;

    setError("");
    setSaving(true);
    try {
      let images;
      try {
        images = await finalizeImages(form.images);
      } catch (uploadErr) {
        setError(uploadErr.message || "Could not upload one or more images.");
        return;
      }

      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        subcategory: form.subcategory,
        brand: form.brand,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stock: Number(form.stock),
        images: images.urls,
        specs: form.specs,
      };
      try {
        if (editing) await productsApi.update(editing, body);
        else await productsApi.create(body);
      } catch (saveErr) {
        await rollbackUploads(images.newlyUploaded);
        setError(saveErr.fields ? "" : saveErr.message);
        setServerFields(saveErr.fields || {});
        return;
      }

      await cleanupRemovedImages(form.images);
      setFormOpen(false);
      setForm(emptyForm());
      setTouched({});
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    await productsApi.delete(deleteTarget);
    load();
  };

  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <h1>Seller Dashboard</h1>
        <p className="text-secondary">Manage your Velora listings</p>
      </div>
      <div className="dashboard-tabs">
        <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>My Products</button>
        <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>Orders</button>
      </div>
      {tab === "products" && (
        <div className="card seller-listings">
          <div className="seller-listings-header">
            <h2>Your listings ({products.length})</h2>
            <OnboardingTooltip id="seller_first_product" align="right" title="Add your first product" message="Fill in the details and upload images. Buyers will see your listing instantly.">
              <Button variant="accent" onClick={openAddForm}>
                <Plus size={16} /> Add product
              </Button>
            </OnboardingTooltip>
          </div>
          {loading ? <ProductGridSkeleton count={3} /> : products.length === 0 ? (
            <EmptyState icon={Package} title="No products yet" message="Add your first product — it only takes a minute." action={<Button variant="accent" onClick={openAddForm}><Plus size={16} /> Add product</Button>} />
          ) : (
            <div className="listing-table">
              {products.map((p) => (
                <div key={getProductId(p)} className="listing-row">
                  <img src={p.images?.[0] || p.image} alt="" />
                  <div>
                    <h3>{p.name}</h3>
                    <p className="text-secondary">{p.category} · {formatINR(p.price)} · Stock: {p.stock}</p>
                  </div>
                  <div className="listing-actions">
                    <IconButton icon={Pencil} label="Edit" size="sm" onClick={() => openEditForm(p)} />
                    <IconButton icon={Trash2} label="Delete" size="sm" variant="danger" onClick={() => setDeleteTarget(getProductId(p))} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {tab === "orders" && (
        <div className="orders-section">
          {actionError && <p className="form-error">{actionError}</p>}
          {orders.length === 0 ? (
            <EmptyState icon={Package} title="No orders yet" message="Orders containing your products will appear here." />
          ) : (
            orders.map((o) => {
              const actions = nextOrderActions(o.status, "seller");
              return (
                <div key={o._id} className="card order-card">
                  <div className="order-header">
                    <span>Order #{o._id.slice(-6)}</span>
                    <Badge variant={getStatusVariant(o.status)}>{statusLabel(o.status)}</Badge>
                  </div>
                  <p className="text-secondary">{o.customer?.name} · {formatINR(o.total)}</p>
                  <OrderStepper status={o.status} />
                  <ul>{o.items.map((i, idx) => <li key={idx}>{i.name} x {i.quantity}</li>)}</ul>
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
            })
          )}
        </div>
      )}

      <Modal open={formOpen} onClose={closeForm} className="product-form-modal" labelledBy="product-form-title">
        <h2 id="product-form-title">{editing ? "Edit product" : "Add new product"}</h2>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit} className="seller-form" noValidate>
          <Input
            label="Name" value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            onBlur={() => markTouched("name")}
            error={errorFor("name")}
            success={touched.name && fieldValid.name}
            required
          />
          <div className="form-row">
            <Select label="Category" value={form.category} onChange={(e) => setField("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Input label="Brand" value={form.brand} onChange={(e) => setField("brand", e.target.value)} />
          </div>
          <div className="form-row">
            <Input
              label="Price (₹)" type="number" value={form.price}
              onChange={(e) => setField("price", e.target.value)}
              onBlur={() => markTouched("price")}
              error={errorFor("price")}
              success={touched.price && fieldValid.price}
              required min="0.01" step="0.01"
            />
            <Input
              label="Stock" type="number" inputMode="numeric" value={form.stock}
              onChange={(e) => setField("stock", e.target.value)}
              onBlur={() => markTouched("stock")}
              error={errorFor("stock")}
              success={touched.stock && fieldValid.stock}
              required min="0" step="1"
            />
          </div>
          <div className="form-row">
            <Input label="Original price (₹)" type="number" hint="Optional" value={form.originalPrice} onChange={(e) => setField("originalPrice", e.target.value)} min="0" step="0.01" />
            <Input label="Subcategory" hint="Optional" value={form.subcategory} onChange={(e) => setField("subcategory", e.target.value)} />
          </div>
          <Textarea
            label="Description" value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            onBlur={() => markTouched("description")}
            error={errorFor("description")}
            hint={!touched.description ? "At least 20 characters" : undefined}
            required rows={2}
          />
          <label className="field-label">Product images<span className="field-required">*</span></label>
          <FileUpload value={form.images} onChange={(images) => { setField("images", images); markTouched("images"); }} max={5} disabled={saving} />
          {errorFor("images") && (
            <p className="field-error-text"><ImageOff size={13} /> {errorFor("images")}</p>
          )}
          <div className="form-actions">
            <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
            <Button
              type="submit" variant="accent" loading={saving}
              disabled={Object.keys(touched).length > 0 && !isFormValid()}
              title={Object.keys(touched).length > 0 && !isFormValid() ? "Fix the highlighted fields to continue" : undefined}
            >
              {saving ? "Saving…" : editing ? "Update product" : "Add product"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Remove this product?"
        message="It will no longer be visible to buyers. This can't be undone."
        confirmLabel="Remove product"
      />
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={runOrderAction}
        title={confirmAction?.label || "Confirm"}
        message={
          confirmAction?.status === "cancelled"
            ? "This will cancel the order and restock the items. This can't be undone."
            : `This will mark the order as "${confirmAction ? statusLabel(confirmAction.status) : ""}".`
        }
        confirmLabel={confirmAction?.label || "Confirm"}
        danger={confirmAction?.status === "cancelled"}
      />
    </div>
  );
}
