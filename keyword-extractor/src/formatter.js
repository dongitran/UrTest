function formatForMonaco(keywords) {
  return keywords.map((keyword) => {
    const insertParts = [keyword.name];

    for (let i = 0; i < keyword.args.length; i++) {
      const arg = keyword.args[i];

      if (arg.includes("=")) {
        const [argName, defaultValue] = arg.split("=", 2);
        const cleanArgName = argName.replace(/[${}]/g, "").trim();
        insertParts.push(`\${${i + 1}:${cleanArgName}=${defaultValue.trim()}}`);
      } else if (arg.startsWith("@{")) {
        const cleanArgName = arg.replace(/[@{}]/g, "").trim();
        insertParts.push(`\${${i + 1}:@{${cleanArgName}}}`);
      } else if (arg.startsWith("&{")) {
        const cleanArgName = arg.replace(/[&{}]/g, "").trim();
        insertParts.push(`\${${i + 1}:&{${cleanArgName}}}`);
      } else {
        const cleanArgName = arg.replace(/[${}]/g, "").trim();
        insertParts.push(`\${${i + 1}:${cleanArgName}}`);
      }
    }

    const insertText = insertParts.join("    ");
    const category = determineCategory(keyword.source);

    return {
      label: keyword.name,
      kind: "Function",
      insertText: insertText,
      documentation: `${keyword.documentation || ""}\n\nSource: ${
        keyword.source
      }`,
      source: keyword.source,
      category: category,
    };
  });
}

function determineCategory(sourcePath) {
  if (sourcePath.includes("/core/")) return "Core";
  if (sourcePath.includes("/utils/")) return "Utils";
  if (sourcePath.includes("/resources/")) return "Resources";
  if (sourcePath.includes("/tests/")) return "Tests";
  return "Other";
}

module.exports = {
  formatForMonaco,
};
