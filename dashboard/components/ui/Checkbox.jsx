"use client";

import { useState } from "react";
import { CheckIcon } from "@heroicons/react/24/solid";

const Checkbox = ({
  id,
  checked: initialChecked,
  onCheckedChange,
  children,
}) => {
  const [isChecked, setIsChecked] = useState(initialChecked || false);

  const handleClick = () => {
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);
    if (onCheckedChange) {
      onCheckedChange(newCheckedState);
    }
  };

  return (
    <div className="flex items-center">
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={isChecked}
        onClick={handleClick}
        className={`flex h-4 w-4 items-center justify-center rounded-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
          isChecked
            ? "bg-blue-600 border-blue-600"
            : "bg-white dark:bg-gray-800"
        }`}
      >
        {isChecked && <CheckIcon className="h-3 w-3 text-white" />}
      </button>
      {children}
    </div>
  );
};

export { Checkbox };
