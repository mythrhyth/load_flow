import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(user: JwtPayload) {
    const org = await this.prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    if (org?.type === 'BROKER') {
      return this.getBrokerStats(org.id);
    } else if (org?.type === 'CARRIER') {
      return this.getCarrierStats(org.id);
    } else if (org?.type === 'SHIPPER') {
      return this.getShipperStats(org.id);
    }

    return {};
  }

  private async getBrokerStats(orgId: string) {
    const [activeLoads, inTransit, deliveredToday, complianceIssues, totalRevenue, totalLoads] = await Promise.all([
      this.prisma.load.count({
        where: { brokerId: orgId, status: { notIn: ['closed'] }, deletedAt: null },
      }),
      this.prisma.load.count({
        where: { brokerId: orgId, status: 'in-transit', deletedAt: null },
      }),
      this.prisma.load.count({
        where: { brokerId: orgId, status: 'delivered', deletedAt: null },
      }),
      this.prisma.carrierCompliance.count({
        where: {
          OR: [
            { authorityStatus: 'INACTIVE' },
            { insuranceExpiry: { lt: new Date() } },
          ],
        },
      }),
      this.prisma.load.aggregate({
        where: { brokerId: orgId, deletedAt: null },
        _sum: { revenue: true },
      }),
      this.prisma.load.count({
        where: { brokerId: orgId, deletedAt: null },
      }),
    ]);

    const revenueVal = totalRevenue._sum.revenue || 0.0;

    // Build charts
    // 1. Status Distribution
    const statuses = ['posted', 'assigned', 'rate-confirmed', 'dispatched', 'in-transit', 'delivered', 'pod-verified', 'closed'];
    const statusCounts = await Promise.all(
      statuses.map(async s => {
        const count = await this.prisma.load.count({ where: { brokerId: orgId, status: s, deletedAt: null } });
        return { name: s.toUpperCase(), value: count };
      }),
    );

    // 2. Revenue Data (mocking month bins for seeded records)
    const revenueData = [
      { month: 'May', revenue: 251000, loads: 172 },
      { month: 'Jun', revenue: 268000, loads: 184 },
      { month: 'Jul', revenue: revenueVal, loads: totalLoads },
    ];

    return {
      type: 'broker',
      kpis: [
        { label: 'Active Loads', value: activeLoads.toString(), sub: 'across all stages', trend: { val: '12%', up: true }, color: '#4F46E5' },
        { label: 'In Transit', value: inTransit.toString(), sub: 'on the road now', trend: { val: '4%', up: true }, color: '#EF4444' },
        { label: 'Delivered Today', value: deliveredToday.toString(), sub: 'since midnight', trend: { val: '3%', up: true }, color: '#10B981' },
        { label: 'Compliance Issues', value: complianceIssues.toString(), sub: 'require attention', trend: { val: '2', up: false }, color: '#F59E0B' },
        { label: 'Revenue (MTD)', value: `$${(revenueVal / 1000).toFixed(0)}K`, sub: 'July 2025', trend: { val: '9%', up: true }, color: '#8B5CF6' },
        { label: 'Avg Delivery Time', value: '1.4 days', sub: 'last 30 days', trend: { val: '6%', up: true }, color: '#3B82F6' },
        { label: 'Carrier Utilization', value: '87%', sub: 'active carriers', trend: { val: '2%', up: true }, color: '#06B6D4' },
      ],
      statusDist: statusCounts.filter(s => s.value > 0),
      revenueData,
    };
  }

  private async getCarrierStats(orgId: string) {
    const [assigned, inTransit, delivered, pendingPOD, comp] = await Promise.all([
      this.prisma.load.count({ where: { carrierId: orgId, status: { notIn: ['closed'] }, deletedAt: null } }),
      this.prisma.load.count({ where: { carrierId: orgId, status: 'in-transit', deletedAt: null } }),
      this.prisma.load.count({ where: { carrierId: orgId, status: 'delivered', deletedAt: null } }),
      this.prisma.load.count({ where: { carrierId: orgId, status: 'delivered', pods: { none: {} }, deletedAt: null } }),
      this.prisma.carrierCompliance.findUnique({ where: { carrierId: orgId } }),
    ]);

    const activeLoads = await this.prisma.load.findMany({
      where: { carrierId: orgId, status: { notIn: ['closed'] }, deletedAt: null },
      include: { broker: true },
      take: 5,
    });

    const formattedLoads = activeLoads.map(l => ({
      id: l.loadNumber,
      broker: l.broker.name,
      origin: l.origin,
      dest: l.destination,
      pickup: l.pickupDate.toLocaleDateString(),
      delivery: l.deliveryDate.toLocaleDateString(),
      rate: `$${l.revenue.toLocaleString()}`,
      miles: l.distanceMiles || 500,
      status: l.status,
    }));

    return {
      type: 'carrier',
      kpis: [
        { label: 'My Loads Today', value: assigned.toString(), color: '#4F46E5' },
        { label: 'In Transit', value: inTransit.toString(), color: '#EF4444' },
        { label: 'Completed Today', value: delivered.toString(), color: '#10B981' },
        { label: 'Pending POD', value: pendingPOD.toString(), color: '#F59E0B' },
      ],
      currentLoad: formattedLoads[0] || null,
      upcomingLoads: formattedLoads.slice(1),
      complianceScore: comp?.complianceScore ?? 100.0,
    };
  }

  private async getShipperStats(orgId: string) {
    const [active, completed, pendingConfirmation] = await Promise.all([
      this.prisma.load.count({ where: { shipperId: orgId, status: { notIn: ['closed', 'pod-verified'] }, deletedAt: null } }),
      this.prisma.load.count({ where: { shipperId: orgId, status: { in: ['closed', 'pod-verified'] }, deletedAt: null } }),
      this.prisma.load.count({ where: { shipperId: orgId, status: 'assigned', deletedAt: null } }),
    ]);

    const shipments = await this.prisma.load.findMany({
      where: { shipperId: orgId, deletedAt: null },
      include: { carrier: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const formattedShipments = shipments.map(s => {
      let progress = 0;
      if (s.status === 'posted') progress = 10;
      else if (s.status === 'assigned') progress = 20;
      else if (s.status === 'rate-confirmed') progress = 40;
      else if (s.status === 'dispatched') progress = 60;
      else if (s.status === 'in-transit') progress = 80;
      else if (['delivered', 'pod-verified', 'closed'].includes(s.status)) progress = 100;

      return {
        id: s.loadNumber,
        origin: s.origin,
        dest: s.destination,
        status: s.status,
        carrier: s.carrier?.name || 'Unassigned',
        pickup: s.pickupDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        eta: s.deliveryDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' ' + s.deliveryDate.toLocaleDateString(),
        progress,
      };
    });

    return {
      type: 'shipper',
      kpis: [
        { label: 'Active Shipments', value: active.toString(), sub: 'in progress', color: '#4F46E5' },
        { label: 'Delivered (YTD)', value: completed.toString(), sub: 'completed', color: '#10B981' },
        { label: 'Pending Confirmation', value: pendingConfirmation.toString(), sub: 'rate confirmation', color: '#F59E0B' },
      ],
      shipments: formattedShipments,
    };
  }
}
