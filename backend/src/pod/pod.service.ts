import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PodService {
  private uploadDir = process.env.UPLOAD_PATH
    ? path.join(process.env.UPLOAD_PATH, 'pods')
    : path.resolve(process.cwd(), '../uploads/pods');

  constructor(private prisma: PrismaService) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: any, loadId: string, user: JwtPayload) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const load = await this.prisma.load.findFirst({
      where: {
        OR: [
          { id: loadId },
          { loadNumber: loadId },
        ],
      },
    });

    if (!load) {
      throw new NotFoundException(`Load ${loadId} not found`);
    }

    // Scoping validation
    const isBroker = load.brokerId === user.organizationId;
    const isCarrier = load.carrierId === user.organizationId;
    if (!isBroker && !isCarrier) {
      throw new ForbiddenException('Only the assigned carrier or broker can upload PODs');
    }

    // Determine next version
    const lastPOD = await this.prisma.proofOfDelivery.findFirst({
      where: { loadId: load.id },
      orderBy: { versionNumber: 'desc' },
    });

    const nextVersion = lastPOD ? lastPOD.versionNumber + 1 : 1;
    const fileName = `POD_${load.loadNumber}_v${nextVersion}${path.extname(file.originalname)}`;
    const filePath = path.join(this.uploadDir, fileName);

    // Save file locally
    fs.writeFileSync(filePath, file.buffer);

    const fileSizeStr = `${(file.size / 1024 / 1024).toFixed(2)} MB`;

    const pod = await this.prisma.proofOfDelivery.create({
      data: {
        loadId: load.id,
        fileName,
        fileUrl: `/uploads/pods/${fileName}`,
        fileSize: fileSizeStr,
        mimeType: file.mimetype,
        versionNumber: nextVersion,
        approvalStatus: 'PENDING',
        uploadedBy: user.userId,
      },
    });

    // Seed notification for broker admins
    const brokerAdmins = await this.prisma.user.findMany({
      where: {
        organizationId: load.brokerId,
        roles: { some: { role: { name: 'Admin' } } },
      },
    });

    for (const admin of brokerAdmins) {
      await this.prisma.notification.create({
        data: {
          userId: admin.id,
          title: `POD Uploaded - ${load.loadNumber}`,
          message: `A new proof of delivery has been uploaded for load ${load.loadNumber} (v${nextVersion})`,
          type: 'POD',
        },
      });
    }

    // Add timeline event
    await this.prisma.shipmentTimeline.create({
      data: {
        loadId: load.id,
        status: load.status, // Keep current status but add note
        userId: user.userId,
        note: `Proof of Delivery v${nextVersion} uploaded by ${user.name}`,
      },
    });

    // Write to audit log
    await this.prisma.auditLog.create({
      data: {
        userId: user.userId,
        organizationId: user.organizationId,
        action: 'Uploaded POD document',
        objectType: 'POD',
        objectId: load.loadNumber,
        newValue: JSON.stringify(pod),
      },
    });

    return pod;
  }

  async approve(id: string, user: JwtPayload) {
    const pod = await this.prisma.proofOfDelivery.findUnique({
      where: { id },
      include: { load: true },
    });

    if (!pod) {
      throw new NotFoundException(`POD document not found`);
    }

    if (pod.load.brokerId !== user.organizationId) {
      throw new ForbiddenException('Only broker users can approve POD documents');
    }

    return this.prisma.$transaction(async (tx) => {
      const approvedPod = await tx.proofOfDelivery.update({
        where: { id: pod.id },
        data: { approvalStatus: 'APPROVED' },
      });

      // If load is currently delivered, update status to pod-verified
      if (pod.load.status === 'delivered') {
        await tx.load.update({
          where: { id: pod.loadId },
          data: {
            status: 'pod-verified',
            updatedBy: user.userId,
          },
        });

        await tx.shipmentTimeline.create({
          data: {
            loadId: pod.loadId,
            status: 'pod-verified',
            userId: user.userId,
            note: `POD verified by ${user.name}. Status updated to POD Verified.`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.userId,
          organizationId: user.organizationId,
          action: 'Approved POD document',
          objectType: 'POD',
          objectId: pod.load.loadNumber,
          newValue: `Approved version ${pod.versionNumber}`,
        },
      });

      return approvedPod;
    });
  }

  async getFilePath(id: string) {
    const pod = await this.prisma.proofOfDelivery.findUnique({ where: { id } });
    if (!pod) {
      throw new NotFoundException('POD document not found');
    }
    const filePath = path.join(this.uploadDir, pod.fileName);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Physical POD file missing on server');
    }
    return { filePath, mimeType: pod.mimeType };
  }
}
