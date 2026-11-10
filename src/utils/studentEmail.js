function isAllowedStudentEmail(email, configuredDomains = "") {
  const domains = configuredDomains.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (!domains.length) return true;
  const domain = String(email).toLowerCase().split("@").pop();
  return domains.includes(domain);
}

module.exports = { isAllowedStudentEmail };
