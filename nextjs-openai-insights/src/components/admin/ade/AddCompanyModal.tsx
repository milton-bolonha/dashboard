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
    placeholder: "Ex.: Acme Corp",
    type: "text",
  },
  companyWebsite: {
    label: "My company website",
    placeholder: "https://www.acme.com",
    type: "url",
  },
  solution: {
    label: "I am selling solutions for",
    placeholder: "Ex.: Revenue intelligence platform",
    type: "text",
  },
  researchTarget: {
    label: "I want to research this company",
    placeholder: "Ex.: Globex",
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

  const isFieldEnabled = (field: FieldName) => {
    const index = FIELD_ORDER.indexOf(field);
    if (index === 0) return true;
    return FIELD_ORDER.slice(0, index).every((prev) => validators[prev]);
  };

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

  const renderStatusIndicator = (field: FieldName) => {
    if (!isFieldEnabled(field)) {
      return (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E4E2FF] text-[#9A94FF]">
          •
        </span>
      );
    }
    if (validators[field]) {
      const isLast = field === FIELD_ORDER[FIELD_ORDER.length - 1];
      return (
        <button
          type="submit"
          disabled={!allValid || isSubmitting || !isLast}
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isLast && allValid
              ? "bg-[#5246E9] text-white shadow-lg transition hover:bg-[#4337d8] disabled:bg-[#B4AEFF]"
              : "bg-[#D4D1FF] text-[#5246E9]"
          }`}
        >
          {isLast ? <ArrowRight className="h-4 w-4" /> : "✓"}
        </button>
      );
    }
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4D1FF] text-[#5246E9]">
        •
      </span>
    );
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
      <div
        className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-[#D4D1FF] bg-white shadow-[0px_32px_80px_rgba(82,70,233,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#E4E2FF] bg-gradient-to-r from-[#E4E2FF] via-[#F5F4FF] to-[#FFFFFF] px-8 py-6">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#5246E9]">
              Generate new workspace
            </p>
            <h2 className="text-2xl font-semibold text-[#1F1B63]">
              Collect the target account details
            </h2>
            <p className="text-sm text-[#6B63C7]">
              These prompts mirroring the landing flow let you spin up a fresh set of
              insights without leaving o dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4D1FF] text-[#5246E9] transition hover:bg-[#ECEBFF]"
            aria-label="Fechar modal de geração"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-6">
          {FIELD_ORDER.map((field) => {
            const enabled = isFieldEnabled(field);
            const details = FIELD_DETAILS[field];
            const showError = touched[field] && !validators[field];
            return (
              <div
                key={field}
                className={`flex flex-col gap-2 rounded-2xl border px-4 py-4 transition ${
                  enabled
                    ? "border-[#D4D1FF] bg-white shadow-sm"
                    : "border-dashed border-[#E4E2FF] bg-[#F7F6FF]"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6B63C7]">
                      {details.label}
                    </label>
                    <input
                      required
                      type={details.type}
                      inputMode={details.type === "url" ? "url" : "text"}
                      value={values[field]}
                      onChange={(event) => handleChange(field, event.target.value)}
                      onBlur={() => handleBlur(field)}
                      disabled={!enabled || isSubmitting}
                      className={`mt-1 w-full border-b border-transparent bg-transparent px-1 py-2 text-sm text-[#1F1B63] placeholder-[#7C75D8] focus:border-[#5246E9] focus:outline-none ${
                        !enabled
                          ? "cursor-not-allowed text-[#A29BF3] placeholder-[#AAB0FF]"
                          : ""
                      }`}
                      placeholder={details.placeholder}
                    />
                  </div>
                  {renderStatusIndicator(field)}
                </div>
                {showError ? (
                  <p className="text-xs text-[#FF5A5F]">
                    {details.type === "url"
                      ? "Insira uma URL válida começando com http(s)://"
                      : "Preencha este campo com pelo menos 2 caracteres."}
                  </p>
                ) : null}
              </div>
            );
          })}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#B42318]">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <p className="text-xs text-[#6B63C7]">
              Ao gerar, o workspace atual será substituído pelos novos insights deste target.
            </p>
            <button
              type="submit"
              disabled={!allValid || isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-[#5246E9] px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#4337d8] disabled:cursor-not-allowed disabled:bg-[#B4AEFF]"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  <span>Gerando…</span>
                </>
              ) : (
                <>
                  <span>Gerar insights</span>
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

