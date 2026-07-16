import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreateLoadDto } from './dto/create-load.dto';
import { UpdateLoadDto } from './dto/update-load.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class LoadsService {
  constructor(private prisma: PrismaService) {}

  private async checkLoadScope(load: any, user: JwtPayload) {
    const isBroker = load.brokerId === user.organizationId;
    const isCarrier = load.carrierId === user.organizationId;
    const isShipper = load.shipperId === user.organizationId;

    if (!isBroker && !isCarrier && !isShipper) {
      throw new ForbiddenException('You do not have access to this load');
    }
  }

  async create(dto: CreateLoadDto, user: JwtPayload) {
    // 1. Determine broker and shipper IDs
    let brokerId = '';
    let shipperId = '';

    const org = await this.prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    if (org?.type === 'SHIPPER') {
      shipperId = org.id;
      // Assign to the first broker org we find
      const firstBroker = await this.prisma.organization.findFirst({
        where: { type: 'BROKER' },
      });
      if (!firstBroker) {
        throw new BadRequestException('No broker organization available');
      }
      brokerId = firstBroker.id;
    } else {
      brokerId = user.organizationId;
      if (dto.shipperId) {
        shipperId = dto.shipperId;
      } else {
        const firstShipper = await this.prisma.organization.findFirst({
          where: { type: 'SHIPPER' },
        });
        if (!firstShipper) {
          throw new BadRequestException('No shipper organization available');
        }
        shipperId = firstShipper.id;
      }
    }

    // 2. Generate sequential load number
    const count = await this.prisma.load.count();
    const loadNumber = `LD-${2857 + count}`;

    // 3. Calculate distance and rate per mile
    const distanceMiles = 100 + Math.floor(Math.random() * 900);
    const revenue = dto.equipment === 'reefer' ? distanceMiles * 4.12 : distanceMiles * 3.5;
    const ratePerMile = parseFloat((revenue / distanceMiles).toFixed(2));

    // 4. Create Load
    const load = await this.prisma.load.create({
      data: {
        loadNumber,
        shipperId,
        brokerId,
        origin: dto.origin,
        originAddress: dto.originAddress,
        destination: dto.destination,
        destinationAddress: dto.destinationAddress,
        pickupDate: new Date(dto.pickupDate),
        pickupWindow: dto.pickupWindow,
        deliveryDate: new Date(dto.deliveryDate),
        deliveryWindow: dto.deliveryWindow,
        commodity: dto.commodity,
        weight: dto.weight,
        declaredValue: dto.declaredValue,
        temperature: dto.temperature,
        equipment: dto.equipment,
        notes: dto.notes,
        status: 'posted',
        priority: dto.weight > 40000 ? 'high' : 'medium',
        revenue,
        distanceMiles,
        ratePerMile,
        createdBy: user.userId,
        updatedBy: user.userId,
      },
    });

    // 5. Add initial timeline event
    await this.prisma.shipmentTimeline.create({
      data: {
        loadId: load.id,
        status: 'posted',
        userId: user.userId,
        note: `Load created by ${user.name}`,
      },
    });

    // 6. Log audit log
    await this.prisma.auditLog.create({
      data: {
        userId: user.userId,
        organizationId: user.organizationId,
        action: 'Created new load',
        objectType: 'LOAD',
        objectId: load.loadNumber,
        newValue: JSON.stringify(load),
      },
    });

    return load;
  }

  async findAll(user: JwtPayload, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    // Scoping by user organization type
    const org = await this.prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    if (org?.type === 'BROKER') {
      where.brokerId = org.id;
    } else if (org?.type === 'CARRIER') {
      where.carrierId = org.id;
    } else if (org?.type === 'SHIPPER') {
      where.shipperId = org.id;
    }

    // Additional filters
    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { loadNumber: { contains: query.search } },
        { origin: { contains: query.search } },
        { destination: { contains: query.search } },
        { commodity: { contains: query.search } },
        { shipper: { name: { contains: query.search } } },
      ];
    }

    const [total, loads] = await Promise.all([
      this.prisma.load.count({ where }),
      this.prisma.load.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          shipper: true,
          carrier: {
            include: { compliance: true },
          },
          broker: true,
          timeline: {
            include: { user: { select: { name: true } } },
            orderBy: { timestamp: 'asc' },
          },
          rateConfirmations: {
            orderBy: { versionNumber: 'desc' },
          },
          pods: true,
        },
      }),
    ]);

    return {
      loads: loads.map(l => ({
        ...l,
        id: l.loadNumber, // Map loadNumber as ID for frontend compatibility
        dbId: l.id,
        shipper: l.shipper,
        carrier: l.carrier || null,
        broker: l.broker,
        equipment: l.equipment === 'reefer' ? `Reefer 53'` : l.equipment === 'flatbed' ? `Flatbed 48'` : `Dry Van 53'`,
        equipmentType: l.equipment === 'reefer' ? `Reefer 53'` : l.equipment === 'flatbed' ? `Flatbed 48'` : `Dry Van 53'`,
        pickup: l.pickupDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dest: l.destination,
        compliance: l.carrierId ? 'compliant' : 'pending',
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: JwtPayload) {
    // Find load by UUID or loadNumber (e.g. "LD-2847")
    const load = await this.prisma.load.findFirst({
      where: {
        OR: [
          { id: id },
          { loadNumber: id },
        ],
        deletedAt: null,
      },
      include: {
        shipper: true,
        broker: true,
        carrier: {
          include: {
            compliance: true,
          },
        },
        timeline: {
          include: {
            user: { select: { name: true } },
          },
          orderBy: { timestamp: 'asc' },
        },
        rateConfirmations: {
          orderBy: { versionNumber: 'desc' },
        },
        pods: true,
      },
    });

    if (!load) {
      throw new NotFoundException(`Load ${id} not found`);
    }

    // Verify scoping
    await this.checkLoadScope(load, user);

    return load;
  }

  async update(id: string, dto: UpdateLoadDto, user: JwtPayload) {
    const load = await this.prisma.load.findFirst({
      where: {
        OR: [
          { id: id },
          { loadNumber: id },
        ],
      },
      include: {
        carrier: {
          include: {
            compliance: true,
          },
        },
      },
    });

    if (!load) {
      throw new NotFoundException(`Load ${id} not found`);
    }

    await this.checkLoadScope(load, user);

    const prevValue = JSON.stringify(load);
    const updateData: any = {
      updatedBy: user.userId,
    };

    // 1. Handle Carrier Assignment & Compliance evaluation
    if (dto.carrierId !== undefined && dto.carrierId !== load.carrierId) {
      if (dto.carrierId) {
        const carrier = await this.prisma.organization.findUnique({
          where: { id: dto.carrierId },
          include: { compliance: true },
        });

        if (!carrier || carrier.type !== 'CARRIER') {
          throw new BadRequestException('Invalid carrier organization ID');
        }

        // Automatic compliance evaluation
        const comp = carrier.compliance;
        let isCompliant = true;
        let rejectReason = '';

        if (!comp) {
          isCompliant = false;
          rejectReason = 'Compliance record missing';
        } else {
          if (comp.authorityStatus !== 'ACTIVE') {
            isCompliant = false;
            rejectReason = 'Carrier operating authority is inactive';
          }
          if (comp.insuranceExpiry && new Date(comp.insuranceExpiry) < new Date()) {
            isCompliant = false;
            rejectReason = 'Carrier liability insurance has expired';
          }
        }

        // Enforce compliance block
        if (!isCompliant) {
          const hasOverride = user.permissions.includes('compliance.override');
          if (!hasOverride) {
            throw new BadRequestException(`Carrier compliance check failed: ${rejectReason}. Requires compliance override permission to proceed.`);
          } else {
            // Log compliance override action
            await this.prisma.auditLog.create({
              data: {
                userId: user.userId,
                organizationId: user.organizationId,
                action: 'Compliance override trigger',
                objectType: 'LOAD',
                objectId: load.loadNumber,
                newValue: `Override carrier compliance check for ${carrier.name}. Reason: ${rejectReason}`,
              },
            });
          }
        }

        updateData.carrierId = carrier.id;
        updateData.status = 'assigned'; // Auto-transition to assigned

        // Log assignment
        await this.prisma.shipmentTimeline.create({
          data: {
            loadId: load.id,
            status: 'assigned',
            userId: user.userId,
            note: `Carrier assigned: ${carrier.name}`,
          },
        });
      } else {
        updateData.carrierId = null;
        updateData.status = 'posted'; // Reset to posted if carrier unassigned
        
        await this.prisma.shipmentTimeline.create({
          data: {
            loadId: load.id,
            status: 'posted',
            userId: user.userId,
            note: `Carrier unassigned by ${user.name}`,
          },
        });
      }
    }

    // 2. Handle State Machine Transition Check
    if (dto.status && dto.status !== load.status) {
      this.validateStatusTransition(load.status, dto.status);

      // Additional business logic checks for specific transitions
      if (dto.status === 'rate-confirmed') {
        const approvedRC = await this.prisma.rateConfirmation.findFirst({
          where: { loadId: load.id, status: 'APPROVED' },
        });
        if (!approvedRC) {
          throw new BadRequestException('Cannot confirm rate. A signed rate confirmation is required.');
        }
      }

      if (dto.status === 'pod-verified') {
        const pod = await this.prisma.proofOfDelivery.findFirst({
          where: { loadId: load.id, approvalStatus: 'APPROVED' },
        });
        if (!pod) {
          throw new BadRequestException('Cannot verify POD. An approved POD document is required.');
        }
      }

      updateData.status = dto.status;

      await this.prisma.shipmentTimeline.create({
        data: {
          loadId: load.id,
          status: dto.status,
          userId: user.userId,
          note: `Status updated to ${dto.status} by ${user.name}`,
        },
      });
    }

    // Update remaining properties
    if (dto.origin) updateData.origin = dto.origin;
    if (dto.originAddress) updateData.originAddress = dto.originAddress;
    if (dto.destination) updateData.destination = dto.destination;
    if (dto.destinationAddress) updateData.destinationAddress = dto.destinationAddress;
    if (dto.pickupDate) updateData.pickupDate = new Date(dto.pickupDate);
    if (dto.pickupWindow) updateData.pickupWindow = dto.pickupWindow;
    if (dto.deliveryDate) updateData.deliveryDate = new Date(dto.deliveryDate);
    if (dto.deliveryWindow) updateData.deliveryWindow = dto.deliveryWindow;
    if (dto.commodity) updateData.commodity = dto.commodity;
    if (dto.weight) updateData.weight = dto.weight;
    if (dto.declaredValue) updateData.declaredValue = dto.declaredValue;
    if (dto.temperature) updateData.temperature = dto.temperature;
    if (dto.equipment) updateData.equipment = dto.equipment;
    if (dto.notes) updateData.notes = dto.notes;

    const updatedLoad = await this.prisma.load.update({
      where: { id: load.id },
      data: updateData,
    });

    // Write to Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: user.userId,
        organizationId: user.organizationId,
        action: 'Updated load details',
        objectType: 'LOAD',
        objectId: load.loadNumber,
        previousValue: prevValue,
        newValue: JSON.stringify(updatedLoad),
      },
    });

    return updatedLoad;
  }

  async remove(id: string, user: JwtPayload) {
    const load = await this.prisma.load.findFirst({
      where: {
        OR: [
          { id: id },
          { loadNumber: id },
        ],
      },
    });

    if (!load) {
      throw new NotFoundException(`Load ${id} not found`);
    }

    await this.checkLoadScope(load, user);

    await this.prisma.load.update({
      where: { id: load.id },
      data: {
        deletedAt: new Date(),
        updatedBy: user.userId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.userId,
        organizationId: user.organizationId,
        action: 'Soft deleted load',
        objectType: 'LOAD',
        objectId: load.loadNumber,
        previousValue: JSON.stringify(load),
      },
    });

    return { success: true };
  }

  private validateStatusTransition(currentStatus: string, nextStatus: string) {
    const transitions: Record<string, string[]> = {
      posted: ['assigned'],
      assigned: ['posted', 'rate-confirmed'],
      'rate-confirmed': ['assigned', 'dispatched'],
      dispatched: ['in-transit'],
      'in-transit': ['delivered'],
      delivered: ['pod-verified'],
      'pod-verified': ['closed'],
      closed: [],
    };

    const allowed = transitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid status transition: cannot change load state from '${currentStatus}' to '${nextStatus}'`,
      );
    }
  }

  aiParse(text: string) {
    if (!text) {
      throw new BadRequestException('No text provided');
    }
    const textLower = text.toLowerCase();
    
    // Heuristic equipment parser
    let equipment = 'dry-van';
    if (textLower.includes('reefer') || textLower.includes('temp') || textLower.includes('cold') || textLower.includes('freeze')) {
      equipment = 'reefer';
    } else if (textLower.includes('flatbed') || textLower.includes('tarp')) {
      equipment = 'flatbed';
    } else if (textLower.includes('step deck') || textLower.includes('step-deck')) {
      equipment = 'step-deck';
    } else if (textLower.includes('lowboy')) {
      equipment = 'lowboy';
    } else if (textLower.includes('power only') || textLower.includes('power-only')) {
      equipment = 'power-only';
    }

    // Heuristic weight parser
    let weight = 40000; // default fallback
    const weightMatch = textLower.match(/(\d+[\d,]*)\s*(?:k\s*)?(?:lbs|lb|pounds)/i) || textLower.match(/weight(?:\s*is)?\s*(\d+[\d,]*)/i);
    if (weightMatch) {
      let rawWeight = weightMatch[1].replace(/,/g, '');
      let w = parseFloat(rawWeight);
      if (weightMatch[0].includes('k') && w < 1000) {
        w = w * 1000;
      }
      if (!isNaN(w)) weight = w;
    } else {
      const kMatch = textLower.match(/(\d+)\s*k(?:\s|$)/i);
      if (kMatch) {
        weight = parseFloat(kMatch[1]) * 1000;
      }
    }

    // Heuristic temperature parser
    let temperature: number | undefined = undefined;
    const tempMatch = textLower.match(/(\d+)\s*(?:°f|f|degrees|degree|c|°c)/i) || textLower.match(/temp(?:erature)?(?:\s*at)?\s*(-?\d+)/i);
    if (tempMatch) {
      const t = parseFloat(tempMatch[1]);
      if (!isNaN(t)) temperature = t;
    }

    // Origin/Destination Parser
    let origin = '';
    let destination = '';
    
    const fromToMatch = text.match(/from\s+([^,.\n]+?(?:,\s*[A-Z]{2})?)\s+to\s+([^,.\n]+?(?:,\s*[A-Z]{2})?)/i);
    if (fromToMatch) {
      origin = fromToMatch[1].trim();
      destination = fromToMatch[2].trim();
    } else {
      const originMatch = text.match(/(?:pickup|origin|loading)\s+(?:at|in)?\s*([^,.\n]+?(?:,\s*[A-Z]{2})?)/i);
      if (originMatch) origin = originMatch[1].trim();

      const destMatch = text.match(/(?:delivery|destination|deliver|unloading|drop)\s+(?:at|in|to)?\s*([^,.\n]+?(?:,\s*[A-Z]{2})?)/i);
      if (destMatch) destination = destMatch[1].trim();
    }

    // Commodity Parser
    let commodity = 'Freight';
    const commodityKeywords = ['frozen foods', 'produce', 'parts', 'machinery', 'dairy', 'electronics', 'furniture', 'paper', 'beverages', 'chemicals', 'dry goods'];
    for (const kw of commodityKeywords) {
      if (textLower.includes(kw)) {
        commodity = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        break;
      }
    }
    if (commodity === 'Freight') {
      const commMatch = text.match(/(?:lbs|lb|lbs of|lb of|tons of)\s+([A-Za-z\s]+?)(?:\s+from|\s+to|\s+on|\s+at|\.|$|\n)/i);
      if (commMatch && commMatch[1].trim().length > 2) {
        commodity = commMatch[1].trim();
      }
    }

    // Date parsing
    let pickupDate = new Date();
    pickupDate.setDate(pickupDate.getDate() + 1); // default tomorrow
    let deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3); // default 3 days from now
    
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthRegex = new RegExp(`(${months.join('|')})\\w*\\s*(\\d{1,2})`, 'i');
    const dateMatch = textLower.match(monthRegex);
    if (dateMatch) {
      const monthIdx = months.indexOf(dateMatch[1].slice(0, 3).toLowerCase());
      const day = parseInt(dateMatch[2]);
      if (monthIdx !== -1 && !isNaN(day)) {
        const d = new Date();
        d.setMonth(monthIdx);
        d.setDate(day);
        pickupDate = d;
        deliveryDate = new Date(d);
        deliveryDate.setDate(d.getDate() + 2);
      }
    }

    // Origin Address
    let originAddress = '';
    const originAddrMatch = text.match(/pickup\s+at\s+([^,.\n\(\)]+)/i) || text.match(/origin\s+address\s+is\s+([^,.\n\(\)]+)/i);
    if (originAddrMatch) {
      originAddress = originAddrMatch[1].trim();
    }

    // Destination Address
    let destinationAddress = '';
    const destAddrMatch = text.match(/deliver\s+at\s+([^,.\n\(\)]+)/i) || text.match(/delivery\s+address\s+is\s+([^,.\n\(\)]+)/i);
    if (destAddrMatch) {
      destinationAddress = destAddrMatch[1].trim();
    }

    // Notes
    let notes = '';
    const notesMatch = text.match(/(?:notes|instruction|instructions|note):\s*([^\n]+)/i);
    if (notesMatch) {
      notes = notesMatch[1].trim();
    } else {
      notes = `Extracted from description: "${text.substring(0, 60)}..."`;
    }

    return {
      origin: origin || 'Mumbai, MH',
      originAddress: originAddress || 'Main Warehouse',
      destination: destination || 'Delhi, DL',
      destinationAddress: destinationAddress || 'Receiving Dock 4',
      pickupDate: pickupDate.toISOString().split('T')[0],
      deliveryDate: deliveryDate.toISOString().split('T')[0],
      commodity: commodity,
      weight: weight,
      temperature: temperature,
      equipment: equipment,
      notes: notes
    };
  }

  async getDownloadSummary(id: string, user: JwtPayload) {
    const load = await this.findOne(id, user);
    const content = `
=========================================
          SHIPMENT SUMMARY
=========================================
Load Number: ${load.loadNumber}
Status: ${load.status}
Priority: ${load.priority}
Created Date: ${load.createdAt.toLocaleDateString()}

SHIPPER INFO:
Company: ${load.shipper.name}
Origin: ${load.origin}
Address: ${load.originAddress || 'N/A'}
Pickup Date: ${load.pickupDate.toLocaleDateString()}

CARRIER INFO:
Company: ${load.carrier?.name || 'Unassigned'}
Destination: ${load.destination}
Address: ${load.destinationAddress || 'N/A'}
Delivery Date: ${load.deliveryDate.toLocaleDateString()}

FREIGHT DETAILS:
Commodity: ${load.commodity}
Weight: ${load.weight.toLocaleString()} lbs
Equipment: ${load.equipment}
Declared Value: ${load.declaredValue ? '₹' + load.declaredValue.toLocaleString() : 'N/A'}
Temperature Control: ${load.temperature ? load.temperature + ' °F' : 'N/A'}

REVENUE & MILEAGE:
Total Revenue: ₹${load.revenue.toLocaleString()}
Distance: ${load.distanceMiles ? load.distanceMiles.toLocaleString() + ' miles' : 'N/A'}
Rate per Mile: ₹${load.ratePerMile || 'N/A'}

Special Instructions / Notes:
${load.notes || 'None'}
=========================================
Generated by LoadFlow Freight Suite
    `;
    return {
      content: Buffer.from(content, 'utf-8'),
      fileName: `Summary_${load.loadNumber}.txt`,
      mimeType: 'text/plain',
    };
  }
}
