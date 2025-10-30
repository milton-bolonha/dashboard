import { useState } from "react";

export function useHeroInputStates(fields, validateInput) {
  const [inputs, setInputs] = useState(() =>
    fields.reduce((acc, field) => ({ ...acc, [field]: "" }), {})
  );

  const [inputStates, setInputStates] = useState(() =>
    fields.reduce(
      (acc, field) => ({
        ...acc,
        [field]: { focused: false, hasContent: false, isValid: false },
      }),
      {}
    )
  );

  const updateInputState = (field, value, type = "text") => {
    setInputs((prev) => ({ ...prev, [field]: value }));
    const isValid = validateInput(value, type);
    setInputStates((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        hasContent: !!value.trim(),
        isValid,
      },
    }));
  };

  const setInputFocus = (field, focused) => {
    setInputStates((prev) => ({
      ...prev,
      [field]: { ...prev[field], focused },
    }));
  };

  const allValid =
    fields.length > 0 && fields.every((field) => inputStates[field]?.isValid);

  return {
    inputs,
    inputStates,
    updateInputState,
    setInputFocus,
    allValid,
    setInputs,
    setInputStates,
  };
}
