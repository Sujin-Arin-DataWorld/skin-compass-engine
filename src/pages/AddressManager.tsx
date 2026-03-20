import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MapPin, Trash2, Pencil, X, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAddresses, type ShippingAddress, type AddressInput } from "@/hooks/useAddresses";

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD = "var(--ssl-accent)";
const BRONZE = "var(--ssl-accent-deep)";

const EMPTY_FORM: AddressInput = {
    label: "", name: "", street: "", city: "", zip: "", country: "DE", phone: "",
};

// ── Mobile detection ─────────────────────────────────────────────────────────
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);
    return isMobile;
}

// ── Floating label input ──────────────────────────────────────────────────────
function FloatingField({
    id, label, type = "text", value, onChange, error, autoComplete,
}: {
    id: string;
    label: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    autoComplete?: string;
}) {
    const [focused, setFocused] = useState(false);
    const floated = focused || value.length > 0;

    return (
        <div className="relative">
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoComplete={autoComplete}
                style={{
                    width: "100%",
                    padding: "1.2rem 0.875rem 0.4rem",
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${focused ? GOLD : error ? "#EF4444" : "rgba(45,107,74,0.18)"}`,
                    borderRadius: "10px",
                    fontSize: "0.875rem",
                    color: "#e8e8e8",
                    outline: "none",
                    transition: "border-color 0.2s",
                }}
            />
            <label
                htmlFor={id}
                style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: floated ? "0.45rem" : "50%",
                    transform: floated ? "none" : "translateY(-50%)",
                    fontSize: floated ? "0.6rem" : "0.8125rem",
                    letterSpacing: floated ? "0.08em" : "0",
                    textTransform: floated ? "uppercase" : "none",
                    color: focused ? GOLD : BRONZE,
                    pointerEvents: "none",
                    transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
                }}
            >
                {label}
            </label>
            {error && (
                <p style={{ fontSize: "0.68rem", color: "#EF4444", marginTop: "0.3rem" }}>
                    {error}
                </p>
            )}
        </div>
    );
}

// ── Address form fields ───────────────────────────────────────────────────────
function AddressForm({
    de, form, setForm, errors,
}: {
    de: boolean;
    form: AddressInput;
    setForm: React.Dispatch<React.SetStateAction<AddressInput>>;
    errors: Partial<Record<keyof AddressInput, string>>;
}) {
    const f = (
        key: keyof AddressInput,
        label: string,
        opts?: { type?: string; autoComplete?: string }
    ) => (
        <FloatingField
            id={key}
            label={label}
            type={opts?.type}
            value={(form[key] as string) ?? ""}
            onChange={(v) => setForm((prev) => ({ ...prev, [key]: v }))}
            error={errors[key]}
            autoComplete={opts?.autoComplete}
        />
    );

    return (
        <div className="space-y-3">
            {f("label", de ? "Bezeichnung (z.B. Zuhause)" : "Label (e.g. Home)")}
            {f("name", de ? "Empfänger *" : "Recipient *", { autoComplete: "name" })}
            {f("street", de ? "Straße & Hausnummer *" : "Street & Number *", { autoComplete: "street-address" })}
            <div className="grid grid-cols-2 gap-3">
                {f("zip", "PLZ / ZIP *", { autoComplete: "postal-code" })}
                {f("city", de ? "Stadt *" : "City *", { autoComplete: "address-level2" })}
            </div>
            {f("country", de ? "Land" : "Country", { autoComplete: "country" })}
            {f("phone", de ? "Telefon (optional)" : "Phone (optional)", { type: "tel", autoComplete: "tel" })}
        </div>
    );
}

// ── Address Drawer (Bottom Sheet on mobile, Side Drawer on desktop) ───────────
function AddressDrawer({
    de, isMobile, editTarget, onClose, onSave, saving, form, setForm,
}: {
    de: boolean;
    isMobile: boolean;
    editTarget: ShippingAddress | null;
    onClose: () => void;
    onSave: () => void;
    saving: boolean;
    form: AddressInput;
    setForm: React.Dispatch<React.SetStateAction<AddressInput>>;
}) {
    const [submitted, setSubmitted] = useState(false);

    const errors: Partial<Record<keyof AddressInput, string>> = {};
    if (submitted) {
        const req = de ? "Erforderlich" : "Required";
        if (!form.name) errors.name = req;
        if (!form.street) errors.street = req;
        if (!form.city) errors.city = req;
        if (!form.zip) errors.zip = req;
    }

    const handleSave = () => {
        setSubmitted(true);
        if (form.name && form.street && form.city && form.zip) {
            onSave();
        }
    };

    const title = editTarget
        ? (de ? "Adresse bearbeiten" : "Edit Address")
        : (de ? "Neue Adresse" : "New Address");

    const content = (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#e8e8e8" }}>
                    {title}
                </h2>
                {!isMobile && (
                    <button onClick={onClose} style={{ lineHeight: 0 }}>
                        <X className="w-4 h-4" style={{ color: BRONZE }} strokeWidth={1.5} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                <AddressForm de={de} form={form} setForm={setForm} errors={errors} />
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="mt-6 w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
                style={{ background: GOLD, color: "#F5F5F7", opacity: saving ? 0.7 : 1 }}
            >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving
                    ? (de ? "Speichere…" : "Saving…")
                    : editTarget
                        ? (de ? "Aktualisieren" : "Update")
                        : (de ? "Adresse speichern" : "Save Address")}
            </button>
        </div>
    );

    if (isMobile) {
        return (
            <div
                className="fixed inset-0 z-50"
                style={{ background: "rgba(0,0,0,0.6)" }}
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 340, damping: 30 }}
                    drag="y"
                    dragConstraints={{ top: 0 }}
                    onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
                    className="absolute bottom-0 left-0 right-0 p-5 pt-2"
                    style={{
                        background: "#111",
                        borderRadius: "20px 20px 0 0",
                        border: "1px solid rgba(45,107,74,0.12)",
                        borderBottom: "none",
                        maxHeight: "92vh",
                    }}
                >
                    {/* Drag handle */}
                    <div
                        className="w-10 h-1 rounded-full mx-auto mb-5"
                        style={{ background: "rgba(255,255,255,0.15)" }}
                    />
                    {content}
                </motion.div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-stretch justify-end"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 340, damping: 30 }}
                className="w-full max-w-[420px] p-7 overflow-y-auto"
                style={{
                    background: "#111",
                    borderLeft: "1px solid rgba(45,107,74,0.12)",
                }}
            >
                {content}
            </motion.div>
        </div>
    );
}

// ── Address card ──────────────────────────────────────────────────────────────
function AddressCard({
    address, de, onEdit, onDelete, onSetDefault, deleting, settingDefault,
}: {
    address: ShippingAddress;
    de: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onSetDefault: () => void;
    deleting: boolean;
    settingDefault: boolean;
}) {
    return (
        <div
            style={{
                background: address.is_default
                    ? "rgba(45,107,74,0.06)"
                    : "rgba(255,255,255,0.025)",
                border: `1px solid ${address.is_default ? "rgba(45,107,74,0.28)" : "rgba(45,107,74,0.1)"}`,
                borderRadius: "14px",
                padding: "1.25rem",
            }}
        >
            <div className="flex items-start justify-between gap-3">
                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        {address.label && (
                            <span style={{
                                fontSize: "0.65rem", color: GOLD,
                                letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600,
                            }}>
                                {address.label}
                            </span>
                        )}
                        {address.is_default && (
                            <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                                style={{
                                    background: "rgba(45,107,74,0.15)",
                                    fontSize: "0.6rem", color: GOLD,
                                    letterSpacing: "0.1em", textTransform: "uppercase",
                                }}
                            >
                                <Star className="w-2.5 h-2.5" />
                                {de ? "Standard" : "Default"}
                            </span>
                        )}
                    </div>
                    <p style={{ fontSize: "0.9rem", color: "#e8e8e8", fontWeight: 500 }}>
                        {address.name}
                    </p>
                    <p style={{ fontSize: "0.8125rem", color: BRONZE, marginTop: "0.25rem" }}>
                        {address.street}
                    </p>
                    <p style={{ fontSize: "0.8125rem", color: BRONZE }}>
                        {address.zip} {address.city} · {address.country}
                    </p>
                    {address.phone && (
                        <p style={{ fontSize: "0.75rem", color: BRONZE, marginTop: "0.15rem" }}>
                            {address.phone}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                    {!address.is_default && (
                        <button
                            onClick={onSetDefault}
                            disabled={settingDefault}
                            title={de ? "Als Standard setzen" : "Set as default"}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-yellow-500/10"
                            style={{ border: "1px solid rgba(45,107,74,0.2)" }}
                        >
                            {settingDefault
                                ? <Loader2 className="w-3 h-3 animate-spin" style={{ color: GOLD }} />
                                : <Star className="w-3 h-3" style={{ color: BRONZE }} strokeWidth={1.5} />
                            }
                        </button>
                    )}
                    <button
                        onClick={onEdit}
                        title={de ? "Bearbeiten" : "Edit"}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-yellow-500/10"
                        style={{ border: "1px solid rgba(45,107,74,0.2)" }}
                    >
                        <Pencil className="w-3 h-3" style={{ color: BRONZE }} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={onDelete}
                        disabled={deleting}
                        title={de ? "Löschen" : "Delete"}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-red-500/10"
                        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                        {deleting
                            ? <Loader2 className="w-3 h-3 animate-spin" style={{ color: BRONZE }} />
                            : <Trash2 className="w-3 h-3" style={{ color: BRONZE }} strokeWidth={1.5} />
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── AddressManager ────────────────────────────────────────────────────────────
export default function AddressManager({ de }: { de: boolean }) {
    const { addresses, loading, addAddress, updateAddress, deleteAddress, setDefault } = useAddresses();
    const isMobile = useIsMobile();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<ShippingAddress | null>(null);
    const [form, setForm] = useState<AddressInput>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [defaultingId, setDefaultingId] = useState<string | null>(null);

    const openAdd = () => {
        setEditTarget(null);
        setForm(EMPTY_FORM);
        setDrawerOpen(true);
    };

    const openEdit = (addr: ShippingAddress) => {
        setEditTarget(addr);
        setForm({
            label: addr.label,
            name: addr.name,
            street: addr.street,
            city: addr.city,
            zip: addr.zip,
            country: addr.country,
            phone: addr.phone ?? "",
        });
        setDrawerOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const { error } = editTarget
            ? await updateAddress(editTarget.id, form)
            : await addAddress(form);
        setSaving(false);
        if (error) {
            toast.error(error);
        } else {
            toast.success(
                editTarget
                    ? (de ? "Adresse aktualisiert" : "Address updated")
                    : (de ? "Adresse hinzugefügt" : "Address added")
            );
            setDrawerOpen(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        const { error } = await deleteAddress(id);
        setDeletingId(null);
        if (error) toast.error(error);
        else toast.success(de ? "Adresse entfernt" : "Address removed");
    };

    const handleSetDefault = async (id: string) => {
        setDefaultingId(id);
        const { error } = await setDefault(id);
        setDefaultingId(null);
        if (error) toast.error(error);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <p style={{
                    fontSize: "0.6rem", letterSpacing: "0.28em",
                    color: GOLD, textTransform: "uppercase", fontWeight: 600,
                }}>
                    {de ? "Lieferadressen" : "Shipping Addresses"}
                    {addresses.length > 0 && (
                        <span style={{ color: BRONZE, marginLeft: "0.5rem" }}>
                            ({addresses.length})
                        </span>
                    )}
                </p>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: GOLD, color: "#F5F5F7" }}
                >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                    {de ? "Hinzufügen" : "Add New"}
                </button>
            </div>

            {/* Skeleton */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2].map(i => (
                        <div
                            key={i}
                            className="h-28 rounded-xl animate-pulse"
                            style={{ background: "rgba(255,255,255,0.04)" }}
                        />
                    ))}
                </div>

            ) : addresses.length === 0 ? (
                /* Empty state */
                <div
                    className="text-center py-14 rounded-2xl"
                    style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(45,107,74,0.08)",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    <MapPin
                        className="w-10 h-10 mx-auto mb-3"
                        style={{ color: "rgba(45,107,74,0.25)" }}
                        strokeWidth={1.5}
                    />
                    <p style={{ fontSize: "0.875rem", color: BRONZE }}>
                        {de ? "Noch keine Adressen gespeichert." : "No addresses saved yet."}
                    </p>
                    <button
                        onClick={openAdd}
                        className="mt-4 px-5 py-2 rounded-full text-sm font-semibold"
                        style={{ background: GOLD, color: "#F5F5F7" }}
                    >
                        {de ? "Erste Adresse hinzufügen" : "Add First Address"}
                    </button>
                </div>

            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {addresses.map((addr) => (
                            <motion.div
                                key={addr.id}
                                layout
                                exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
                            >
                                <AddressCard
                                    address={addr}
                                    de={de}
                                    onEdit={() => openEdit(addr)}
                                    onDelete={() => handleDelete(addr.id)}
                                    onSetDefault={() => handleSetDefault(addr.id)}
                                    deleting={deletingId === addr.id}
                                    settingDefault={defaultingId === addr.id}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Drawer */}
            <AnimatePresence>
                {drawerOpen && (
                    <AddressDrawer
                        de={de}
                        isMobile={isMobile}
                        editTarget={editTarget}
                        onClose={() => setDrawerOpen(false)}
                        onSave={handleSave}
                        saving={saving}
                        form={form}
                        setForm={setForm}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
