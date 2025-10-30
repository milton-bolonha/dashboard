import Image from "next/image";

export default function HeroInput({
  name,
  type = "text",
  value,
  placeholder,
  disabled,
  state,
  styleMode = "default",
  isLastInput = false,
  onValueChange,
  onFocus,
  onBlur,
  onKeyDown,
  renderIcon,
}) {
  const isTransparent =
    styleMode === "transparent" && state.isValid && !state.focused;

  const inputClasses = isTransparent
    ? "w-full px-6 pt-4 pb-8 pr-16 text-lg border rounded-xl outline-none bg-transparent border-transparent shadow-none text-black"
    : `w-full px-6 pt-4 pb-8 pr-16 text-lg border rounded-xl shadow-sm outline-none ${
        disabled
          ? "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400"
          : "bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      }`;

  // Modo transparente: mostrar texto + lápis
  if (isTransparent) {
    return (
      <div
        className="w-full px-6 pt-4 pb-8 text-lg text-black flex items-center gap-2 cursor-pointer border border-transparent rounded-xl"
        onClick={() => {
          onFocus?.();
          document.querySelector(`input[name="${name}"]`)?.focus();
        }}
      >
        <span>{value}</span>
        <Image
          src="/images/logo-mark.svg"
          alt="Edit"
          width={13}
          height={13}
          className="opacity-60 hover:opacity-100 transition-opacity"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        placeholder=""
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className={inputClasses}
      />
      <div className="absolute bottom-2 left-6 text-xs text-gray-400 pointer-events-none z-10">
        {placeholder}
      </div>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
        {renderIcon?.(name, isLastInput)}
      </div>
    </div>
  );
}
