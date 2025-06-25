export function Card({
  children,
  title,
  subtitle,
  footer,
  variant = "default",
  className = "",
}) {
  const variants = {
    default: "bg-white border border-gray-200",
    elevated: "bg-white shadow-lg border border-gray-100",
    romantic:
      "bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200",
  };

  return (
    <div
      className={`rounded-lg overflow-hidden ${variants[variant]} ${className}`}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}

      <div className="px-6 py-4">{children}</div>

      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}
