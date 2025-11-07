"use client";

import { useMemo, useState } from "react";

interface ClassicHeroFormProps {
  isSubmitting: boolean;
  onSubmit: (payload: {
    company: string;
    companyWebsite: string;
    solution: string;
    researchTarget: string;
    researchWebsite: string;
  }) => Promise<void>;
  onReset?: () => Promise<void>;
}

const FIELD_CONFIG = [
  {
    name: "company",
    label: "I am a sales rep at",
    type: "text",
  },
  {
    name: "companyWebsite",
    label: "My company website (e.g., www.microsoft.com)",
    type: "url",
  },
  {
    name: "solution",
    label: "I am selling solutions for",
    type: "text",
  },
  {
    name: "researchTarget",
    label: "I want to research this company",
    type: "text",
  },
  {
    name: "researchWebsite",
    label: "Company website to research (e.g., www.tesla.com)",
    type: "url",
  },
] as const;

type InputState = Record<(typeof FIELD_CONFIG)[number]["name"], string>;

type TouchedState = Record<(typeof FIELD_CONFIG)[number]["name"], boolean>;

export function ClassicHeroForm({ isSubmitting, onSubmit, onReset }: ClassicHeroFormProps) {
  const [values, setValues] = useState<InputState>({
    company: "",
    companyWebsite: "",
    solution: "",
    researchTarget: "",
    researchWebsite: "",
  });
  const [touched, setTouched] = useState<TouchedState>({
    company: false,
    companyWebsite: false,
    solution: false,
    researchTarget: false,
    researchWebsite: false,
  });
  const [error, setError] = useState<string | null>(null);

  const canEnableField = useMemo(() => {
    return {
      company: true,
      companyWebsite: Boolean(values.company.trim()),
      solution: Boolean(values.companyWebsite.trim()),
      researchTarget: Boolean(values.solution.trim()),
      researchWebsite: Boolean(values.researchTarget.trim()),
    } satisfies Record<(typeof FIELD_CONFIG)[number]["name"], boolean>;
  }, [values]);

  const allValid = useMemo(() => {
    return (
      values.company.trim().length > 1 &&
      values.companyWebsite.trim().length > 6 &&
      values.solution.trim().length > 1
    );
  }, [values]);

  const handleChange = (name: keyof InputState, next: string) => {
    setValues((prev) => ({ ...prev, [name]: next }));
  };

  const handleBlur = (name: keyof InputState) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const hasFieldError = (name: keyof InputState) => {
    if (!touched[name]) return false;
    if (name === "companyWebsite" || name === "researchWebsite") {
      const value = values[name].trim();
      if (!value) return false;
      try {
        new URL(value.startsWith("http") ? value : `https://${value}`);
      } catch {
        return true;
      }
    }
    return values[name].trim().length === 0;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!allValid) {
      setError("Preencha pelo menos a empresa, site e solução antes de continuar.");
      setTouched({
        company: true,
        companyWebsite: true,
        solution: true,
        researchTarget: touched.researchTarget,
        researchWebsite: touched.researchWebsite,
      });
      return;
    }

    try {
      await onSubmit(values);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Falha ao gerar insights";
      setError(message);
    }
  };

  return (
    <div className="iaforms-classic">
      <section
        className="flex h-full items-center justify-center"
        style={{ backgroundColor: "#fcfcf9" }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes bouncePulse {
            0% { transform: translateY(0); }
            5% { transform: translateY(-8px); }
            10% { transform: translateY(0); }
            15% { transform: translateY(-4px); }
            20% { transform: translateY(0); }
            100% { transform: translateY(0); }
          }
        `,
          }}
        />
        <div className="mx-auto max-w-5xl px-2 text-center sm:px-6 lg:px-4">
          <h1 className="mt-30 mb-4 text-2xl font-bold tracking-tight text-black sm:text-3xl lg:text-4xl">
            Smarter Research. Faster Outreach. More Selling
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
            WebApp is your personal research assistant that works even when you sleep
          </p>

          <div className="mb-8 space-y-4">
            {FIELD_CONFIG.map((field) => {
              const enabled = canEnableField[field.name];
              return (
                <div
                  key={field.name}
                  className={`relative mx-auto max-w-2xl ${!enabled ? "opacity-70" : ""}`}
                >
                  <input
                    name={field.name}
                    type={field.type}
                    value={values[field.name]}
                    onChange={(event) => handleChange(field.name, event.target.value)}
                    onBlur={() => handleBlur(field.name)}
                    disabled={!enabled || isSubmitting}
                    className={`w-full rounded-xl px-6 pt-4 pb-8 pr-16 text-lg shadow-sm outline-none transition
                      ${
                        !enabled
                          ? "cursor-not-allowed border border-gray-200 bg-gray-50 text-gray-400"
                          : "border border-gray-200 bg-white text-black focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      }
                    `}
                    placeholder=""
                  />
                  <div className="pointer-events-none absolute bottom-2 left-6 z-10 text-xs text-gray-400">
                    {field.label}
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 transform">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                        enabled ? "bg-gray-300" : "bg-gray-200"
                      }`}
                    >
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  </div>
                  {hasFieldError(field.name) && (
                    <p className="mt-2 text-left text-sm text-red-500">
                      Verifique o valor informado.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mb-6 text-lg text-black">
            Ask WebApp research your whole territory for you
          </p>

          {error ? (
            <div className="mx-auto mb-6 max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Connect CRM</span>
                  <ArrowRightIcon />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Upload CSV</span>
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={onReset}
              disabled={isSubmitting}
              className="text-xs text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              🗑️ Reset Session
            </button>
          </div>
        </div>
      </section>

      {isSubmitting ? (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-white/70">
          <div className="flex items-center space-x-3 rounded-xl border border-gray-200 bg-white px-6 py-4 text-sm font-medium text-gray-600 shadow-lg">
            <span className="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-500" />
            <span>Gerando insights...</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
