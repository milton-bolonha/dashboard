"use client";

import { useMemo, useState } from "react";
import { ArrowRight, X } from "lucide-react";

type FieldName =
  | "company"
  | "companyWebsite"
  | "solution"
  | "researchTarget"
  | "researchWebsite";

interface AddCompanyModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    company: string;
    companyWebsite: string;
    solution: string;
    researchTarget: string;
    researchWebsite: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

const FIELD_ORDER: FieldName[] = [
  "company",
  "companyWebsite",
  "solution",
  "researchTarget",
  "researchWebsite",
];

const FIELD_DETAILS: Record<
  FieldName,
  { label: string; placeholder: string; type: "text" | "url" }
> = {
  company: {
    label: "I am a sales rep at",
    placeholder: "e.g., Acme Corp",
    type: "text",
  },
  companyWebsite: {
    label: "My company website",
    placeholder: "https://www.acme.com",
    type: "url",
  },
  solution: {
    label: "I am selling solutions for",
    placeholder: "e.g., Revenue intelligence platform",
    type: "text",
  },
  researchTarget: {
    label: "I want to research this company",
    placeholder: "e.g., Globex",
    type: "text",
  },
  researchWebsite: {
    label: "Company website to research",
    placeholder: "https://www.globex.com",
    type: "url",
  },
};

const DEFAULT_VALUES: Record<FieldName, string> = {
  company: "",
  companyWebsite: "",
  solution: "",
  researchTarget: "",
  researchWebsite: "",
};

export function AddCompanyModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AddCompanyModalProps) {
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    company: false,
    companyWebsite: false,
    solution: false,
    researchTarget: false,
    researchWebsite: false,
  });
  const [error, setError] = useState<string | null>(null);

  const validators = useMemo(() => {
    const isValidUrl = (value: string) => {
      if (!value.trim()) return false;
      try {
        const normalized = value.startsWith("http") ? value : `https://${value}`;
        new URL(normalized);
        return true;
      } catch {
        return false;
      }
    };

    return {
      company: values.company.trim().length > 1,
      companyWebsite: isValidUrl(values.companyWebsite),
      solution: values.solution.trim().length > 1,
      researchTarget: values.researchTarget.trim().length > 1,
      researchWebsite: isValidUrl(values.researchWebsite),
    } as Record<FieldName, boolean>;
  }, [values]);

  const allValid = useMemo(
    () => FIELD_ORDER.every((field) => validators[field]),
    [validators],
  );

  if (!open) return null;

  const handleChange = (field: FieldName, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: FieldName) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!allValid) {
      setError("Fill in every field before continuing.");
      setTouched({
        company: true,
        companyWebsite: true,
        solution: true,
        researchTarget: true,
        researchWebsite: true,
      });
      return;
    }

    try {
      await onSubmit(values);
      setValues(DEFAULT_VALUES);
      setTouched({
        company: false,
        companyWebsite: false,
        solution: false,
        researchTarget: false,
        researchWebsite: false,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We couldn't start the generation. Try again shortly.",
      );
    }
  };

  const handleRequestClose = () => {
    setValues(DEFAULT_VALUES);
    setTouched({
      company: false,
      companyWebsite: false,
      solution: false,
      researchTarget: false,
      researchWebsite: false,
    });
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm" onClick={handleRequestClose}>
      <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-[#e4e4e4] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.2)]" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 px-8 py-6">
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#9a9a9a]">Generate new workspace</p>
            <h2 className="text-2xl font-semibold text-[#1f1f1f]">Collect the target account details</h2>
            <p className="text-sm text-[#6f6f6f]">
              These prompts mirror the landing flow so you can spin up a fresh set of insights without leaving the dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4e4e4] text-[#444] transition hover:bg-[#f5f5f5]"
            aria-label="Close workspace generation modal"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-6">
          {FIELD_ORDER.map((field) => {
            const details = FIELD_DETAILS[field];
            const showError = touched[field] && !validators[field];
            return (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8a8a8a]">
                  {details.label}
                </label>
                <input
                  required
                  type={details.type}
                  inputMode={details.type === "url" ? "url" : "text"}
                  value={values[field]}
                  onChange={(event) => handleChange(field, event.target.value)}
                  onBlur={() => handleBlur(field)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-[#e4e4e4] bg-white px-3 py-2 text-sm text-[#1f1f1f] placeholder:text-[#a1a1a1] focus:border-black focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-[#f5f5f5]"
                  placeholder={details.placeholder}
                />
                {showError ? (
                  <p className="text-xs text-[#FF5A5F]">
                    {details.type === "url"
                      ? "Enter a valid URL starting with http(s)://"
                      : "Provide at least 2 characters for this field."}
                  </p>
                ) : null}
              </div>
            );
          })}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#b42318]">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <p className="text-xs text-[#6f6f6f]">
              Generating a workspace replaces the current insights with this target’s results.
            </p>
            <button
              type="submit"
              disabled={!allValid || isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:bg-[#9e9e9e]"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white border-r-2 border-transparent" />
                  <span>Generating…</span>
                </>
              ) : (
                <>
                  <span>Generate insights</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

