export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    console.warn("Dışa aktarılacak veri yok");
    return;
  }

  // CSV başlıklarını oluştur
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          // Virgül içeren değerleri tırnak içine al
          if (typeof value === "string" && value.includes(",")) {
            return `"${value}"`;
          }
          return value ?? "";
        })
        .join(",")
    )
  ].join("\n");

  // Blob oluştur ve indir
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data: any[], filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], {
    type: "application/json;charset=utf-8;"
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.json`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
