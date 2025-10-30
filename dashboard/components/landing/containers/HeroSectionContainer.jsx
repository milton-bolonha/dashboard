import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useHeroValidation } from "../shared/useHeroValidation";
import { useHeroWorkspace } from "../shared/useHeroWorkspace";
import { useHeroInputStates } from "../shared/useHeroInputStates";

export default function HeroSectionContainer({
  children,
  mode,
  onCreateWorkspace,
  styleMode,
}) {
  const { isSignedIn, user } = useUser();
  const { isValidUrl, normalizeUrl, validateInput } = useHeroValidation();
  const { creating, error, createGuestWorkspace, setError } =
    useHeroWorkspace();

  const fields = [
    "company",
    "companyWebsite",
    "solution",
    "researchTarget",
    "researchWebsite",
  ];
  const { inputs, inputStates, updateInputState, setInputFocus, allValid } =
    useHeroInputStates(fields, validateInput);

  // Preencher inputs com query params
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.has("rep") || params.has("solution") || params.has("target")) {
      const company = decodeURIComponent(params.get("rep") || "");
      const solution = decodeURIComponent(params.get("solution") || "");
      const researchTarget = decodeURIComponent(params.get("target") || "");

      updateInputState("company", company);
      updateInputState("solution", solution);
      updateInputState("researchTarget", researchTarget);
    }
  }, []);

  const canEnableInput = (inputName) => {
    if (inputName === "company") return true;
    if (inputName === "companyWebsite") return inputStates.company.isValid;
    if (inputName === "solution") return inputStates.companyWebsite.isValid;
    if (inputName === "researchTarget") return inputStates.solution.isValid;
    if (inputName === "researchWebsite")
      return inputStates.researchTarget.isValid;
    return false;
  };

  const validateInputs = () => {
    if (!inputs.company.trim())
      return "Please tell us which company you represent";
    if (!inputs.companyWebsite.trim())
      return "Please enter your company website";
    if (!isValidUrl(inputs.companyWebsite.trim()))
      return "Please enter a valid company website";
    if (!inputs.solution.trim()) return "Please describe what you're selling";
    if (!inputs.researchTarget.trim())
      return "Please tell us which company you want to research";
    if (!inputs.researchWebsite.trim())
      return "Please enter the company website to research";
    if (!isValidUrl(inputs.researchWebsite.trim()))
      return "Please enter a valid research website";
    return null;
  };

  const handleAction = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (mode === "create-workspace" && onCreateWorkspace) {
      try {
        await onCreateWorkspace(inputs);
      } catch (err) {
        setError(err.message);
      }
    } else if (mode === "landing") {
      if (isSignedIn && user) {
        localStorage.setItem("onboarding_context", JSON.stringify(inputs));
        window.location.href = "/dashboard?onboarding=true";
      } else {
        const context = {
          company: inputs.company,
          solution: inputs.solution,
          target: inputs.researchTarget,
          targetWebsite: normalizeUrl(inputs.researchWebsite),
        };
        await createGuestWorkspace("sales-assistant", context);
      }
    }
  };

  const handleKeyDown = (field, e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const fieldOrder = [
        "company",
        "companyWebsite",
        "solution",
        "researchTarget",
        "researchWebsite",
      ];
      const currentIndex = fieldOrder.indexOf(field);
      const nextField = fieldOrder[currentIndex + 1];

      if (nextField && canEnableInput(nextField)) {
        document.querySelector(`input[name="${nextField}"]`)?.focus();
      } else if (!nextField && allValid) {
        handleAction();
      }
    }
  };

  const handleInputChange = (field, value) => {
    updateInputState(field, value);
    setError(null);
  };

  const handleInputFocus = (field) => {
    setInputFocus(field, true);
  };

  const handleInputBlur = (field) => {
    setInputFocus(field, false);
  };

  return children({
    inputs,
    inputStates,
    creating,
    error,
    allValid,
    styleMode,
    canEnableInput,
    handleInputChange,
    handleInputFocus,
    handleInputBlur,
    handleAction,
    handleKeyDown,
    setError,
  });
}
