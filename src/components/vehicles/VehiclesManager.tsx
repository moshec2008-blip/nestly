"use client";

import { useMemo, useState, type FormEvent } from "react";
import DateInput from "@/components/ui/DateInput";
import EmptyState from "@/components/ui/EmptyState";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { initialVehicleRecords } from "@/data/modules";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { storageKeys } from "@/lib/storageKeys";
import type { ModuleRecord, ModuleRecordStatus } from "@/types/modules";

type VehicleForm = {
  title: string;
  description: string;
  owner: string;
  category: string;
  date: string;
};

type VehicleProfile = {
  id: string;
  plateNumber: string;
  makeModel: string;
  type: string;
  odometer: number;
  testDate: string;
  insuranceRenewalDate: string;
  purchaseDate: string;
  saleDate?: string;
  isClosed?: boolean;
};

type VehicleProfileForm = Omit<VehicleProfile, "id" | "odometer"> & {
  odometer: string;
};

type DriverLicense = {
  id: string;
  memberName: string;
  licenseNumber: string;
  licenseClass: string;
  expiryDate: string;
  renewalDate: string;
};

type DriverLicenseForm = Omit<DriverLicense, "id">;

type VehicleFine = {
  id: string;
  vehicleId: string;
  reportNumber: string;
  authority: string;
  filingLocation: string;
  issueDate: string;
  paymentDueDate: string;
  amount?: number;
  status: "open" | "paid" | "filed";
};

type VehicleFineForm = Omit<VehicleFine, "id" | "amount" | "status"> & {
  amount: string;
  status: VehicleFine["status"];
};

const vehicleCategories = ["הכל", "רישוי", "תחזוקה", "ביטוח", "הוצאות"];

const initialVehicleProfiles: VehicleProfile[] = [
  {
    id: "vehicle-profile-1",
    plateNumber: "123-45-678",
    makeModel: "Toyota Corolla",
    type: "משפחתית",
    odometer: 68200,
    testDate: "2026-08-20",
    insuranceRenewalDate: "2026-11-15",
    purchaseDate: "2023-05-01",
  },
];

const initialDriverLicenses: DriverLicense[] = [
  {
    id: "driver-license-1",
    memberName: "הבית",
    licenseNumber: "0000000",
    licenseClass: "B",
    expiryDate: "2028-04-10",
    renewalDate: "2028-03-10",
  },
];

const initialVehicleFines: VehicleFine[] = [];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function getInitialReminderForm(): VehicleForm {
  return {
    title: "",
    description: "",
    owner: "הבית",
    category: "תחזוקה",
    date: getTodayDate(),
  };
}

function getInitialVehicleForm(): VehicleProfileForm {
  return {
    plateNumber: "",
    makeModel: "",
    type: "",
    odometer: "",
    testDate: getTodayDate(),
    insuranceRenewalDate: getTodayDate(),
    purchaseDate: getTodayDate(),
    saleDate: "",
    isClosed: false,
  };
}

function getInitialLicenseForm(): DriverLicenseForm {
  return {
    memberName: "",
    licenseNumber: "",
    licenseClass: "B",
    expiryDate: getTodayDate(),
    renewalDate: getTodayDate(),
  };
}

function getInitialFineForm(vehicleId: string): VehicleFineForm {
  return {
    vehicleId,
    reportNumber: "",
    authority: "",
    filingLocation: "",
    issueDate: getTodayDate(),
    paymentDueDate: getTodayDate(),
    amount: "",
    status: "open",
  };
}

function getFormFromRecord(record: ModuleRecord): VehicleForm {
  return {
    title: record.title,
    description: record.description,
    owner: record.owner,
    category: record.category,
    date: record.date,
  };
}

function formatDate(date: string) {
  if (!date) {
    return "לא הוזן";
  }

  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getDaysUntil(date: string) {
  const today = new Date(getTodayDate());
  const targetDate = new Date(date);
  const difference = targetDate.getTime() - today.getTime();
  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

function getDateLabel(date: string) {
  const daysUntil = getDaysUntil(date);

  if (daysUntil < 0) {
    return `באיחור ${Math.abs(daysUntil)} ימים`;
  }

  if (daysUntil === 0) {
    return "היום";
  }

  if (daysUntil === 1) {
    return "מחר";
  }

  return `בעוד ${daysUntil} ימים`;
}

function getStatusLabel(status: ModuleRecordStatus) {
  return status === "done" ? "בוצע" : "פתוח";
}

function getFineStatusLabel(status: VehicleFine["status"]) {
  if (status === "paid") return "שולם";
  if (status === "filed") return "תויק";
  return "פתוח";
}

function formatCurrency(amount?: number) {
  if (!amount) {
    return "לא הוזן";
  }

  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function VehiclesManager() {
  const { confirm, toast } = useFeedback();
  const [vehicleProfiles, setVehicleProfiles] =
    usePersistentArrayState<VehicleProfile>(
      storageKeys.vehicleProfiles,
      initialVehicleProfiles
    );
  const [driverLicenses, setDriverLicenses] =
    usePersistentArrayState<DriverLicense>(
      storageKeys.vehicleDriverLicenses,
      initialDriverLicenses
    );
  const [vehicleFines, setVehicleFines] = usePersistentArrayState<VehicleFine>(
    storageKeys.vehicleFines,
    initialVehicleFines
  );
  const [records, setRecords] = usePersistentArrayState<ModuleRecord>(
    storageKeys.vehicles,
    initialVehicleRecords
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState(
    () => vehicleProfiles[0]?.id ?? ""
  );
  const [vehicleForm, setVehicleForm] = useState<VehicleProfileForm>(() =>
    getInitialVehicleForm()
  );
  const [licenseForm, setLicenseForm] = useState<DriverLicenseForm>(() =>
    getInitialLicenseForm()
  );
  const [fineForm, setFineForm] = useState<VehicleFineForm>(() =>
    getInitialFineForm(vehicleProfiles[0]?.id ?? "")
  );
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [isLicenseFormOpen, setIsLicenseFormOpen] = useState(false);
  const [isFineFormOpen, setIsFineFormOpen] = useState(false);
  const [form, setForm] = useState<VehicleForm>(() => getInitialReminderForm());
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("הכל");
  const [statusFilter, setStatusFilter] =
    useState<"all" | ModuleRecordStatus>("all");

  const selectedVehicle =
    vehicleProfiles.find((vehicle) => vehicle.id === selectedVehicleId) ??
    vehicleProfiles[0] ??
    null;

  const selectedVehicleFines = useMemo(
    () =>
      selectedVehicle
        ? vehicleFines.filter((fine) => fine.vehicleId === selectedVehicle.id)
        : [],
    [selectedVehicle, vehicleFines]
  );

  const openRecords = useMemo(
    () =>
      records
        .filter((record) => record.status === "open")
        .sort((a, b) => a.date.localeCompare(b.date)),
    [records]
  );

  const nextRecord = openRecords[0] ?? null;
  const overdueCount = openRecords.filter(
    (record) => getDaysUntil(record.date) < 0
  ).length;
  const openFineCount = vehicleFines.filter((fine) => fine.status === "open").length;

  const visibleRecords = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return [...records]
      .filter(
        (record) => categoryFilter === "הכל" || record.category === categoryFilter
      )
      .filter((record) => statusFilter === "all" || record.status === statusFilter)
      .filter((record) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          record.title.toLowerCase().includes(normalizedSearch) ||
          record.description.toLowerCase().includes(normalizedSearch) ||
          record.owner.toLowerCase().includes(normalizedSearch) ||
          record.category.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "open" ? -1 : 1;
        }

        return a.date.localeCompare(b.date);
      });
  }, [categoryFilter, records, searchValue, statusFilter]);

  function resetReminderForm() {
    setForm(getInitialReminderForm());
    setEditingRecordId(null);
  }

  function syncSelectedVehicle(vehicleId: string) {
    setSelectedVehicleId(vehicleId);
    setFineForm((currentForm) => ({ ...currentForm, vehicleId }));
  }

  function handleVehicleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanPlate = vehicleForm.plateNumber.trim();
    const cleanModel = vehicleForm.makeModel.trim();

    if (!cleanPlate || !cleanModel) {
      return;
    }

    const vehicle: VehicleProfile = {
      id: createId("vehicle"),
      plateNumber: cleanPlate,
      makeModel: cleanModel,
      type: vehicleForm.type.trim() || "רכב משפחתי",
      odometer: Number(vehicleForm.odometer) || 0,
      testDate: vehicleForm.testDate,
      insuranceRenewalDate: vehicleForm.insuranceRenewalDate,
      purchaseDate: vehicleForm.purchaseDate,
      saleDate: vehicleForm.saleDate || undefined,
      isClosed: vehicleForm.isClosed,
    };

    setVehicleProfiles((currentVehicles) => [vehicle, ...currentVehicles]);
    syncSelectedVehicle(vehicle.id);
    setVehicleForm(getInitialVehicleForm());
    setIsVehicleFormOpen(false);
    toast({
      title: "הרכב נוסף",
      description: `${vehicle.plateNumber} · ${vehicle.makeModel}`,
      tone: "success",
    });
  }

  function updateSelectedVehicle(patch: Partial<VehicleProfile>) {
    if (!selectedVehicle) {
      return;
    }

    setVehicleProfiles((currentVehicles) =>
      currentVehicles.map((vehicle) =>
        vehicle.id === selectedVehicle.id ? { ...vehicle, ...patch } : vehicle
      )
    );
  }

  function handleLicenseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = licenseForm.memberName.trim();
    const cleanNumber = licenseForm.licenseNumber.trim();

    if (!cleanName || !cleanNumber) {
      return;
    }

    const license: DriverLicense = {
      id: createId("license"),
      memberName: cleanName,
      licenseNumber: cleanNumber,
      licenseClass: licenseForm.licenseClass.trim() || "B",
      expiryDate: licenseForm.expiryDate,
      renewalDate: licenseForm.renewalDate,
    };

    setDriverLicenses((currentLicenses) => [license, ...currentLicenses]);
    setLicenseForm(getInitialLicenseForm());
    setIsLicenseFormOpen(false);
    toast({
      title: "רישיון הנהיגה נשמר",
      description: license.memberName,
      tone: "success",
    });
  }

  function handleFineSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fineForm.vehicleId || !fineForm.reportNumber.trim()) {
      return;
    }

    const fine: VehicleFine = {
      id: createId("fine"),
      vehicleId: fineForm.vehicleId,
      reportNumber: fineForm.reportNumber.trim(),
      authority: fineForm.authority.trim() || "לא הוזן",
      filingLocation: fineForm.filingLocation.trim() || "לא הוזן",
      issueDate: fineForm.issueDate,
      paymentDueDate: fineForm.paymentDueDate,
      amount: Number(fineForm.amount) || undefined,
      status: fineForm.status,
    };

    setVehicleFines((currentFines) => [fine, ...currentFines]);
    setFineForm(getInitialFineForm(selectedVehicle?.id ?? ""));
    setIsFineFormOpen(false);
    toast({
      title: "הדו״ח נשמר",
      description: fine.reportNumber,
      tone: "success",
    });
  }

  function handleReminderSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = form.title.trim();
    const cleanDescription = form.description.trim();
    const cleanOwner = form.owner.trim();
    const cleanCategory = form.category.trim();

    if (!cleanTitle || !cleanOwner || !cleanCategory || !form.date) {
      return;
    }

    if (editingRecordId) {
      setRecords((currentRecords) =>
        currentRecords.map((record) =>
          record.id === editingRecordId
            ? {
                ...record,
                title: cleanTitle,
                description: cleanDescription || "תזכורת רכב ללא פירוט נוסף.",
                owner: cleanOwner,
                category: cleanCategory,
                date: form.date,
              }
            : record
        )
      );
      resetReminderForm();
      setIsFormOpen(false);
      toast({
        title: "תזכורת הרכב עודכנה",
        description: cleanTitle,
        tone: "success",
      });
      return;
    }

    const record: ModuleRecord = {
      id: createId("vehicle-reminder"),
      title: cleanTitle,
      description: cleanDescription || "תזכורת רכב ללא פירוט נוסף.",
      owner: cleanOwner,
      category: cleanCategory,
      date: form.date,
      status: "open",
    };

    setRecords((currentRecords) => [record, ...currentRecords]);
    resetReminderForm();
    setIsFormOpen(false);
    toast({
      title: "תזכורת רכב נוספה",
      description: record.title,
      tone: "success",
    });
  }

  function toggleStatus(id: string) {
    setRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.id === id
          ? { ...record, status: record.status === "done" ? "open" : "done" }
          : record
      )
    );
  }

  function startEdit(record: ModuleRecord) {
    setEditingRecordId(record.id);
    setForm(getFormFromRecord(record));
    setIsFormOpen(true);
  }

  async function deleteRecord(id: string) {
    const record = records.find((item) => item.id === id);
    const title = record?.title ?? "התזכורת הזו";
    const approved = await confirm({
      title: "מחיקת תזכורת רכב",
      description: `למחוק את "${title}"? אי אפשר לשחזר אחרי המחיקה.`,
      confirmLabel: "מחק תזכורת",
      cancelLabel: "ביטול",
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    setRecords((currentRecords) =>
      currentRecords.filter((record) => record.id !== id)
    );
    toast({
      title: "התזכורת נמחקה",
      description: title,
      tone: "info",
    });
  }

  return (
    <section className="space-y-3 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1rem)] lg:pb-0">
      <section className="nestly-card p-3 text-right">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black text-[#007aff]">מרכז רכבים</p>
            <h2 className="mt-1 text-xl font-black text-[#111827]">
              תיק הרכב המשפחתי
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              רכבים, רישיונות נהיגה, דוחות ותזכורות כלליות במקום אחד.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={selectedVehicle?.id ?? ""}
              onChange={(event) => syncSelectedVehicle(event.target.value)}
              className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-white px-4 text-right text-sm font-black text-[#111827] outline-none focus:border-[#d8b470]"
            >
              {vehicleProfiles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plateNumber} · {vehicle.makeModel}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setIsVehicleFormOpen((current) => !current)}
              className="min-h-11 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-4 text-sm font-black text-[#111827] shadow-sm transition hover:bg-white"
            >
              {isVehicleFormOpen ? "סגור" : "+ רכב"}
            </button>
          </div>
        </div>

        {isVehicleFormOpen ? (
          <form
            onSubmit={handleVehicleSubmit}
            className="mt-3 grid gap-2.5 rounded-[24px] border border-[#ebe4d8] bg-[#fffdf8] p-3 lg:grid-cols-4"
          >
            <label className="grid gap-1">
              <span className="text-xs font-bold text-slate-600">מספר רכב</span>
              <input
                value={vehicleForm.plateNumber}
                onChange={(event) =>
                  setVehicleForm((current) => ({
                    ...current,
                    plateNumber: event.target.value,
                  }))
                }
                required
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none focus:border-slate-400"
                placeholder="123-45-678"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-bold text-slate-600">סוג ודגם</span>
              <input
                value={vehicleForm.makeModel}
                onChange={(event) =>
                  setVehicleForm((current) => ({
                    ...current,
                    makeModel: event.target.value,
                  }))
                }
                required
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none focus:border-slate-400"
                placeholder="Toyota Corolla"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-bold text-slate-600">סיווג</span>
              <input
                value={vehicleForm.type}
                onChange={(event) =>
                  setVehicleForm((current) => ({
                    ...current,
                    type: event.target.value,
                  }))
                }
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none focus:border-slate-400"
                placeholder="משפחתית / מסחרי"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-bold text-slate-600">ק״מ נוכחי</span>
              <input
                value={vehicleForm.odometer}
                onChange={(event) =>
                  setVehicleForm((current) => ({
                    ...current,
                    odometer: event.target.value,
                  }))
                }
                inputMode="numeric"
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none focus:border-slate-400"
                placeholder="68200"
              />
            </label>
            <DateInput
              value={vehicleForm.testDate}
              onChange={(date) =>
                setVehicleForm((current) => ({ ...current, testDate: date }))
              }
              label="תאריך טסט"
              inputClassName="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none focus:border-slate-400"
            />
            <DateInput
              value={vehicleForm.insuranceRenewalDate}
              onChange={(date) =>
                setVehicleForm((current) => ({
                  ...current,
                  insuranceRenewalDate: date,
                }))
              }
              label="חידוש ביטוח"
              inputClassName="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none focus:border-slate-400"
            />
            <DateInput
              value={vehicleForm.purchaseDate}
              onChange={(date) =>
                setVehicleForm((current) => ({ ...current, purchaseDate: date }))
              }
              label="תאריך רכישה"
              inputClassName="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none focus:border-slate-400"
            />
            <DateInput
              value={vehicleForm.saleDate ?? ""}
              onChange={(date) =>
                setVehicleForm((current) => ({ ...current, saleDate: date }))
              }
              label="תאריך מכירה / סגירה"
              inputClassName="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none focus:border-slate-400"
            />
            <button
              type="submit"
              className="min-h-11 rounded-2xl bg-[#007aff] px-4 text-sm font-black text-white transition hover:bg-[#0065d1] lg:col-span-4"
            >
              שמור רכב
            </button>
          </form>
        ) : null}

        {selectedVehicle ? (
          <div className="mt-3 grid gap-2 lg:grid-cols-[1.2fr_1fr_1fr]">
            <div className="rounded-[24px] border border-[#ebe4d8] bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700 ring-1 ring-sky-100">
                  {selectedVehicle.isClosed ? "סגור" : "פעיל"}
                </span>
                <div>
                  <p className="text-xs font-black text-slate-500">
                    {selectedVehicle.plateNumber}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-[#111827]">
                    {selectedVehicle.makeModel}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {selectedVehicle.type}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="rounded-2xl bg-[#fafafb] p-3">
                  <span className="text-[11px] font-bold text-slate-500">
                    ק״מ נוכחי
                  </span>
                  <input
                    value={selectedVehicle.odometer}
                    onChange={(event) =>
                      updateSelectedVehicle({
                        odometer: Number(event.target.value) || 0,
                      })
                    }
                    inputMode="numeric"
                    className="mt-1 w-full bg-transparent text-right text-lg font-black text-[#111827] outline-none"
                  />
                </label>
                <div className="rounded-2xl bg-[#fafafb] p-3">
                  <p className="text-[11px] font-bold text-slate-500">
                    תאריך רכישה
                  </p>
                  <p className="mt-1 text-sm font-black text-[#111827]">
                    {formatDate(selectedVehicle.purchaseDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#ebe4d8] bg-[#fffdf8] p-3">
              <p className="text-xs font-black text-[#7a5212]">מועדים קרובים</p>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
                  <span className="text-xs font-black text-slate-500">
                    {formatDate(selectedVehicle.testDate)}
                  </span>
                  <div>
                    <p className="text-sm font-black text-[#111827]">טסט</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {getDateLabel(selectedVehicle.testDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
                  <span className="text-xs font-black text-slate-500">
                    {formatDate(selectedVehicle.insuranceRenewalDate)}
                  </span>
                  <div>
                    <p className="text-sm font-black text-[#111827]">
                      חידוש ביטוח
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {getDateLabel(selectedVehicle.insuranceRenewalDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#ebe4d8] bg-white p-3 shadow-sm">
              <p className="text-xs font-black text-slate-500">תמונת מצב</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold text-slate-500">
                    דוחות פתוחים
                  </p>
                  <p className="mt-1 text-xl font-black text-rose-700">
                    {selectedVehicleFines.filter((fine) => fine.status === "open").length}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold text-slate-500">
                    תזכורות כלליות
                  </p>
                  <p className="mt-1 text-xl font-black text-[#111827]">
                    {openRecords.length}
                  </p>
                </div>
              </div>
              {selectedVehicle.saleDate ? (
                <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                  נמכר / נסגר בתאריך {formatDate(selectedVehicle.saleDate)}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <EmptyState
            className="mt-3"
            icon="🚗"
            title="עדיין אין רכב משפחתי"
            description="הוסף רכב ראשון כדי לעקוב אחרי טסט, ביטוח, ק״מ, דוחות ותזכורות."
          />
        )}
      </section>

      <div className="grid gap-3 xl:grid-cols-2">
        <section className="nestly-card p-3 text-right">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsLicenseFormOpen((current) => !current)}
              className="min-h-10 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-3 text-xs font-black text-[#111827] transition hover:bg-white"
            >
              {isLicenseFormOpen ? "סגור" : "+ רישיון"}
            </button>
            <div>
              <p className="text-xs font-bold text-slate-500">בני משפחה</p>
              <h2 className="text-base font-black text-[#111827]">
                רישיונות נהיגה
              </h2>
            </div>
          </div>

          {isLicenseFormOpen ? (
            <form
              onSubmit={handleLicenseSubmit}
              className="mt-3 grid gap-2 rounded-[22px] bg-[#fafafb] p-3 sm:grid-cols-2"
            >
              <input
                value={licenseForm.memberName}
                onChange={(event) =>
                  setLicenseForm((current) => ({
                    ...current,
                    memberName: event.target.value,
                  }))
                }
                required
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none"
                placeholder="שם בן/בת משפחה"
              />
              <input
                value={licenseForm.licenseNumber}
                onChange={(event) =>
                  setLicenseForm((current) => ({
                    ...current,
                    licenseNumber: event.target.value,
                  }))
                }
                required
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none"
                placeholder="מספר רישיון"
              />
              <input
                value={licenseForm.licenseClass}
                onChange={(event) =>
                  setLicenseForm((current) => ({
                    ...current,
                    licenseClass: event.target.value,
                  }))
                }
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none"
                placeholder="דרגת רישיון"
              />
              <DateInput
                value={licenseForm.expiryDate}
                onChange={(date) =>
                  setLicenseForm((current) => ({ ...current, expiryDate: date }))
                }
                label="תוקף רישיון"
                inputClassName="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none"
              />
              <DateInput
                value={licenseForm.renewalDate}
                onChange={(date) =>
                  setLicenseForm((current) => ({ ...current, renewalDate: date }))
                }
                label="תאריך חידוש"
                inputClassName="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none"
              />
              <button
                type="submit"
                className="min-h-11 rounded-2xl bg-[#007aff] px-4 text-sm font-black text-white sm:self-end"
              >
                שמור
              </button>
            </form>
          ) : null}

          <div className="mt-3 divide-y divide-slate-200/75">
            {driverLicenses.map((license) => (
              <article
                key={license.id}
                className="grid gap-2 py-3 sm:grid-cols-[1fr_auto]"
              >
                <div className="text-right">
                  <h3 className="text-sm font-black text-[#111827]">
                    {license.memberName}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    רישיון {license.licenseNumber} · דרגה {license.licenseClass}
                  </p>
                </div>
                <div className="text-right sm:min-w-36">
                  <p className="text-xs font-black text-slate-500">
                    תוקף: {formatDate(license.expiryDate)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    חידוש: {formatDate(license.renewalDate)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="nestly-card p-3 text-right">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsFineFormOpen((current) => !current)}
              className="min-h-10 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-3 text-xs font-black text-[#111827] transition hover:bg-white"
              disabled={!selectedVehicle}
            >
              {isFineFormOpen ? "סגור" : "+ דו״ח"}
            </button>
            <div>
              <p className="text-xs font-bold text-slate-500">
                {openFineCount} פתוחים
              </p>
              <h2 className="text-base font-black text-[#111827]">דוחות</h2>
            </div>
          </div>

          {isFineFormOpen && selectedVehicle ? (
            <form
              onSubmit={handleFineSubmit}
              className="mt-3 grid gap-2 rounded-[22px] bg-[#fafafb] p-3 sm:grid-cols-2"
            >
              <input
                value={fineForm.reportNumber}
                onChange={(event) =>
                  setFineForm((current) => ({
                    ...current,
                    reportNumber: event.target.value,
                  }))
                }
                required
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none"
                placeholder="מספר דו״ח"
              />
              <input
                value={fineForm.authority}
                onChange={(event) =>
                  setFineForm((current) => ({
                    ...current,
                    authority: event.target.value,
                  }))
                }
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none"
                placeholder="רשות: משטרה / עירייה..."
              />
              <input
                value={fineForm.filingLocation}
                onChange={(event) =>
                  setFineForm((current) => ({
                    ...current,
                    filingLocation: event.target.value,
                  }))
                }
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none"
                placeholder="תיוק הדו״ח"
              />
              <input
                value={fineForm.amount}
                onChange={(event) =>
                  setFineForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
                inputMode="numeric"
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none"
                placeholder="סכום"
              />
              <DateInput
                value={fineForm.paymentDueDate}
                onChange={(date) =>
                  setFineForm((current) => ({
                    ...current,
                    paymentDueDate: date,
                  }))
                }
                label="תאריך אחרון לתשלום"
                inputClassName="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none"
              />
              <button
                type="submit"
                className="min-h-11 rounded-2xl bg-[#007aff] px-4 text-sm font-black text-white sm:self-end"
              >
                שמור דו״ח
              </button>
            </form>
          ) : null}

          {selectedVehicleFines.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-[#fafafb] p-3 text-sm font-semibold text-slate-500">
              אין דוחות לרכב הנבחר.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-slate-200/75">
              {selectedVehicleFines.map((fine) => (
                <article key={fine.id} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto]">
                  <div className="text-right">
                    <h3 className="text-sm font-black text-[#111827]">
                      דו״ח {fine.reportNumber}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {fine.authority} · {fine.filingLocation}
                    </p>
                  </div>
                  <div className="text-right sm:min-w-36">
                    <p className="text-xs font-black text-rose-700">
                      לתשלום עד {formatDate(fine.paymentDueDate)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatCurrency(fine.amount)} · {getFineStatusLabel(fine.status)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="nestly-card p-3 text-right">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black text-[#007aff]">
              תזכורות כלליות
            </p>
            <h2 className="mt-1 text-xl font-black text-[#111827]">
              מה צריך לזכור לגבי הרכב?
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              טסטים, טיפולים, ביטוחים והוצאות חשובות שלא שייכות דווקא לרכב אחד.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetReminderForm();
              setIsFormOpen((currentValue) => !currentValue);
            }}
            className="min-h-11 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-4 text-sm font-black text-[#111827] shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8b470]"
          >
            {isFormOpen ? "סגור" : "+ תזכורת רכב"}
          </button>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <div className="rounded-2xl bg-[#fff8eb] p-3 ring-1 ring-[#eadfcd]">
            <p className="text-[11px] font-black text-[#7a5212]">
              התזכורת הקרובה
            </p>
            <p className="mt-1 line-clamp-1 text-base font-black text-[#111827]">
              {nextRecord ? nextRecord.title : "אין תזכורות פתוחות"}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-600">
              {nextRecord
                ? `${getDateLabel(nextRecord.date)} · ${formatDate(nextRecord.date)}`
                : "אפשר להוסיף טסט, ביטוח או טיפול"}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eadfcd]/80">
            <p className="text-[11px] font-black text-slate-500">פתוחים</p>
            <p className="mt-1 text-xl font-black text-[#111827]">
              {openRecords.length}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-3 ring-1 ring-[#eadfcd]/80">
            <p className="text-[11px] font-black text-slate-500">
              דורשים תשומת לב
            </p>
            <p className="mt-1 text-xl font-black text-rose-700">
              {overdueCount}
            </p>
          </div>
        </div>
      </section>

      {isFormOpen && (
        <section className="nestly-card p-3 text-right">
          <div className="mb-3">
            <p className="text-xs font-bold text-slate-500">ניהול מהיר</p>
            <h2 className="text-base font-black text-[#111827]">
              {editingRecordId ? "עריכת תזכורת רכב" : "הוספת תזכורת רכב"}
            </h2>
          </div>

          <form onSubmit={handleReminderSubmit} className="grid gap-2.5 lg:grid-cols-6">
            <label className="grid gap-1 lg:col-span-2">
              <span className="text-xs font-bold text-slate-600">
                שם התזכורת
              </span>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    title: event.target.value,
                  }))
                }
                required
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400"
                placeholder="טסט, ביטוח, טיפול..."
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-bold text-slate-600">אחראי</span>
              <input
                value={form.owner}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    owner: event.target.value,
                  }))
                }
                required
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400"
                placeholder="מי מטפל?"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-bold text-slate-600">סוג</span>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    category: event.target.value,
                  }))
                }
                className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none focus:border-slate-400"
              >
                {vehicleCategories
                  .filter((category) => category !== "הכל")
                  .map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
              </select>
            </label>

            <DateInput
              value={form.date}
              onChange={(date) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  date,
                }))
              }
              required
              label="תאריך יעד"
              inputClassName="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none focus:border-slate-400"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="min-h-11 flex-1 rounded-2xl bg-[#007aff] px-4 text-sm font-black text-white transition hover:bg-[#0065d1]"
              >
                {editingRecordId ? "שמור" : "הוסף"}
              </button>
              {editingRecordId && (
                <button
                  type="button"
                  onClick={() => {
                    resetReminderForm();
                    setIsFormOpen(false);
                  }}
                  className="min-h-11 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-800 transition hover:bg-white"
                >
                  ביטול
                </button>
              )}
            </div>

            <label className="grid gap-1 lg:col-span-6">
              <span className="text-xs font-bold text-slate-600">
                פירוט קצר
              </span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    description: event.target.value,
                  }))
                }
                className="min-h-16 resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-400"
                placeholder="מסמכים להכין, מוסך, עלות משוערת..."
              />
            </label>
          </form>
        </section>
      )}

      <section className="nestly-card p-3 text-right">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={() => {
              setSearchValue("");
              setCategoryFilter("הכל");
              setStatusFilter("all");
            }}
            className="w-fit rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-white"
          >
            נקה
          </button>
          <div>
            <p className="text-xs font-bold text-slate-500">
              {visibleRecords.length} תזכורות מוצגות
            </p>
            <h2 className="text-base font-black text-[#111827]">מעקב רכבים</h2>
          </div>
        </div>

        <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_auto]">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none placeholder:text-slate-500 focus:border-slate-400"
            placeholder="חיפוש תזכורת, אחראי או סוג"
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | ModuleRecordStatus)
            }
            className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-right text-slate-950 outline-none focus:border-slate-400"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="open">פתוחים</option>
            <option value="done">בוצעו</option>
          </select>
        </div>

        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {vehicleCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category)}
              className={[
                "min-h-10 shrink-0 rounded-full px-3 text-xs font-black transition",
                categoryFilter === category
                  ? "border border-[#d8caba] bg-[#fffdf8] text-[#111827] shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-white",
              ].join(" ")}
            >
              {category}
            </button>
          ))}
        </div>

        {visibleRecords.length === 0 ? (
          <EmptyState
            className="mt-3"
            icon="🚗"
            title="אין תזכורות רכב פתוחות"
            description="טסט, טיפול, ביטוח או הוצאה חשובה שתוסיפו יופיעו כאן בזמן הנכון."
          />
        ) : (
          <div className="mt-3 divide-y divide-slate-200/75">
            {visibleRecords.map((record) => (
              <article
                key={record.id}
                className="grid gap-2 py-3 md:grid-cols-[auto_1fr_auto] md:items-center"
              >
                <div className="flex justify-end gap-2 md:order-3">
                  <button
                    type="button"
                    onClick={() => toggleStatus(record.id)}
                    className={[
                      "min-h-9 rounded-full px-3 text-xs font-black transition",
                      record.status === "done"
                        ? "bg-slate-100 text-slate-700 hover:bg-white"
                        : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100",
                    ].join(" ")}
                  >
                    {record.status === "done" ? "פתח" : "בוצע"}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(record)}
                    className="min-h-9 rounded-full bg-slate-100 px-3 text-xs font-black text-slate-700 transition hover:bg-white"
                  >
                    עריכה
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteRecord(record.id)}
                    className="min-h-9 rounded-full bg-rose-50 px-3 text-xs font-black text-rose-700 transition hover:bg-rose-100"
                  >
                    מחיקה
                  </button>
                </div>

                <div className="min-w-0 text-right md:order-2">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <span className="rounded-full bg-[#fff8eb] px-2 py-1 text-[11px] font-black text-[#7a5212]">
                      {record.category}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
                      {getStatusLabel(record.status)}
                    </span>
                  </div>
                  <h3 className="mt-1 line-clamp-1 text-base font-black text-[#111827]">
                    {record.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-slate-600">
                    {record.description}
                  </p>
                </div>

                <div className="text-right md:order-1 md:min-w-28">
                  <p
                    className={[
                      "text-sm font-black",
                      getDaysUntil(record.date) < 0
                        ? "text-rose-700"
                        : "text-[#111827]",
                    ].join(" ")}
                  >
                    {getDateLabel(record.date)}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-500">
                    {formatDate(record.date)} · {record.owner}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
