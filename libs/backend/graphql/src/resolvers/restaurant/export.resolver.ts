import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PermGuard, ReqUser } from '@app/backend-authorization';
import { User, Order, Stock } from '@app/models';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createWriteStream } from 'fs';

@Injectable()
@Resolver('ExportData')
export class ExportResolver {
  private readonly logger = new Logger(ExportResolver.name);
  private readonly exportDir = join(process.cwd(), 'exports');

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    mkdir(this.exportDir, { recursive: true }).catch(() => {});
  }

  @Query('exportSalesReport')
  @UseGuards(PermGuard)
  async exportSalesReport(
    @Args('cafeId') cafeId: string,
    @Args('dateRange') dateRange: { startDate: Date; endDate: Date },
    @Args('format') format: 'csv' | 'excel' | 'pdf',
    @ReqUser() user?: User,
  ): Promise<string> {
    try {
      const { startDate, endDate } = dateRange;

      const orders = await this.orderRepository.find({
        where: {
          cafeId,
          createdAt: Between(startDate, endDate),
        },
        relations: ['items', 'payments', 'customer'],
        order: { createdAt: 'ASC' },
      });

      const salesData = orders.map(order => ({
        orderNumber: order.orderNumber,
        date: order.createdAt.toISOString(),
        customer: order.customer?.email || 'Guest',
        items: order.items?.length || 0,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        total: order.total,
        status: order.status,
        paymentMethod: order.payments?.[0]?.method || 'N/A',
      }));

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let filePath: string;

      switch (format) {
        case 'csv':
          filePath = await this.exportToCSV(salesData, `sales-report-${timestamp}.csv`);
          break;
        case 'excel':
          filePath = await this.exportToExcel(salesData, `sales-report-${timestamp}.xlsx`);
          break;
        case 'pdf':
          filePath = await this.exportToPDF(salesData, `sales-report-${timestamp}.pdf`, 'Sales Report', dateRange);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      return filePath;
    } catch (error) {
      this.logger.error(`Failed to export sales report: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Query('exportInventoryReport')
  @UseGuards(PermGuard)
  async exportInventoryReport(
    @Args('cafeId') cafeId: string,
    @Args('format') format: 'csv' | 'excel' | 'pdf',
    @ReqUser() user?: User,
  ): Promise<string> {
    try {
      const inventory = await this.stockRepository.find({
        where: { cafeId, isActive: true },
        relations: ['product'],
        order: { currentQuantity: 'ASC' },
      });

      const inventoryData = inventory.map(item => ({
        sku: item.sku || 'N/A',
        productName: item.product?.name || 'Unknown',
        category: item.category || 'N/A',
        currentQuantity: item.currentQuantity,
        reservedQuantity: item.reservedQuantity,
        availableQuantity: item.availableQuantity,
        minLevel: item.minLevel,
        maxLevel: item.maxLevel,
        reorderLevel: item.reorderLevel,
        unitCost: item.unitCost || 0,
        stockValue: item.stockValue,
        status: item.stockStatus,
      }));

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let filePath: string;

      switch (format) {
        case 'csv':
          filePath = await this.exportToCSV(inventoryData, `inventory-report-${timestamp}.csv`);
          break;
        case 'excel':
          filePath = await this.exportToExcel(inventoryData, `inventory-report-${timestamp}.xlsx`);
          break;
        case 'pdf':
          filePath = await this.exportToPDF(inventoryData, `inventory-report-${timestamp}.pdf`, 'Inventory Report');
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      return filePath;
    } catch (error) {
      this.logger.error(`Failed to export inventory report: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async exportToCSV(data: any[], filename: string): Promise<string> {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    const filePath = join(this.exportDir, filename);
    const headers = Object.keys(data[0]).map(key => ({ id: key, title: key }));

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers,
    });

    await csvWriter.writeRecords(data);
    return filePath;
  }

  private async exportToExcel(data: any[], filename: string): Promise<string> {
    const filePath = join(this.exportDir, filename);

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    XLSX.writeFile(workbook, filePath);
    return filePath;
  }

  private async exportToPDF(
    data: any[],
    filename: string,
    title: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): Promise<string> {
    const filePath = join(this.exportDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = createWriteStream(filePath);

      doc.pipe(stream);

      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();

      if (dateRange) {
        doc.fontSize(12).text(
          `Period: ${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`,
          { align: 'center' }
        );
        doc.moveDown();
      }

      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown(2);

      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const columnWidth = (doc.page.width - 100) / headers.length;

        doc.fontSize(10).font('Helvetica-Bold');
        headers.forEach((header, i) => {
          doc.text(header, 50 + i * columnWidth, doc.y, {
            width: columnWidth,
            align: 'left',
          });
        });
        doc.moveDown();
        doc.font('Helvetica');

        data.forEach((row) => {
          const y = doc.y;
          headers.forEach((header, i) => {
            doc.text(String(row[header] || ''), 50 + i * columnWidth, y, {
              width: columnWidth,
              align: 'left',
            });
          });
          doc.moveDown(0.5);
        });
      }

      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }
}
