export function sanitise(memory) {
  const clean = [];
  const issues = [];

  const dirs = new Set(
    Object.keys(memory).map((key) => key.substring(0, key.lastIndexOf("/")))
  );

  dirs.forEach((dir) => {
    const keyA = `${dir}/A`;
    const keyB = `${dir}/B`;

    const valueA = memory[keyA];
    const valueB = memory[keyB];

    if (valueA == null || valueB == null) {
      issues.push({
        dataset: dir,
        type: "missing",
        missing: [
          valueA == null ? "A" : null,
          valueB == null ? "B" : null,
        ].filter(Boolean),
      });
      return;
    }

    // Non-numeric values
    if (!isFinite(valueA) || !isFinite(valueB)) {
      issues.push({
        dataset: dir,
        type: "invalid",
        reason: "non-numeric",
        values: { A: valueA, B: valueB },
      });
      return;
    }

    clean.push({
      dataset: dir,
      A: valueA,
      B: valueB,
    });
  });

  return {
    clean,
    issues,
    stats: {
      total: dirs.size,
      valid: clean.length,
      invalid: issues.length,
    },
  };
}