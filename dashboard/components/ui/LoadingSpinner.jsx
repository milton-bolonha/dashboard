// components/ui/LoadingSpinner.jsx
export function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex items-center space-x-2 animate-pulse">
      <div className="text-2xl font-semibold text-gray-400">{text}</div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
  );
}
