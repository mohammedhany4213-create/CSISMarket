function normalizeWhatsAppNumber(value) {
  if (!value) return null;
  let digits = String(value).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = "20" + digits.slice(1);
  else if (/^1[0125]\d{8}$/.test(digits)) digits = "20" + digits;
  if (!/^20(10|11|12|15)\d{8}$/.test(digits)) return null;
  return digits;
}

module.exports = { normalizeWhatsAppNumber };
