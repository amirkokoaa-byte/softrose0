
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
};

export const exportToExcel = (tableId: string, filename: string, title?: string, subTitle?: string) => {
  const table = document.getElementById(tableId);
  if (!table) return;

  const html = table.outerHTML;
  const header = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        table { border-collapse: collapse; width: 100%; direction: rtl; }
        th, td { border: 1px solid black; padding: 8px; text-align: center; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .header-title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="header-title">Soft Rose Modern Trade</div>
      ${title ? `<div class="header-title">${title}</div>` : ''}
      ${subTitle ? `<div>${subTitle}</div>` : ''}
      <br/>
      ${html}
    </body>
    </html>
  `;

  const url = 'data:application/vnd.ms-excel;charset=utf-8,' + encodeURIComponent(header);
  const downloadLink = document.createElement("a");
  document.body.appendChild(downloadLink);
  downloadLink.href = url;
  downloadLink.download = `${filename}.xls`;
  downloadLink.click();
  document.body.removeChild(downloadLink);
};

export const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export const formatDateRange = (start: string, end: string) => {
  return `فترة من ${start} إلى ${end}`;
};
