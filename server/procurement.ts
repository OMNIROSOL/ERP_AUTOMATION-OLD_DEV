import { PrismaClient } from '@prisma/client';

export const getProcurementSuggestions = async (prisma: PrismaClient, supplierId: string) => {
  // 1. Get all items for this supplier (or all items if not filtered)
  const items = await prisma.item.findMany({
    include: {
      procurementItems: {
        where: { order: { supplierId } },
        orderBy: { order: { orderDate: 'desc' } },
        take: 1
      }
    }
  });

  // 2. Calculate 8-month average demand (sales)
  // We look at invoice_items in the 'sales' schema over the last 8 months
  const eightMonthsAgo = new Date();
  eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);

  const salesData = await prisma.$queryRaw`
    SELECT item_id, SUM(qty) as total_qty
    FROM sales.invoice_items ii
    JOIN sales.invoices i ON ii.invoice_id = i.id
    WHERE i.issue_date >= ${eightMonthsAgo}
    GROUP BY item_id
  ` as any[];

  const suggestions = items.map(item => {
    const itemSales = salesData.find(s => s.item_id === item.id);
    const totalQty = itemSales ? parseFloat(itemSales.total_qty) : 0;
    const avgMonthlyDemand = totalQty / 8;
    
    // Suggestion logic: maintain 3 months of buffer stock
    const suggestedQty = Math.max(0, (avgMonthlyDemand * 3)); 

    return {
      itemId: item.id,
      itemName: item.itemName,
      itemCode: item.itemCode,
      avgMonthlyDemand,
      suggestedQty: Math.ceil(suggestedQty),
      lastPurchasePrice: item.procurementItems[0]?.unitPrice || item.purchase_price
    };
  });

  return suggestions;
};

export const calculateETA = (orderDate: Date, leadTime: any) => {
  if (!leadTime) return null;
  const totalDays = 
    (leadTime.processingDays || 0) + 
    (leadTime.productionDays || 0) + 
    (leadTime.shippingDays || 0) + 
    (leadTime.roadTransportDays || 0);
    
  const eta = new Date(orderDate);
  eta.setDate(eta.getDate() + totalDays);
  return eta;
};
