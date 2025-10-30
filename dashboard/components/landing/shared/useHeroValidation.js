export function useHeroValidation() {
  const isValidUrl = (url) => {
    return /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+/.test(url);
  };

  const normalizeUrl = (url) => {
    return url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "")
      .toLowerCase();
  };

  const validateInput = (value, type = "text", minChars = 3) => {
    if (!value?.trim()) return false;
    if (type === "url" && !isValidUrl(value.trim())) return false;
    if (value.trim().length < minChars) return false;
    return true;
  };

  return { isValidUrl, normalizeUrl, validateInput };
}
