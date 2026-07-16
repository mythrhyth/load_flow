import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(query: string, user: JwtPayload) {
    if (!query) {
      return { results: [] };
    }

    const q = query.toLowerCase();

    // 1. Scoped search for Loads
    const loadsWhere: any = {
      deletedAt: null,
      OR: [
        { loadNumber: { contains: q } },
        { origin: { contains: q } },
        { destination: { contains: q } },
        { commodity: { contains: q } },
      ],
    };

    const org = await this.prisma.organization.findUnique({ where: { id: user.organizationId } });
    if (org?.type === 'BROKER') {
      loadsWhere.brokerId = org.id;
    } else if (org?.type === 'CARRIER') {
      loadsWhere.carrierId = org.id;
    } else if (org?.type === 'SHIPPER') {
      loadsWhere.shipperId = org.id;
    }

    const loads = await this.prisma.load.findMany({
      where: loadsWhere,
      take: 10,
    });

    // 2. Search for Carriers (Only for Broker users)
    let carriers: any[] = [];
    if (org?.type === 'BROKER') {
      carriers = await this.prisma.organization.findMany({
        where: {
          type: 'CARRIER',
          name: { contains: q },
          deletedAt: null,
        },
        take: 5,
      });
    }

    // 3. Search for Shippers (Only for Broker users)
    let shippers: any[] = [];
    if (org?.type === 'BROKER') {
      shippers = await this.prisma.organization.findMany({
        where: {
          type: 'SHIPPER',
          name: { contains: q },
          deletedAt: null,
        },
        take: 5,
      });
    }

    // 4. Search for Staff (Isolated by organizationId)
    const staff = await this.prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 5,
    });

    // Map into a uniform format
    const results: any[] = [];

    loads.forEach(l => {
      results.push({
        type: 'load',
        id: l.loadNumber,
        title: `${l.loadNumber}: ${l.origin} → ${l.destination}`,
        subtitle: `Commodity: ${l.commodity} | Status: ${l.status}`,
      });
    });

    carriers.forEach(c => {
      results.push({
        type: 'carrier',
        id: c.id,
        title: c.name,
        subtitle: 'Carrier Partner Profile',
      });
    });

    shippers.forEach(s => {
      results.push({
        type: 'shipper',
        id: s.id,
        title: s.name,
        subtitle: 'Shipper Customer Profile',
      });
    });

    staff.forEach(s => {
      results.push({
        type: 'staff',
        id: s.id,
        title: s.name,
        subtitle: `Team Member (${s.email})`,
      });
    });

    return { results };
  }
}
