import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportData {
  stats?: {
    avgProductivity: number;
    totalWorkHours: number;
    completedTasksCount: number;
    activeEmployees: number;
    totalEmployees: number;
  };
  auxDistribution?: Array<{
    status: string;
    hours: number;
    percentage: number;
  }>;
  departmentStats?: Array<{
    department: string;
    employeeCount: number;
    completedTasks: number;
    averageProductivity: number;
  }>;
  timeRange?: string;
  departmentFilter?: string;
}

export async function exportToExcel(data: ExportData, filename: string = 'report') {
  const workbook = new ExcelJS.Workbook();

  if (data.stats) {
    const statsSheet = workbook.addWorksheet('Key Metrics');
    statsSheet.addRow(['Metric', 'Value']);
    statsSheet.addRow(['Average Productivity', `${data.stats.avgProductivity}%`]);
    statsSheet.addRow(['Total Work Hours', data.stats.totalWorkHours]);
    statsSheet.addRow(['Completed Tasks', data.stats.completedTasksCount]);
    statsSheet.addRow(['Active Employees', data.stats.activeEmployees]);
    statsSheet.addRow(['Total Employees', data.stats.totalEmployees]);
  }

  if (data.auxDistribution && data.auxDistribution.length > 0) {
    const auxSheet = workbook.addWorksheet('AUX Distribution');
    auxSheet.addRow(['Status', 'Hours', 'Percentage']);
    data.auxDistribution.forEach(item => {
      auxSheet.addRow([
        getStatusLabel(item.status),
        item.hours,
        `${item.percentage}%`
      ]);
    });
  }

  if (data.departmentStats && data.departmentStats.length > 0) {
    const deptSheet = workbook.addWorksheet('Department Performance');
    deptSheet.addRow(['Department', 'Employees', 'Completed Tasks', 'Avg Productivity']);
    data.departmentStats.forEach(dept => {
      deptSheet.addRow([
        dept.department,
        dept.employeeCount,
        dept.completedTasks,
        `${dept.averageProductivity}%`
      ]);
    });
  }

  await workbook.xlsx.writeFile(`${filename}.xlsx`);
}

export function exportToPDF(data: ExportData, filename: string = 'report', title: string = 'Report') {
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  doc.setFontSize(20);
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  if (data.timeRange || data.departmentFilter) {
    doc.setFontSize(10);
    const filters: string[] = [];
    if (data.timeRange) {
      const timeRangeLabel = getTimeRangeLabel(data.timeRange);
      filters.push(`Time Range: ${timeRangeLabel}`);
    }
    if (data.departmentFilter && data.departmentFilter !== 'all') {
      filters.push(`Department: ${data.departmentFilter}`);
    }
    if (filters.length > 0) {
      doc.text(filters.join(' | '), pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
    }
  }

  if (data.stats) {
    doc.setFontSize(14);
    doc.text('Key Metrics', 14, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Average Productivity', `${data.stats.avgProductivity}%`],
        ['Total Work Hours', data.stats.totalWorkHours.toString()],
        ['Completed Tasks', data.stats.completedTasksCount.toString()],
        ['Active Employees', data.stats.activeEmployees.toString()],
        ['Total Employees', data.stats.totalEmployees.toString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  if (data.auxDistribution && data.auxDistribution.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('AUX Time Distribution', 14, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [['Status', 'Hours', 'Percentage']],
      body: data.auxDistribution.map(item => [
        getStatusLabel(item.status),
        item.hours.toString(),
        `${item.percentage}%`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  if (data.departmentStats && data.departmentStats.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('Department Performance', 14, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [['Department', 'Employees', 'Completed Tasks', 'Avg Productivity']],
      body: data.departmentStats.map(dept => [
        dept.department,
        dept.employeeCount.toString(),
        dept.completedTasks.toString(),
        `${dept.averageProductivity}%`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });
  }

  doc.save(`${filename}.pdf`);
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "working": return "Working on Project";
    case "ready": return "Ready";
    case "break": return "Break";
    case "personal": return "Personal";
    case "meeting": return "Meeting";
    default: return status;
  }
}

function getTimeRangeLabel(range: string): string {
  switch (range) {
    case "7": return "Last 7 Days";
    case "30": return "Last 30 Days";
    case "90": return "Last 3 Months";
    case "365": return "Last Year";
    default: return range;
  }
}