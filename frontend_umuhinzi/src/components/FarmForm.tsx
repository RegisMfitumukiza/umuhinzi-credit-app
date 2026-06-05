import { useEffect, useState } from "react";
import { emptyFarmValues, type FarmFormValues } from "../types/farm";

type Props = {
  initialValues?: FarmFormValues;
  onSubmit: (values: FarmFormValues) => Promise<void> | void;
  submitLabel: string;
};

const requiredFields: Array<keyof FarmFormValues> = [
  "name",
  "landSize",
  "soilType",
  "province",
  "district",
  "sector",
  "cell",
  "village",
];

export const FarmForm = ({ initialValues, onSubmit, submitLabel }: Props) => {
  const [values, setValues] = useState<FarmFormValues>(initialValues ?? emptyFarmValues);
  const [errors, setErrors] = useState<Partial<Record<keyof FarmFormValues, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
    }
  }, [initialValues]);

  const updateField = <K extends keyof FarmFormValues>(field: K, value: FarmFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FarmFormValues, string>> = {};

    requiredFields.forEach((field) => {
      if (!String(values[field]).trim()) {
        nextErrors[field] = "This field is required";
      }
    });

    if (values.name.trim().length < 3) {
      nextErrors.name = "Name must be at least 3 characters";
    }

    if (Number(values.landSize) <= 0 || Number.isNaN(Number(values.landSize))) {
      nextErrors.landSize = "Land size must be a positive number";
    }

    if (values.latitude && Math.abs(Number(values.latitude)) > 90) {
      nextErrors.latitude = "Latitude must be between -90 and 90";
    }

    if (values.longitude && Math.abs(Number(values.longitude)) > 180) {
      nextErrors.longitude = "Longitude must be between -180 and 180";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClass = "mt-1 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-panel">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-stone-700">
          Farm name
          <input className={fieldClass} value={values.name} onChange={(event) => updateField("name", event.target.value)} />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </label>
        <label className="text-sm font-medium text-stone-700">
          Land size
          <input type="number" className={fieldClass} value={values.landSize} onChange={(event) => updateField("landSize", event.target.value)} />
          {errors.landSize && <p className="mt-1 text-xs text-red-600">{errors.landSize}</p>}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-stone-700">
          Land unit
          <select className={fieldClass} value={values.landUnit} onChange={(event) => updateField("landUnit", event.target.value as FarmFormValues["landUnit"])}>
            <option value="HECTARE">HECTARE</option>
            <option value="ACRE">ACRE</option>
          </select>
        </label>
        <label className="text-sm font-medium text-stone-700">
          Ownership type
          <select className={fieldClass} value={values.ownershipType} onChange={(event) => updateField("ownershipType", event.target.value as FarmFormValues["ownershipType"])}>
            <option value="OWNED">OWNED</option>
            <option value="RENTED">RENTED</option>
            <option value="FAMILY_LAND">FAMILY_LAND</option>
            <option value="COOPERATIVE_LAND">COOPERATIVE_LAND</option>
          </select>
        </label>
        <label className="text-sm font-medium text-stone-700">
          Status
          <select className={fieldClass} value={values.status} onChange={(event) => updateField("status", event.target.value as FarmFormValues["status"])}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </label>
      </div>

      <label className="text-sm font-medium text-stone-700">
        Soil type
        <input className={fieldClass} value={values.soilType} onChange={(event) => updateField("soilType", event.target.value)} />
        {errors.soilType && <p className="mt-1 text-xs text-red-600">{errors.soilType}</p>}
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-stone-700">
          Province
          <input className={fieldClass} value={values.province} onChange={(event) => updateField("province", event.target.value)} />
        </label>
        <label className="text-sm font-medium text-stone-700">
          District
          <input className={fieldClass} value={values.district} onChange={(event) => updateField("district", event.target.value)} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-stone-700">
          Sector
          <input className={fieldClass} value={values.sector} onChange={(event) => updateField("sector", event.target.value)} />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Cell
          <input className={fieldClass} value={values.cell} onChange={(event) => updateField("cell", event.target.value)} />
        </label>
        <label className="text-sm font-medium text-stone-700">
          Village
          <input className={fieldClass} value={values.village} onChange={(event) => updateField("village", event.target.value)} />
        </label>
      </div>

      {/* <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-stone-700">
          Latitude
          <input className={fieldClass} value={values.latitude} onChange={(event) => updateField("latitude", event.target.value)} />
          {errors.latitude && <p className="mt-1 text-xs text-red-600">{errors.latitude}</p>}
        </label>
        <label className="text-sm font-medium text-stone-700">
          Longitude
          <input className={fieldClass} value={values.longitude} onChange={(event) => updateField("longitude", event.target.value)} />
          {errors.longitude && <p className="mt-1 text-xs text-red-600">{errors.longitude}</p>}
        </label>
      </div> */}

      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
};
