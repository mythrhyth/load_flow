import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.proofOfDelivery.deleteMany({});
  await prisma.rateConfirmation.deleteMany({});
  await prisma.shipmentTimeline.deleteMany({});
  await prisma.load.deleteMany({});
  await prisma.carrierCompliance.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.invitation.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.organization.deleteMany({});

  // Hash password for demo users
  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Seed Permissions
  const permissionsData = [
    // Load Management
    { name: 'load.create', description: 'Create new freight loads' },
    { name: 'load.edit', description: 'Modify load details' },
    { name: 'load.delete', description: 'Remove loads from system' },
    { name: 'load.assign', description: 'Assign carriers to loads' },
    { name: 'load.dispatch', description: 'Mark loads as dispatched' },
    { name: 'load.close', description: 'Archive and close loads' },
    { name: 'load.update.status', description: 'Change load timeline status' },
    // Rate Confirmations
    { name: 'rate.confirm', description: 'Generate and approve rate confirmations' },
    // Compliance
    { name: 'compliance.view', description: 'View carrier compliance status' },
    { name: 'compliance.manage', description: 'Update carrier compliance status' },
    { name: 'compliance.override', description: 'Bypass compliance blocks' },
    // POD
    { name: 'pod.upload', description: 'Upload Proof of Delivery files' },
    // Staff & Roles
    { name: 'staff.manage', description: 'Create and deactivate staff accounts' },
    { name: 'role.manage', description: 'Configure roles and permissions' },
    // Reporting & Audit
    { name: 'audit.view', description: 'Access full system audit trails' },
    { name: 'reports.view', description: 'Access analytics and reporting' },
  ];

  const createdPermissions = await Promise.all(
    permissionsData.map((perm) => prisma.permission.create({ data: perm })),
  );
  const permissionByName = Object.fromEntries(
    createdPermissions.map((perm) => [perm.name, perm]),
  );

  // 3. Seed Organizations
  const brokerOrg = await prisma.organization.create({
    data: { name: 'LoadFlow India Logistics', type: 'BROKER' },
  });

  const swiftCarrier = await prisma.organization.create({
    data: { name: 'Tata Logistics', type: 'CARRIER' },
  });

  const jbHuntCarrier = await prisma.organization.create({
    data: { name: 'Mahindra Logistics', type: 'CARRIER' },
  });

  const wernerCarrier = await prisma.organization.create({
    data: { name: 'Adani Transport', type: 'CARRIER' },
  });

  const primeCarrier = await prisma.organization.create({
    data: { name: 'VRL Logistics', type: 'CARRIER' },
  });

  const schneiderCarrier = await prisma.organization.create({
    data: { name: 'Delhivery Logistics', type: 'CARRIER' },
  });

  const midwestShipper = await prisma.organization.create({
    data: { name: 'Reliance Fresh', type: 'SHIPPER' },
  });

  const autoPartsShipper = await prisma.organization.create({
    data: { name: 'Maruti Parts', type: 'SHIPPER' },
  });

  const greenValleyShipper = await prisma.organization.create({
    data: { name: 'Amul Dairy', type: 'SHIPPER' },
  });

  const techShipShipper = await prisma.organization.create({
    data: { name: 'Infosys Logistics', type: 'SHIPPER' },
  });

  const pharmaColdShipper = await prisma.organization.create({
    data: { name: 'Cipla Cold Chain', type: 'SHIPPER' },
  });

  // 4. Seed Carrier Compliance Records
  const complianceData = [
    { carrierId: swiftCarrier.id, mcNumber: '138616', dotNumber: '285465', authorityStatus: 'ACTIVE', insuranceExpiry: new Date('2027-08-15'), riskScore: 10, complianceScore: 94 },
    { carrierId: jbHuntCarrier.id, mcNumber: '225682', dotNumber: '191334', authorityStatus: 'ACTIVE', insuranceExpiry: new Date('2027-12-22'), riskScore: 12, complianceScore: 91 },
    { carrierId: wernerCarrier.id, mcNumber: '195600', dotNumber: '107294', authorityStatus: 'ACTIVE', insuranceExpiry: new Date('2025-07-28'), riskScore: 40, complianceScore: 85 }, // Expired insurance
    { carrierId: primeCarrier.id, mcNumber: '153833', dotNumber: '77949', authorityStatus: 'INACTIVE', insuranceExpiry: new Date('2025-06-01'), riskScore: 80, complianceScore: 62 }, // Expired + Inactive authority
    { carrierId: schneiderCarrier.id, mcNumber: '198777', dotNumber: '219869', authorityStatus: 'ACTIVE', insuranceExpiry: new Date('2027-11-11'), riskScore: 15, complianceScore: 89 },
  ];

  for (const comp of complianceData) {
    await prisma.carrierCompliance.create({ data: comp });
  }

  // 5. Seed Roles per Org type
  // Broker Admin Role
  const brokerAdminRole = await prisma.role.create({
    data: { name: 'Admin', description: 'Full system access', organizationId: brokerOrg.id, isCustom: false },
  });
  // Assign all permissions to Broker Admin
  for (const perm of createdPermissions) {
    await prisma.rolePermission.create({
      data: { roleId: brokerAdminRole.id, permissionId: perm.id },
    });
  }

  // Broker Dispatcher Role
  const brokerDispatcherRole = await prisma.role.create({
    data: { name: 'Dispatcher', description: 'Load dispatch and tracking', organizationId: brokerOrg.id, isCustom: true },
  });
  const dispatcherPerms = ['load.edit', 'load.assign', 'load.dispatch', 'rate.confirm', 'compliance.view', 'pod.upload'];
  for (const permName of dispatcherPerms) {
    const permission = permissionByName[permName];
    if (permission) {
      await prisma.rolePermission.create({
        data: { roleId: brokerDispatcherRole.id, permissionId: permission.id },
      });
    }
  }

  // Broker Compliance Role
  const brokerComplianceRole = await prisma.role.create({
    data: { name: 'Compliance Officer', description: 'Carrier compliance oversight', organizationId: brokerOrg.id, isCustom: true },
  });
  const compliancePerms = ['compliance.view', 'compliance.manage', 'compliance.override', 'reports.view'];
  for (const permName of compliancePerms) {
    const permission = permissionByName[permName];
    if (permission) {
      await prisma.rolePermission.create({
        data: { roleId: brokerComplianceRole.id, permissionId: permission.id },
      });
    }
  }

  // Carrier Admin Role
  const carrierAdminRole = await prisma.role.create({
    data: { name: 'Admin', description: 'Full carrier access', organizationId: swiftCarrier.id, isCustom: false },
  });
  const carrierAdminPerms = ['load.update.status', 'pod.upload', 'staff.manage', 'reports.view'];
  for (const permName of carrierAdminPerms) {
    const permission = permissionByName[permName];
    if (permission) {
      await prisma.rolePermission.create({
        data: { roleId: carrierAdminRole.id, permissionId: permission.id },
      });
    }
  }

  // Carrier Staff (Driver) Role
  const carrierDriverRole = await prisma.role.create({
    data: { name: 'Driver', description: 'Driver load updates', organizationId: swiftCarrier.id, isCustom: true },
  });
  const driverPerms = ['load.update.status', 'pod.upload'];
  for (const permName of driverPerms) {
    const permission = permissionByName[permName];
    if (permission) {
      await prisma.rolePermission.create({
        data: { roleId: carrierDriverRole.id, permissionId: permission.id },
      });
    }
  }

  // Shipper Role
  const shipperRole = await prisma.role.create({
    data: { name: 'Shipper', description: 'Shipment visibility only', organizationId: midwestShipper.id, isCustom: false },
  });
  const shipperPerms = ['reports.view'];
  for (const permName of shipperPerms) {
    const permission = permissionByName[permName];
    if (permission) {
      await prisma.rolePermission.create({
        data: { roleId: shipperRole.id, permissionId: permission.id },
      });
    }
  }

  // 6. Seed Users
  // Shreya Sharma (Broker Admin)
  const sarah = await prisma.user.create({
    data: { email: 'shreya@loadflow.com', name: 'Shreya Sharma', passwordHash, status: 'ACTIVE', organizationId: brokerOrg.id, mfaEnabled: true },
  });
  await prisma.userRole.create({ data: { userId: sarah.id, roleId: brokerAdminRole.id } });

  // Rahul Verma (Broker Dispatcher)
  const mike = await prisma.user.create({
    data: { email: 'rahul@loadflow.com', name: 'Rahul Verma', passwordHash, status: 'ACTIVE', organizationId: brokerOrg.id, mfaEnabled: true },
  });
  await prisma.userRole.create({ data: { userId: mike.id, roleId: brokerDispatcherRole.id } });

  // Riya Patel (Broker Carrier Ops)
  const rachel = await prisma.user.create({
    data: { email: 'riya@loadflow.com', name: 'Riya Patel', passwordHash, status: 'ACTIVE', organizationId: brokerOrg.id, mfaEnabled: false },
  });
  await prisma.userRole.create({ data: { userId: rachel.id, roleId: brokerDispatcherRole.id } });

  // Divya Nair (Broker Compliance)
  const diana = await prisma.user.create({
    data: { email: 'divya@loadflow.com', name: 'Divya Nair', passwordHash, status: 'ACTIVE', organizationId: brokerOrg.id, mfaEnabled: true },
  });
  await prisma.userRole.create({ data: { userId: diana.id, roleId: brokerComplianceRole.id } });

  // Tarun Sen (Broker Staff - Inactive)
  const tom = await prisma.user.create({
    data: { email: 'tarun@loadflow.com', name: 'Tarun Sen', passwordHash, status: 'INACTIVE', organizationId: brokerOrg.id, mfaEnabled: false },
  });
  await prisma.userRole.create({ data: { userId: tom.id, roleId: brokerDispatcherRole.id } });

  // Ananya Rao (Broker Staff - Pending Invitation)
  const amy = await prisma.user.create({
    data: { email: 'ananya@loadflow.com', name: 'Ananya Rao', passwordHash, status: 'PENDING', organizationId: brokerOrg.id, mfaEnabled: false },
  });
  await prisma.userRole.create({ data: { userId: amy.id, roleId: brokerDispatcherRole.id } });

  // Deepak Gupta (Carrier Admin)
  const david = await prisma.user.create({
    data: { email: 'deepak@swift.com', name: 'Deepak Gupta', passwordHash, status: 'ACTIVE', organizationId: swiftCarrier.id, mfaEnabled: true },
  });
  await prisma.userRole.create({ data: { userId: david.id, roleId: carrierAdminRole.id } });

  // Jaspreet Singh (Carrier Driver)
  const john = await prisma.user.create({
    data: { email: 'jaspreet@swift.com', name: 'Jaspreet Singh', passwordHash, status: 'ACTIVE', organizationId: swiftCarrier.id, mfaEnabled: false },
  });
  await prisma.userRole.create({ data: { userId: john.id, roleId: carrierDriverRole.id } });

  // Amit Kumar (Shipper User)
  const alex = await prisma.user.create({
    data: { email: 'amit@midwestfoods.com', name: 'Amit Kumar', passwordHash, status: 'ACTIVE', organizationId: midwestShipper.id, mfaEnabled: false },
  });
  await prisma.userRole.create({ data: { userId: alex.id, roleId: shipperRole.id } });

  // 7. Seed 20 Loads
  // 10 Completed Loads
  const completedLoadsData = [
    { loadNumber: 'LD-2854', origin: 'Mumbai, MH', originAddress: '1900 Southern Rd', destination: 'Delhi, DL', destinationAddress: '4900 York St', commodity: 'Refrigerated Produce', weight: 38000, equipment: 'reefer', revenue: 3600, status: 'closed', priority: 'low' },
    { loadNumber: 'LD-2853', origin: 'Chennai, TN', originAddress: '2400 E Sepulveda Blvd', destination: 'Hyderabad, TS', destinationAddress: '1515 S 22nd Ave', commodity: 'Steel Tubing', weight: 44000, equipment: 'flatbed', revenue: 2400, status: 'pod-verified', priority: 'low' },
    { loadNumber: 'LD-2852', origin: 'Ahmedabad, GJ', originAddress: '8800 Dallas Pkwy', destination: 'Surat, GJ', destinationAddress: '7200 Loop East', commodity: 'Paper Rolls', weight: 42000, equipment: 'dry-van', revenue: 1800, status: 'delivered', priority: 'medium' },
    { loadNumber: 'LD-2840', origin: 'Mumbai, MH', destination: 'Bangalore, KA', commodity: 'Auto Parts', weight: 20000, equipment: 'dry-van', revenue: 1500, status: 'closed', priority: 'low' },
    { loadNumber: 'LD-2841', origin: 'Kolkata, WB', destination: 'Patna, BR', commodity: 'Food Products', weight: 35000, equipment: 'dry-van', revenue: 1200, status: 'closed', priority: 'low' },
    { loadNumber: 'LD-2842', origin: 'Bhopal, MP', destination: 'Lucknow, UP', commodity: 'Machinery', weight: 15000, equipment: 'flatbed', revenue: 1900, status: 'closed', priority: 'medium' },
    { loadNumber: 'LD-2843', origin: 'Indore, MP', destination: 'Nagpur, MH', commodity: 'Auto Parts', weight: 22000, equipment: 'dry-van', revenue: 1100, status: 'closed', priority: 'low' },
    { loadNumber: 'LD-2844', origin: 'Guwahati, AS', destination: 'Kochi, KL', commodity: 'Cotton Bales', weight: 40000, equipment: 'dry-van', revenue: 2000, status: 'closed', priority: 'medium' },
    { loadNumber: 'LD-2845', origin: 'Chandigarh, CH', destination: 'Amritsar, PB', commodity: 'Apparel', weight: 18000, equipment: 'dry-van', revenue: 1400, status: 'closed', priority: 'low' },
    { loadNumber: 'LD-2846', origin: 'Philadelphia, PA', destination: 'Boston, MA', commodity: 'Plastic Resins', weight: 43000, equipment: 'dry-van', revenue: 2300, status: 'closed', priority: 'high' },
  ];

  // 10 Active Loads
  const activeLoadsData = [
    { loadNumber: 'LD-2847', origin: 'Mumbai, MH', originAddress: '2847 W Grand Ave', destination: 'Delhi, DL', destinationAddress: '1200 Lebanon Pike', commodity: 'Frozen Foods', weight: 42000, temperature: 34, equipment: 'reefer', revenue: 4200, status: 'in-transit', priority: 'high', carrierId: swiftCarrier.id },
    { loadNumber: 'LD-2848', origin: 'Indore, MP', originAddress: '1400 E Grand Blvd', destination: 'Kochi, KL', destinationAddress: '2500 Moreland Ave', commodity: 'Auto Parts', weight: 25000, equipment: 'dry-van', revenue: 3800, status: 'dispatched', priority: 'critical', carrierId: wernerCarrier.id },
    { loadNumber: 'LD-2849', origin: 'Pune, MH', originAddress: '5500 E North Ave', destination: 'Chennai, TN', destinationAddress: '4200 East Marginal Way', commodity: 'Fresh Berries', weight: 40000, temperature: 36, equipment: 'reefer', revenue: 5100, status: 'rate-confirmed', priority: 'medium', carrierId: jbHuntCarrier.id },
    { loadNumber: 'LD-2850', origin: 'San Jose, CA', originAddress: '1500 Almaden Expy', destination: 'Portland, OR', destinationAddress: '3100 NW Yeon Ave', commodity: 'Electronics', weight: 12000, equipment: 'dry-van', revenue: 2900, status: 'posted', priority: 'low' },
    { loadNumber: 'LD-2851', origin: 'Boston, MA', originAddress: '100 Terminal St', destination: 'New York, NY', destinationAddress: '500 Food Center Dr', commodity: 'Chilled Seafood', weight: 36000, temperature: 32, equipment: 'reefer', revenue: 3200, status: 'assigned', priority: 'critical', carrierId: primeCarrier.id },
    { loadNumber: 'LD-2855', origin: 'Pittsburgh, PA', originAddress: '200 Industry Dr', destination: 'Bangalore, KA', destinationAddress: '1800 Alum Creek Dr', commodity: 'Steel Rebar', weight: 45000, equipment: 'flatbed', revenue: 2100, status: 'posted', priority: 'high' },
    { loadNumber: 'LD-2856', origin: 'Miami, FL', originAddress: '3000 NW 74th Ave', destination: 'Chandigarh, CH', destinationAddress: '4100 N Tryon St', commodity: 'Ornamental Plants', weight: 30000, temperature: 55, equipment: 'reefer', revenue: 4500, status: 'assigned', priority: 'medium', carrierId: schneiderCarrier.id },
    { loadNumber: 'LD-2857', origin: 'Chennai, TN', destination: 'Spokane, WA', commodity: 'Lumber', weight: 44000, equipment: 'flatbed', revenue: 1600, status: 'posted', priority: 'low' },
    { loadNumber: 'LD-2858', origin: 'Delhi, DL', destination: 'Salt Lake City, UT', commodity: 'Beverages', weight: 42000, equipment: 'dry-van', revenue: 2200, status: 'posted', priority: 'medium' },
    { loadNumber: 'LD-2859', origin: 'Hyderabad, TS', destination: 'Las Vegas, NV', commodity: 'Dry Groceries', weight: 40000, equipment: 'dry-van', revenue: 1300, status: 'posted', priority: 'low' },
  ];

  const allLoads = [...completedLoadsData, ...activeLoadsData];

  for (const loadItem of allLoads) {
    const { carrierId, ...loadFields } = loadItem as any;
    const l = await prisma.load.create({
      data: {
        ...loadFields,
        pickupDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        deliveryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
        shipperId: midwestShipper.id,
        brokerId: brokerOrg.id,
        carrierId: carrierId || null,
        createdBy: sarah.id,
        updatedBy: sarah.id,
      },
    });

    // Seed Shipment Timeline Events for active/completed loads
    // Posted
    await prisma.shipmentTimeline.create({
      data: { loadId: l.id, status: 'posted', note: 'Load posted to load board', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) },
    });

    if (l.status !== 'posted') {
      // Assigned
      await prisma.shipmentTimeline.create({
        data: { loadId: l.id, status: 'assigned', note: 'Carrier assigned', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
      });
    }

    if (['rate-confirmed', 'dispatched', 'in-transit', 'delivered', 'pod-verified', 'closed'].includes(l.status)) {
      // Rate Confirmed
      await prisma.shipmentTimeline.create({
        data: { loadId: l.id, status: 'rate-confirmed', note: 'Rate confirmation approved', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.5) },
      });
      // Seed Rate Confirmation
      await prisma.rateConfirmation.create({
        data: {
          rcNumber: `RC-${1000 + Math.floor(Math.random() * 1000)}`,
          loadId: l.id,
          baseRate: l.revenue * 0.85,
          accessorialCharges: 100.0,
          fuelSurcharge: l.revenue * 0.1,
          detentionCharges: 0.0,
          notes: 'Standard brokerage terms apply.',
          versionNumber: 1,
          status: 'APPROVED',
          createdBy: sarah.id,
        },
      });
    }

    if (['dispatched', 'in-transit', 'delivered', 'pod-verified', 'closed'].includes(l.status)) {
      // Dispatched
      await prisma.shipmentTimeline.create({
        data: { loadId: l.id, status: 'dispatched', note: 'Driver dispatched to shipper', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) },
      });
    }

    if (['in-transit', 'delivered', 'pod-verified', 'closed'].includes(l.status)) {
      // In Transit
      await prisma.shipmentTimeline.create({
        data: { loadId: l.id, status: 'in-transit', note: 'In transit - departed shipper terminal', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12) },
      });
    }

    if (['delivered', 'pod-verified', 'closed'].includes(l.status)) {
      // Delivered
      await prisma.shipmentTimeline.create({
        data: { loadId: l.id, status: 'delivered', note: 'Delivered to receiver successfully', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) },
      });
    }

    if (['pod-verified', 'closed'].includes(l.status)) {
      // POD Verified
      await prisma.shipmentTimeline.create({
        data: { loadId: l.id, status: 'pod-verified', note: 'Proof of Delivery verified by billing', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
      });
      // Seed Proof of Delivery file metadata
      await prisma.proofOfDelivery.create({
        data: {
          loadId: l.id,
          fileName: `POD_${l.loadNumber}.pdf`,
          fileUrl: `/uploads/pods/POD_${l.loadNumber}.pdf`,
          fileSize: '1.2 MB',
          mimeType: 'application/pdf',
          versionNumber: 1,
          approvalStatus: 'APPROVED',
          uploadedBy: john.id,
        },
      });
    }

    if (l.status === 'closed') {
      // Closed
      await prisma.shipmentTimeline.create({
        data: { loadId: l.id, status: 'closed', note: 'Load accounting closed', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1) },
      });
    }
  }

  // 8. Seed Notifications
  await prisma.notification.create({
    data: { userId: sarah.id, title: 'Adani Transport insurance expires Jul 28', message: '3 days remaining · Act now', type: 'COMPLIANCE', read: false },
  });
  await prisma.notification.create({
    data: { userId: sarah.id, title: 'VRL Logistics authority inactive', message: 'LD-2851 at risk · Review required', type: 'COMPLIANCE', read: false },
  });
  await prisma.notification.create({
    data: { userId: sarah.id, title: 'RC-1194 approved', message: 'LD-2849 rate confirmed · $5,100', type: 'RATE_CONFIRMATION', read: true },
  });

  // 9. Seed Audit Logs
  const auditLogs = [
    { userId: sarah.id, organizationId: brokerOrg.id, action: 'Updated load status', objectType: 'LOAD', objectId: 'LD-2847', newValue: 'Status changed from Dispatched → In Transit', ipAddress: '192.168.1.42' },
    { userId: mike.id, organizationId: brokerOrg.id, action: 'Assigned carrier', objectType: 'LOAD', objectId: 'LD-2856', newValue: 'Delhivery Logistics assigned', ipAddress: '192.168.1.87' },
    { userId: rachel.id, organizationId: brokerOrg.id, action: 'Created rate confirmation', objectType: 'RATE_CONFIRMATION', objectId: 'RC-1194', newValue: 'Version 1 created for LD-2849', ipAddress: '192.168.1.55' },
    { userId: david.id, organizationId: swiftCarrier.id, action: 'Uploaded POD', objectType: 'LOAD', objectId: 'LD-2852', newValue: 'delivery_proof_2852.pdf uploaded', ipAddress: '10.0.0.12' },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
