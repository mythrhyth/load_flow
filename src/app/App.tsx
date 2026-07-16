import { useState, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api/client";
import { Toaster, toast } from "sonner";
import {
  useAuth,
  useDashboard,
  useLoads,
  useLoadDetail,
  useCreateLoad,
  useUpdateLoad,
  useDeleteLoad,
  useCarriers,
  useCarrierDetail,
  useUpdateCarrierCompliance,
  useShippers,
  useCreateShipper,
  useStaff,
  useInviteStaff,
  useSetStaffStatus,
  useChangeStaffRole,
  useRoles,
  usePermissions,
  useCreateRole,
  useUpdateRolePermissions,
  useAuditLogs,
  useReports,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useUploadPOD,
  useApprovePOD,
  useApproveRC,
  useCreateRC,
  useGlobalSearch,
  useCreateCarrier,
  useUpdateCarrier,
  useDeleteCarrier,
  useUpdateShipper,
  useDeleteShipper,
  useUpdateRC,
  useDeleteRC,
  useDeleteRole,
  useDeleteStaff
} from "./api/hooks";
import {
  LayoutDashboard, Truck, FileText, Users, Shield, Building2,
  UserCheck, Key, ScrollText, BarChart3, Settings, Bell, Search,
  ChevronDown, Plus, Filter, Download, RefreshCw, AlertTriangle,
  CheckCircle, Clock, XCircle, ArrowRight, Package, MapPin,
  Calendar, Star, TrendingUp, TrendingDown, Eye, Edit2, Trash2,
  MoreHorizontal, Upload, ChevronRight, ChevronLeft, Zap, Award,
  Activity, Target, DollarSign, Layers, GitMerge, Check,
  X, Info, ArrowUpRight, ArrowDownRight, Circle, Minus,
  Hash, Globe, Cpu, Lock, Unlock, Copy, ExternalLink,
  BarChart2, PieChart, LineChart, LogOut, User, HelpCircle,
  Inbox, Send, Archive, Bookmark, Tag, Database, Server,
  AlertCircle, CheckSquare, Square, ChevronUp
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart as ReLineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
type Page =
  | "dashboard" | "loads" | "rate-confirmations" | "carriers"
  | "compliance" | "shippers" | "staff" | "roles" | "audit"
  | "reports" | "settings" | "load-detail" | "create-load"
  | "carrier-detail" | "shipper-view" | "carrier-view";

type LoadStatus =
  | "posted" | "assigned" | "rate-confirmed" | "dispatched"
  | "in-transit" | "delivered" | "pod-verified" | "closed";

type Priority = "critical" | "high" | "medium" | "low";
type ComplianceStatus = "compliant" | "warning" | "expired" | "pending";

// ─── Sample Data ─────────────────────────────────────────────────────────────
const LOADS = [
  { id: "LD-2847", shipper: "Reliance Fresh", origin: "Mumbai, MH", dest: "Delhi, DL", carrier: "Swift Transport", equipment: "Reefer 53'", pickup: "Jul 15", status: "in-transit" as LoadStatus, compliance: "compliant" as ComplianceStatus, priority: "high" as Priority, revenue: 4200 },
  { id: "LD-2848", shipper: "Maruti Parts", origin: "Indore, MP", dest: "Kochi, KL", carrier: "Adani Transport Ent.", equipment: "Dry Van 53'", pickup: "Jul 15", status: "dispatched" as LoadStatus, compliance: "warning" as ComplianceStatus, priority: "critical" as Priority, revenue: 3800 },
  { id: "LD-2849", shipper: "Amul Dairy", origin: "Pune, MH", dest: "Chennai, TN", carrier: "Mahindra Logistics", equipment: "Flatbed 48'", pickup: "Jul 16", status: "rate-confirmed" as LoadStatus, compliance: "compliant" as ComplianceStatus, priority: "medium" as Priority, revenue: 5100 },
  { id: "LD-2850", shipper: "Infosys Logistics", origin: "San Jose, CA", dest: "Portland, OR", carrier: "Unassigned", equipment: "Dry Van 53'", pickup: "Jul 17", status: "posted" as LoadStatus, compliance: "compliant" as ComplianceStatus, priority: "low" as Priority, revenue: 2900 },
  { id: "LD-2851", shipper: "Cipla Cold Chain", origin: "Boston, MA", dest: "New York, NY", carrier: "VRL Logistics", equipment: "Reefer 48'", pickup: "Jul 16", status: "assigned" as LoadStatus, compliance: "expired" as ComplianceStatus, priority: "critical" as Priority, revenue: 3200 },
  { id: "LD-2852", shipper: "HomeGoods Plus", origin: "Ahmedabad, GJ", dest: "Surat, GJ", carrier: "Delhivery Logistics", equipment: "Dry Van 48'", pickup: "Jul 14", status: "delivered" as LoadStatus, compliance: "compliant" as ComplianceStatus, priority: "medium" as Priority, revenue: 1800 },
  { id: "LD-2853", shipper: "Coastal Imports", origin: "Chennai, TN", dest: "Hyderabad, TS", carrier: "Old Dominion", equipment: "Flatbed 53'", pickup: "Jul 14", status: "pod-verified" as LoadStatus, compliance: "compliant" as ComplianceStatus, priority: "low" as Priority, revenue: 2400 },
  { id: "LD-2854", shipper: "Reliance Fresh", origin: "Mumbai, MH", dest: "Delhi, DL", carrier: "Landstar", equipment: "Reefer 53'", pickup: "Jul 13", status: "closed" as LoadStatus, compliance: "compliant" as ComplianceStatus, priority: "low" as Priority, revenue: 3600 },
  { id: "LD-2855", shipper: "BuildRight Supply", origin: "Pittsburgh, PA", dest: "Bangalore, KA", carrier: "Unassigned", equipment: "Flatbed 48'", pickup: "Jul 18", status: "posted" as LoadStatus, compliance: "warning" as ComplianceStatus, priority: "high" as Priority, revenue: 2100 },
  { id: "LD-2856", shipper: "FreshCo Produce", origin: "Miami, FL", dest: "Chandigarh, CH", carrier: "Covenant", equipment: "Reefer 53'", pickup: "Jul 17", status: "assigned" as LoadStatus, compliance: "compliant" as ComplianceStatus, priority: "medium" as Priority, revenue: 4500 },
];

const KANBAN_COLS: { id: LoadStatus; label: string; color: string }[] = [
  { id: "posted", label: "Posted", color: "#6B7280" },
  { id: "assigned", label: "Assigned", color: "#3B82F6" },
  { id: "rate-confirmed", label: "Rate Confirmed", color: "#8B5CF6" },
  { id: "dispatched", label: "Dispatched", color: "#F59E0B" },
  { id: "in-transit", label: "In Transit", color: "#EF4444" },
  { id: "delivered", label: "Delivered", color: "#10B981" },
  { id: "pod-verified", label: "POD Verified", color: "#059669" },
  { id: "closed", label: "Closed", color: "#374151" },
];

const REVENUE_DATA = [
  { month: "Jan", revenue: 182000, loads: 124 },
  { month: "Feb", revenue: 198000, loads: 138 },
  { month: "Mar", revenue: 224000, loads: 156 },
  { month: "Apr", revenue: 216000, loads: 148 },
  { month: "May", revenue: 251000, loads: 172 },
  { month: "Jun", revenue: 268000, loads: 184 },
  { month: "Jul", revenue: 243000, loads: 167 },
];

const CARRIER_PERF = [
  { carrier: "Swift", onTime: 96, score: 94 },
  { carrier: "Mahindra Logistics", onTime: 93, score: 91 },
  { carrier: "Adani Transport", onTime: 88, score: 85 },
  { carrier: "Prime", onTime: 91, score: 89 },
  { carrier: "Delhivery Logistics", onTime: 87, score: 83 },
];

const STATUS_DIST = [
  { name: "In Transit", value: 38, color: "#EF4444" },
  { name: "Delivered", value: 24, color: "#10B981" },
  { name: "Dispatched", value: 18, color: "#F59E0B" },
  { name: "Posted", value: 12, color: "#6B7280" },
  { name: "Other", value: 8, color: "#8B5CF6" },
];

const CARRIERS = [
  { id: "C001", name: "Tata Logistics", score: 94, compliance: "compliant" as ComplianceStatus, avgRate: 4.12, acceptRate: 78, onTime: 96, delay: 0.8, equipment: ["Dry Van", "Reefer"], risk: "low", dot: "285465", mc: "138616", insurance: "Aug 15, 2025", authority: "active" },
  { id: "C002", name: "Mahindra Logistics", score: 91, compliance: "compliant" as ComplianceStatus, avgRate: 4.38, acceptRate: 71, onTime: 93, delay: 1.2, equipment: ["Dry Van", "Flatbed", "Intermodal"], risk: "low", dot: "191334", mc: "225682", insurance: "Dec 22, 2025", authority: "active" },
  { id: "C003", name: "Adani Transport", score: 85, compliance: "warning" as ComplianceStatus, avgRate: 3.94, acceptRate: 65, onTime: 88, delay: 2.1, equipment: ["Dry Van", "Reefer"], risk: "medium", dot: "107294", mc: "195600", insurance: "Jul 28, 2025", authority: "active" },
  { id: "C004", name: "VRL Logistics", score: 62, compliance: "expired" as ComplianceStatus, avgRate: 3.72, acceptRate: 82, onTime: 74, delay: 3.8, equipment: ["Dry Van", "Reefer"], risk: "high", dot: "77949", mc: "153833", insurance: "Jun 01, 2025", authority: "inactive" },
  { id: "C005", name: "Delhivery Logistics", score: 89, compliance: "compliant" as ComplianceStatus, avgRate: 4.05, acceptRate: 69, onTime: 91, delay: 1.4, equipment: ["Dry Van", "Flatbed", "Specialized"], risk: "low", dot: "219869", mc: "198777", insurance: "Nov 11, 2025", authority: "active" },
];

const AUDIT_EVENTS = [
  { id: 1, user: "Shreya Sharma", avatar: "SC", org: "LoadFlow India Logistics", action: "Updated load status", object: "LD-2847", detail: "Status changed from Dispatched → In Transit", time: "2m ago", ip: "192.168.1.42", color: "#4F46E5" },
  { id: 2, user: "Rahul Verma", avatar: "MT", org: "LoadFlow India Logistics", action: "Assigned carrier", object: "LD-2856", detail: "Covenant Transport assigned", time: "14m ago", ip: "192.168.1.87", color: "#10B981" },
  { id: 3, user: "Jyoti Mehta", avatar: "JW", org: "LoadFlow India Logistics", action: "Created rate confirmation", object: "RC-1194", detail: "Version 1 created for LD-2849", time: "31m ago", ip: "192.168.1.55", color: "#8B5CF6" },
  { id: 4, user: "Deepak Gupta", avatar: "DP", org: "LoadFlow India Logistics", action: "Uploaded POD", object: "LD-2852", detail: "delivery_proof_2852.pdf uploaded", time: "1h ago", ip: "10.0.0.12", color: "#F59E0B" },
  { id: 5, user: "Shreya Sharma", avatar: "SC", org: "LoadFlow India Logistics", action: "Created new load", object: "LD-2855", detail: "BuildRight Supply — Pittsburgh to Columbus", time: "2h ago", ip: "192.168.1.42", color: "#4F46E5" },
  { id: 6, user: "System", avatar: "SY", org: "LoadFlow System", action: "Compliance alert triggered", object: "C004", detail: "VRL Logistics insurance expired", time: "3h ago", ip: "internal", color: "#EF4444" },
  { id: 7, user: "Rahul Verma", avatar: "MT", org: "LoadFlow India Logistics", action: "Role modified", object: "Dispatcher", detail: "Added 'Edit Carrier' permission", time: "4h ago", ip: "192.168.1.87", color: "#10B981" },
  { id: 8, user: "Jyoti Mehta", avatar: "JW", org: "LoadFlow India Logistics", action: "Approved rate confirmation", object: "RC-1193", detail: "Version 3 approved — LD-2848", time: "5h ago", ip: "192.168.1.55", color: "#8B5CF6" },
];

const TIMELINE_EVENTS = [
  { status: "Posted", user: "Shreya Sharma", avatar: "SC", time: "Jul 14, 2025 09:12 AM", note: "Load created from shipper request #47821", done: true },
  { status: "Carrier Assigned", user: "Rahul Verma", avatar: "MT", time: "Jul 14, 2025 11:34 AM", note: "Tata Logistics selected from recommendation panel", done: true },
  { status: "Rate Confirmed", user: "Jyoti Mehta", avatar: "JW", time: "Jul 14, 2025 02:15 PM", note: "RC-1192 v2 approved. Rate: $4.12/km, Total: $4,200", done: true },
  { status: "Dispatched", user: "Deepak Gupta", avatar: "DP", time: "Jul 15, 2025 06:00 AM", note: "Driver: Jaspreet Singh | Truck: IL-4829 | Trailer: 3812-R", done: true },
  { status: "In Transit", user: "System", avatar: "SY", time: "Jul 15, 2025 07:42 AM", note: "GPS ping received — departed Chicago terminal", done: true },
  { status: "Delivered", user: "", avatar: "", time: "Expected Jul 15, 2025 06:00 PM", note: "", done: false },
  { status: "POD Verified", user: "", avatar: "", time: "Pending delivery", note: "", done: false },
  { status: "Closed", user: "", avatar: "", time: "Pending POD", note: "", done: false },
];

const ROLES = [
  { id: "admin", name: "Admin", description: "Full system access", users: 3, color: "#EF4444" },
  { id: "broker", name: "Broker", description: "Load and carrier management", users: 12, color: "#4F46E5" },
  { id: "dispatcher", name: "Dispatcher", description: "Load dispatch and tracking", users: 8, color: "#8B5CF6" },
  { id: "compliance", name: "Compliance Officer", description: "Carrier compliance oversight", users: 4, color: "#F59E0B" },
  { id: "shipper", name: "Shipper", description: "Shipment visibility only", users: 47, color: "#10B981" },
  { id: "carrier", name: "Carrier", description: "Load acceptance and updates", users: 312, color: "#3B82F6" },
  { id: "viewer", name: "Viewer", description: "Read-only access", users: 21, color: "#6B7280" },
];

const PERMISSIONS = {
  "Load Management": [
    { id: "load.create", name: "Create Loads", desc: "Create new freight loads" },
    { id: "load.edit", name: "Edit Loads", desc: "Modify load details" },
    { id: "load.delete", name: "Delete Loads", desc: "Remove loads from system" },
    { id: "load.assign", name: "Assign Carriers", desc: "Assign carriers to loads" },
    { id: "load.dispatch", name: "Dispatch Loads", desc: "Mark loads as dispatched" },
    { id: "load.close", name: "Close Loads", desc: "Archive and close loads" },
  ],
  "Rate Confirmations": [
    { id: "rc.create", name: "Create RCs", desc: "Generate rate confirmations" },
    { id: "rc.approve", name: "Approve RCs", desc: "Sign off on rate confirmations" },
    { id: "rc.void", name: "Void RCs", desc: "Cancel rate confirmations" },
  ],
  "Carrier Management": [
    { id: "carrier.view", name: "View Carriers", desc: "Access carrier profiles" },
    { id: "carrier.edit", name: "Edit Carriers", desc: "Modify carrier information" },
    { id: "carrier.onboard", name: "Onboard Carriers", desc: "Add new carriers" },
    { id: "carrier.suspend", name: "Suspend Carriers", desc: "Deactivate carrier accounts" },
  ],
  "Compliance": [
    { id: "compliance.view", name: "View Compliance", desc: "See compliance status" },
    { id: "compliance.manage", name: "Manage Compliance", desc: "Update compliance records" },
    { id: "compliance.override", name: "Override Compliance", desc: "Bypass compliance blocks" },
  ],
  "Reporting": [
    { id: "reports.view", name: "View Reports", desc: "Access analytics dashboards" },
    { id: "reports.export", name: "Export Reports", desc: "Download report data" },
    { id: "reports.schedule", name: "Schedule Reports", desc: "Automate report delivery" },
  ],
  "Administration": [
    { id: "admin.users", name: "Manage Users", desc: "Create and edit staff accounts" },
    { id: "admin.roles", name: "Manage Roles", desc: "Configure role permissions" },
    { id: "admin.audit", name: "View Audit Log", desc: "Access full audit trail" },
    { id: "admin.settings", name: "System Settings", desc: "Configure system preferences" },
  ],
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: Object.values(PERMISSIONS).flat().map(p => p.id),
  broker: ["load.create","load.edit","load.assign","load.dispatch","load.close","rc.create","rc.approve","carrier.view","carrier.edit","compliance.view","reports.view","reports.export"],
  dispatcher: ["load.edit","load.assign","load.dispatch","rc.create","carrier.view","compliance.view"],
  compliance: ["compliance.view","compliance.manage","carrier.view","carrier.edit","reports.view","reports.export"],
  shipper: ["reports.view"],
  carrier: [],
  viewer: ["reports.view","carrier.view","compliance.view"],
};

// ─── Utility Components ───────────────────────────────────────────────────────

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function StatusBadge({ status }: { status: LoadStatus }) {
  const cfg: Record<LoadStatus, { label: string; bg: string; text: string; dot: string }> = {
    "posted":         { label: "Posted",        bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
    "assigned":       { label: "Assigned",      bg: "#DBEAFE", text: "#1D4ED8", dot: "#3B82F6" },
    "rate-confirmed": { label: "Rate Confirmed",bg: "#EDE9FE", text: "#6D28D9", dot: "#8B5CF6" },
    "dispatched":     { label: "Dispatched",    bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
    "in-transit":     { label: "In Transit",    bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
    "delivered":      { label: "Delivered",     bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
    "pod-verified":   { label: "POD Verified",  bg: "#A7F3D0", text: "#064E3B", dot: "#059669" },
    "closed":         { label: "Closed",        bg: "#E5E7EB", text: "#374151", dot: "#6B7280" },
  };
  const c = cfg[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: c.bg, color: c.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {c.label}
    </span>
  );
}

function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  const cfg = {
    compliant: { icon: <CheckCircle size={11} />, label: "Compliant", bg: "#D1FAE5", text: "#065F46" },
    warning:   { icon: <AlertTriangle size={11} />, label: "Warning", bg: "#FEF3C7", text: "#92400E" },
    expired:   { icon: <XCircle size={11} />, label: "Expired", bg: "#FEE2E2", text: "#991B1B" },
    pending:   { icon: <Clock size={11} />, label: "Pending", bg: "#F3F4F6", text: "#374151" },
  };
  const c = cfg[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: c.bg, color: c.text }}>
      {c.icon} {c.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = {
    critical: { label: "Critical", bg: "#FEE2E2", text: "#991B1B" },
    high:     { label: "High",     bg: "#FEF3C7", text: "#92400E" },
    medium:   { label: "Medium",   bg: "#DBEAFE", text: "#1D4ED8" },
    low:      { label: "Low",      bg: "#F3F4F6", text: "#6B7280" },
  };
  const c = cfg[priority];
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide" style={{ backgroundColor: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const cfg: Record<string, { bg: string; text: string }> = {
    low:    { bg: "#D1FAE5", text: "#065F46" },
    medium: { bg: "#FEF3C7", text: "#92400E" },
    high:   { bg: "#FEE2E2", text: "#991B1B" },
  };
  const c = cfg[risk] || { bg: "#F3F4F6", text: "#374151" };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize" style={{ backgroundColor: c.bg, color: c.text }}>
      {risk} risk
    </span>
  );
}

function Avatar({ initials, color = "#4F46E5", size = "sm" }: { initials: string; color?: string; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "w-6 h-6 text-[10px]", md: "w-8 h-8 text-xs", lg: "w-10 h-10 text-sm" };
  return (
    <div className={cn("rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0", sz[size])} style={{ backgroundColor: color }}>
      {initials}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "#10B981" : score >= 75 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

function KPICard({ label, value, sub, icon, trend, color = "#4F46E5" }: {
  label: string; value: string; sub?: string; icon: React.ReactNode;
  trend?: { val: string; up: boolean }; color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-black/[0.06] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: color }}>
          {icon}
        </div>
        {trend && (
          <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", trend.up ? "text-emerald-600" : "text-red-500")}>
            {trend.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend.val}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-gray-900 tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-gray-100 rounded-lg", className)} />;
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {action}
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
        {icon}
      </div>
      <div className="text-sm font-medium text-gray-700 mb-1">{title}</div>
      <div className="text-xs text-gray-400 max-w-xs">{desc}</div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", icon: <LayoutDashboard size={16} />, label: "Dashboard" },
  { id: "loads", icon: <Package size={16} />, label: "Loads" },
  { id: "rate-confirmations", icon: <FileText size={16} />, label: "Rate Confirmations" },
  { id: "carriers", icon: <Truck size={16} />, label: "Carriers" },
  { id: "compliance", icon: <Shield size={16} />, label: "Compliance" },
  { id: "shippers", icon: <Building2 size={16} />, label: "Shippers" },
  { id: "staff", icon: <Users size={16} />, label: "Staff" },
  { id: "roles", icon: <Key size={16} />, label: "Roles & Permissions" },
  { id: "audit", icon: <ScrollText size={16} />, label: "Audit Logs" },
  { id: "reports", icon: <BarChart3 size={16} />, label: "Reports" },
  { id: "settings", icon: <Settings size={16} />, label: "Settings" },
];

function Sidebar({ active, onNav, onLogout }: { active: Page; onNav: (p: Page) => void; onLogout?: () => void }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "h-screen flex flex-col border-r border-black/[0.07] bg-white transition-all duration-200 flex-shrink-0",
      collapsed ? "w-14" : "w-56"
    )}>
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-black/[0.07] gap-2.5 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Zap size={14} className="text-white" />
        </div>
        {!collapsed && <span className="text-sm font-semibold text-gray-900">LoadFlow</span>}
        <button
          className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Org switcher */}
      {!collapsed && (
        <div className="px-3 py-2 border-b border-black/[0.07]">
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="w-5 h-5 rounded bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-700 flex-shrink-0">FL</div>
            <span className="text-xs font-medium text-gray-700 truncate flex-1">LoadFlow India Logistics</span>
            <ChevronDown size={12} className="text-gray-400 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id as Page)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all mb-0.5 group",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              )}
            >
              <span className={cn("flex-shrink-0 transition-colors", isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")}>
                {item.icon}
              </span>
              {!collapsed && <span className="text-xs font-medium truncate">{item.label}</span>}
              {isActive && !collapsed && <span className="ml-auto w-1 h-1 rounded-full bg-indigo-500" />}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-black/[0.07] space-y-1">
        <div className={cn("flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer", collapsed && "justify-center")}>
          <Avatar initials="SC" color="#4F46E5" size="sm" />
          {!collapsed && (
            <div className="flex-1 kmn-w-0">
              <div className="text-xs font-medium text-gray-800 truncate">Shreya Sharma</div>
              <div className="text-[10px] text-gray-400 truncate">Admin</div>
            </div>
          )}
        </div>
        {onLogout && (
          <button onClick={onLogout} className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-xs", collapsed && "justify-center")}>
            <LogOut size={13} />
            {!collapsed && <span>Sign out</span>}
          </button>
        )}
      </div>
    </aside>
  );
}

// ─── Top Nav ─────────────────────────────────────────────────────────────────
function TopNav({
  title,
  subtitle,
  onNav,
  setSelectedLoadId,
  setSelectedCarrierId,
}: {
  title: string;
  subtitle?: string;
  onNav: (p: Page) => void;
  setSelectedLoadId?: (id: string | null) => void;
  setSelectedCarrierId?: (id: string | null) => void;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults } = useGlobalSearch(searchQuery);
  const { data: notificationsData } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = notificationsData || [];
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <header className="h-14 border-b border-black/[0.07] bg-white flex items-center px-6 gap-4 flex-shrink-0 relative">
      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        {subtitle && <div className="text-[11px] text-gray-400">{subtitle}</div>}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 w-64 border border-black/[0.06] relative">
        <Search size={13} className="text-gray-400 flex-shrink-0" />
        <input
          placeholder="Search loads, carriers..."
          className="bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none flex-1 w-full"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <span className="text-[10px] text-gray-300 font-mono bg-gray-100 px-1 rounded">⌘K</span>

        {searchQuery.length >= 2 && searchResults?.results && (
          <div className="absolute top-12 left-0 w-80 bg-white rounded-2xl border border-black/[0.08] shadow-2xl z-50 max-h-96 overflow-y-auto p-2 space-y-1">
            <div className="text-[10px] font-semibold text-gray-400 px-3 py-1 uppercase tracking-wide">Search Results</div>
            {searchResults.results.length === 0 ? (
              <div className="text-xs text-gray-400 p-3 text-center">No results found</div>
            ) : (
              searchResults.results.map((res: any) => (
                <button
                  key={`${res.type}-${res.id}`}
                  onClick={() => {
                    setSearchQuery("");
                    if (res.type === "load") {
                      if (setSelectedLoadId) setSelectedLoadId(res.id);
                      onNav("load-detail");
                    } else if (res.type === "carrier") {
                      if (setSelectedCarrierId) setSelectedCarrierId(res.id);
                      onNav("carrier-detail");
                    } else if (res.type === "shipper") {
                      onNav("shippers");
                    } else if (res.type === "staff") {
                      onNav("staff");
                    }
                  }}
                  className="w-full flex flex-col items-start gap-0.5 px-3 py-2 rounded-xl hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="flex items-center gap-1.5 w-full">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md flex-shrink-0">
                      {res.type}
                    </span>
                    <span className="text-xs font-semibold text-gray-800 truncate">{res.title}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 truncate pl-1">{res.subtitle}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl border border-black/[0.08] shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-black/[0.06] flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <span onClick={() => markAllReadMutation.mutate()} className="text-[11px] text-indigo-600 font-medium cursor-pointer hover:text-indigo-800">Mark all read</span>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">No notifications</div>
            ) : (
              <div className="divide-y divide-black/[0.04] max-h-80 overflow-y-auto">
                {notifications.map((n: any) => (
                  <div
                    key={n.id}
                    onClick={() => markReadMutation.mutate(n.id)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-black/[0.04] last:border-0",
                      !n.read && "bg-indigo-50/30"
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-50/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {n.type === "POD" ? <CheckCircle size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-amber-500" />}
                    </div>
                    <div className="flex-1 kmn-w-0">
                      <div className={cn("text-xs font-medium text-gray-800", !n.read && "font-semibold")}>{n.title}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{n.message}</div>
                    </div>
                    <span className="text-[10px] text-gray-300 flex-shrink-0">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile */}
      <button className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1.5 rounded-xl transition-colors">
        <Avatar initials="SC" color="#4F46E5" size="sm" />
        <ChevronDown size={12} className="text-gray-400" />
      </button>
    </header>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ onNav }: { onNav: (p: Page) => void }) {
  const [activeCol, setActiveCol] = useState<LoadStatus | null>(null);

  const kpis = [
    { label: "Active Loads", value: "147", sub: "across all stages", icon: <Package size={16} />, trend: { val: "12%", up: true }, color: "#4F46E5" },
    { label: "In Transit", value: "38", sub: "on the road now", icon: <Truck size={16} />, trend: { val: "4%", up: true }, color: "#EF4444" },
    { label: "Delivered Today", value: "24", sub: "since kmdnight", icon: <CheckCircle size={16} />, trend: { val: "3%", up: false }, color: "#10B981" },
    { label: "Compliance Issues", value: "6", sub: "require attention", icon: <AlertTriangle size={16} />, trend: { val: "2", up: false }, color: "#F59E0B" },
    { label: "Revenue (MTD)", value: "₹24.3 Lakhs", sub: "July 2025", icon: <DollarSign size={16} />, trend: { val: "9%", up: true }, color: "#8B5CF6" },
    { label: "Avg Delivery Time", value: "1.4 days", sub: "last 30 days", icon: <Clock size={16} />, trend: { val: "6%", up: true }, color: "#3B82F6" },
    { label: "Carrier Utilization", value: "87%", sub: "active carriers", icon: <Target size={16} />, trend: { val: "2%", up: true }, color: "#06B6D4" },
  ];

  const alerts = [
    { severity: "error", title: "VRL Logistics authority inactive", sub: "LD-2851 blocked · Immediate action", icon: <XCircle size={14} /> },
    { severity: "warning", title: "Adani Transport insurance expires Jul 28", sub: "3 days remaining", icon: <AlertTriangle size={14} /> },
    { severity: "warning", title: "Equipment kmsmatch on LD-2848", sub: "Reefer required, Dry Van assigned", icon: <AlertTriangle size={14} /> },
    { severity: "error", title: "Missing POD — LD-2846", sub: "Delivered 2 days ago · Unverified", icon: <XCircle size={14} /> },
    { severity: "warning", title: "Covenant Insurance expires Aug 2", sub: "18 days remaining", icon: <Clock size={14} /> },
  ];

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-7 gap-4" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
          {kpis.map((k, i) => <KPICard key={i} {...k} />)}
        </div>

        {/* Main 2-col */}
        <div className="flex gap-6">
          {/* Kanban */}
          <div className="flex-1 kmn-w-0">
            <SectionHeader
              title="Load Board"
              action={
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100">
                    <Filter size={12} /> Filter
                  </button>
                  <button
                    onClick={() => onNav("create-load")}
                    className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-3 py-1.5 rounded-lg"
                  >
                    <Plus size={12} /> New Load
                  </button>
                </div>
              }
            />
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">
              {KANBAN_COLS.map(col => {
                const colLoads = LOADS.filter(l => l.status === col.id);
                return (
                  <div key={col.id} className="flex-shrink-0 w-56">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                      <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">{col.label}</span>
                      <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5">{colLoads.length}</span>
                    </div>
                    <div className="space-y-2">
                      {colLoads.map(load => {
                        const mappedLoad = {
                          ...load,
                          id: load.loadNumber,
                          shipper: load.shipper?.name || 'Unknown',
                          carrier: load.carrier?.name || 'Unassigned',
                          pickup: new Date(load.pickupDate).toLocaleDateString(),
                          delivery: new Date(load.deliveryDate).toLocaleDateString(),
                          revenue: load.revenue,
                          equipment: load.equipmentType,
                          status: load.status,
                          priority: load.priority,
                          origin: load.origin,
                          destination: load.destination,
                          compliance: load.carrier?.complianceHold ? 'hold' : 'compliant',
                        };
                        return (
                          <div
                            key={load.id}
                            onClick={() => { setSelectedLoadId(load.id); onNav("load-detail"); }}
                            className="bg-white rounded-xl p-3 border border-black/[0.06] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-semibold text-indigo-600 font-mono">{mappedLoad.id}</span>
                              <PriorityBadge priority={mappedLoad.priority} />
                            </div>
                            <div className="text-xs font-medium text-gray-800 mb-1 truncate">{mappedLoad.shipper}</div>
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-2">
                              <MapPin size={10} className="flex-shrink-0" />
                              <span className="truncate">{(mappedLoad.origin || "").split(",")[0]} → {(mappedLoad.destination || "").split(",")[0]}</span>
                            </div>
                            <div className="text-[11px] text-gray-500 mb-2 truncate">{mappedLoad.equipment}</div>
                            <div className="flex items-center justify-between">
                              <ComplianceBadge status={mappedLoad.compliance} />
                              <span className="text-[10px] text-gray-400">{mappedLoad.pickup}</span>
                            </div>
                            {mappedLoad.carrier !== "Unassigned" && (
                              <div className="mt-2 pt-2 border-t border-black/[0.05] text-[11px] text-gray-400 truncate">
                                {mappedLoad.carrier}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {colLoads.length === 0 && (
                        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 py-6 flex items-center justify-center">
                          <span className="text-[11px] text-gray-300">Empty</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel */}
          <div className="w-64 flex-shrink-0 space-y-4">
            {/* Compliance Alerts */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-black/[0.06] flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-900">Compliance Alerts</span>
                <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium">6 issues</span>
              </div>
              <div className="divide-y divide-black/[0.04]">
                {alerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                    <span className={a.severity === "error" ? "text-red-500 mt-0.5 flex-shrink-0" : "text-amber-500 mt-0.5 flex-shrink-0"}>
                      {a.icon}
                    </span>
                    <div>
                      <div className="text-[11px] font-medium text-gray-800">{a.title}</div>
                      <div className="text-[10px] text-gray-400">{a.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-black/[0.06]">
                <span className="text-xs font-semibold text-gray-900">Status Distribution</span>
              </div>
              <div className="p-3">
                <ResponsiveContainer width="100%" height={120}>
                  <RePieChart>
                    <Pie data={STATUS_DIST} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                      {STATUS_DIST.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.08)" }} />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {STATUS_DIST.map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-[10px] text-gray-500 truncate">{s.name}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{s.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
            <SectionHeader title="Revenue Trend" action={<span className="text-xs text-gray-400">Last 7 months</span>} />
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₹${(v/1000).toFixed(0)}k`, "Revenue"]} contentStyle={{ fontSize: "11px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.08)" }} />
                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
            <SectionHeader title="Carrier On-Time Performance" action={<span className="text-xs text-gray-400">Last 30 days</span>} />
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={CARRIER_PERF} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="carrier" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`, "On-Time"]} contentStyle={{ fontSize: "11px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.08)" }} />
                <Bar dataKey="onTime" fill="#10B981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadDetail({ onNav, loadId, setSelectedCarrierId }: { onNav: (p: Page) => void; loadId: string | null; setSelectedCarrierId: (id: string | null) => void }) {
  const { data: loadData, isLoading } = useLoadDetail(loadId);
  const { mutate: uploadPOD } = useUploadPOD();
  const { data: carriersData } = useCarriers();
  const carriers = carriersData || [];
  const assignCarrierMutation = useAssignCarrier();
  const deleteLoadMutation = useDeleteLoad();
  const approveRCMutation = useApproveRC();
  const createRCMutation = useCreateRC();
  const deleteRCMutation = useDeleteRC();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedEvent, setExpandedEvent] = useState<number | null>(4);

  const [rcBase, setRcBase] = useState("");
  const [rcAccessorial, setRcAccessorial] = useState("");
  const [rcFuel, setRcFuel] = useState("");
  const [rcDetention, setRcDetention] = useState("");
  const [rcNotes, setRcNotes] = useState("");
  const [assigningCarrierId, setAssigningCarrierId] = useState("");

  const [editingRcId, setEditingRcId] = useState<string | null>(null);
  const [editRcForm, setEditRcForm] = useState({ base: "", accessorial: "", fuel: "", detention: "", notes: "" });

  const tabs = ["Overview", "Documents", "Rate Confirmation", "Audit Trail", "Compliance History"];

  if (isLoading) return <div className="p-6">Loading load details...</div>;
  if (!loadData) return <div className="p-6">Load not found</div>;

  const mappedLoad = {
    ...loadData,
    id: loadData.loadNumber,
    shipper: loadData.shipper?.name || 'Unknown',
    carrier: loadData.carrier?.name || 'Unassigned',
    pickup: new Date(loadData.pickupDate).toLocaleDateString(),
    delivery: new Date(loadData.deliveryDate).toLocaleDateString(),
    revenue: loadData.revenue,
    equipment: loadData.equipmentType || loadData.equipment,
    status: loadData.status,
    priority: loadData.priority,
    origin: loadData.origin,
    destination: loadData.destination,
    pods: loadData.pods || [],
    rateConfirmations: loadData.rateConfirmations || [],
    timeline: loadData.timeline || [],
  };

  const handleAssignCarrier = async () => {
    if (!assigningCarrierId) return;
    try {
      await assignCarrierMutation.mutateAsync({ loadId: mappedLoad.dbId || mappedLoad.loadNumber, carrierId: assigningCarrierId });
      toast.success("Carrier assigned successfully!");
      queryClient.invalidateQueries({ queryKey: ['load-detail', loadId] });
      queryClient.invalidateQueries({ queryKey: ['loads'] });
    } catch {}
  };

  const handleDeleteLoad = async () => {
    if (confirm("Are you sure you want to delete this load?")) {
      try {
        await deleteLoadMutation.mutateAsync(mappedLoad.dbId || mappedLoad.loadNumber);
        onNav("loads");
      } catch {}
    }
  };

  const handleCreateRC = async () => {
    try {
      await createRCMutation.mutateAsync({
        loadId: mappedLoad.dbId || mappedLoad.loadNumber,
        baseRate: parseFloat(rcBase) || 0,
        accessorial: parseFloat(rcAccessorial) || 0,
        fuel: parseFloat(rcFuel) || 0,
        detention: parseFloat(rcDetention) || 0,
        notes: rcNotes
      });
      setRcBase(""); setRcAccessorial(""); setRcFuel(""); setRcDetention(""); setRcNotes("");
      queryClient.invalidateQueries({ queryKey: ['load-detail', loadId] });
    } catch {}
  };

  const handleSaveRcEdit = async (rcId: string) => {
    try {
      await api.patch(`/rate-confirmations/${rcId}`, {
        baseRate: parseFloat(editRcForm.base) || 0,
        accessorial: parseFloat(editRcForm.accessorial) || 0,
        fuel: parseFloat(editRcForm.fuel) || 0,
        detention: parseFloat(editRcForm.detention) || 0,
        notes: editRcForm.notes
      });
      toast.success("Rate confirmation updated successfully!");
      setEditingRcId(null);
      queryClient.invalidateQueries({ queryKey: ['load-detail', loadId] });
    } catch {
      toast.error("Failed to edit rate confirmation.");
    }
  };

  const handleDeleteRC = async (rcId: string) => {
    if (confirm("Are you sure you want to delete this rate confirmation version?")) {
      try {
        await deleteRCMutation.mutateAsync(rcId);
        queryClient.invalidateQueries({ queryKey: ['load-detail', loadId] });
      } catch {}
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Breadcrumb */}
      <div className="px-6 py-3 flex items-center gap-2 text-xs text-gray-400 border-b border-black/[0.06] bg-white flex-shrink-0">
        <button onClick={() => onNav("loads")} className="hover:text-gray-700 transition-colors">Loads</button>
        <ChevronRight size={12} />
        <span className="text-gray-700 font-medium">{mappedLoad.id}</span>
        <StatusBadge status={mappedLoad.status} />
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Header card */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-semibold text-gray-900">{mappedLoad.id}</h1>
                <StatusBadge status={mappedLoad.status} />
                <PriorityBadge priority={mappedLoad.priority} />
              </div>
              <div className="text-sm text-gray-500">{mappedLoad.shipper} · Created {new Date(mappedLoad.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDeleteLoad} className="flex items-center gap-1.5 text-xs font-medium text-red-600 border border-red-100 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
                <Trash2 size={12} /> Delete Load
              </button>
              <button className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-black/[0.1] px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                <Edit2 size={12} /> Edit
              </button>
              <button onClick={() => setActiveTab("documents")} className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl transition-colors">
                <Upload size={12} /> Upload POD
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Origin</div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800">{(mappedLoad.origin || "").split(",")[0]}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{mappedLoad.origin}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Destination</div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800">{(mappedLoad.destination || "").split(",")[0]}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{mappedLoad.destination}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Equipment</div>
              <span className="text-sm font-medium text-gray-800">{mappedLoad.equipment}</span>
              <div className="text-xs text-gray-400 mt-0.5">Assigned: {mappedLoad.carrier}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Revenue</div>
              <span className="text-sm font-semibold text-gray-900">₹{mappedLoad.revenue.toLocaleString()}</span>
              <div className="text-xs text-gray-400 mt-0.5">Pickup: {mappedLoad.pickup}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left: Timeline + Tabs */}
          <div className="flex-1 kmn-w-0 space-y-4">
            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
              <div className="flex border-b border-black/[0.06]">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase().replace(" ", "-"))}
                    className={cn(
                      "px-4 py-3 text-xs font-medium transition-colors whitespace-nowrap",
                      activeTab === tab.toLowerCase().replace(" ", "-")
                        ? "text-indigo-600 border-b-2 border-indigo-600 -mb-px"
                        : "text-gray-500 hover:text-gray-800"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-5">
                {activeTab === "overview" && (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {[
                      ["Shipper", mappedLoad.shipper],
                      ["Carrier", mappedLoad.carrier],
                      ["Driver", "Jaspreet Singh"],
                      ["Truck #", "IL-4829"],
                      ["Trailer #", "3812-R"],
                      ["Commodity", mappedLoad.commodity || "General Freight"],
                      ["Weight", `${mappedLoad.weight?.toLocaleString() || 40000} lbs`],
                      ["Pickup Date", mappedLoad.pickup],
                      ["Est. Delivery", mappedLoad.delivery],
                      ["Special Instructions", mappedLoad.notes || "None"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-0.5">
                        <span className="text-gray-400 uppercase tracking-wide text-[10px]">{k}</span>
                        <span className="text-gray-800 font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "documents" && (
                  <div className="space-y-4">
                    <div className="border border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50">
                      <span className="text-xs text-gray-500 font-medium mb-2">Upload Proof of Delivery (POD)</span>
                      <input 
                        type="file" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            uploadPOD({ loadId: mappedLoad.dbId || mappedLoad.loadNumber, file });
                          }
                        }}
                        className="text-xs text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      {(mappedLoad.pods || []).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-3 border rounded-xl bg-white text-xs">
                          <div>
                            <div className="font-semibold text-gray-800">{p.fileName}</div>
                            <div className="text-[10px] text-gray-400">{p.fileSize} · Version {p.versionNumber} · {p.approvalStatus}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a href={`/api/pod/download/${p.id}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">Download</a>
                            {p.approvalStatus === 'PENDING' && (
                              <button onClick={() => api.put(`/pod/${p.id}/approve`).then(() => { toast.success('POD Approved!'); queryClient.invalidateQueries({ queryKey: ['load-detail', loadId] }); })} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[10px] font-semibold hover:bg-emerald-100 transition-colors">Verify</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === "rate-confirmation" && (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-xl bg-gray-50 space-y-3 text-xs">
                      <span className="font-semibold text-gray-700">Create New Rate Confirmation Version</span>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" placeholder="Base Rate (₹)" value={rcBase} onChange={e => setRcBase(e.target.value)} className="p-1.5 border rounded bg-white" />
                        <input type="number" placeholder="Accessorials (₹)" value={rcAccessorial} onChange={e => setRcAccessorial(e.target.value)} className="p-1.5 border rounded bg-white" />
                        <input type="number" placeholder="Fuel (₹)" value={rcFuel} onChange={e => setRcFuel(e.target.value)} className="p-1.5 border rounded bg-white" />
                        <input type="number" placeholder="Detention (₹)" value={rcDetention} onChange={e => setRcDetention(e.target.value)} className="p-1.5 border rounded bg-white" />
                        <input type="text" placeholder="Notes" value={rcNotes} onChange={e => setRcNotes(e.target.value)} className="p-1.5 border rounded bg-white col-span-2" />
                      </div>
                      <button onClick={handleCreateRC} className="bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-lg font-medium">Create RC Version</button>
                    </div>
                    <div className="space-y-2">
                      {(mappedLoad.rateConfirmations || []).map((r: any) => (
                        <div key={r.id} className="p-3 border rounded-xl bg-white text-xs space-y-2">
                          {editingRcId === r.id ? (
                            <div className="space-y-3">
                              <span className="font-semibold text-gray-700">Edit Version {r.versionNumber}</span>
                              <div className="grid grid-cols-2 gap-2">
                                <input type="number" placeholder="Base" value={editRcForm.base} onChange={e => setEditRcForm({ ...editRcForm, base: e.target.value })} className="p-1 border rounded bg-white" />
                                <input type="number" placeholder="Accessorials" value={editRcForm.accessorial} onChange={e => setEditRcForm({ ...editRcForm, accessorial: e.target.value })} className="p-1 border rounded bg-white" />
                                <input type="number" placeholder="Fuel" value={editRcForm.fuel} onChange={e => setEditRcForm({ ...editRcForm, fuel: e.target.value })} className="p-1 border rounded bg-white" />
                                <input type="number" placeholder="Detention" value={editRcForm.detention} onChange={e => setEditRcForm({ ...editRcForm, detention: e.target.value })} className="p-1 border rounded bg-white" />
                                <input type="text" placeholder="Notes" value={editRcForm.notes} onChange={e => setEditRcForm({ ...editRcForm, notes: e.target.value })} className="p-1 border rounded bg-white col-span-2" />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleSaveRcEdit(r.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-semibold">Save</button>
                                <button onClick={() => setEditingRcId(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-[10px] font-medium">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-800">Version {r.versionNumber} ({r.rcNumber})</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{r.status}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-gray-600 text-[11px]">
                                <div>Base: ₹{r.baseRate.toLocaleString()}</div>
                                <div>Accessorials: ₹{r.accessorialCharges.toLocaleString()}</div>
                                <div>Fuel: ₹{r.fuelSurcharge.toLocaleString()}</div>
                                <div>Detention: ₹{r.detentionCharges.toLocaleString()}</div>
                              </div>
                              <div className="text-[10px] text-gray-400 italic">Notes: {r.notes || "None"}</div>
                              <div className="flex gap-2 mt-2">
                                {r.status === 'PENDING' && (
                                  <>
                                    <button onClick={() => approveRCMutation.mutate(r.id)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1 rounded-lg font-medium">Sign & Approve</button>
                                    <button onClick={() => { setEditingRcId(r.id); setEditRcForm({ base: r.baseRate.toString(), accessorial: r.accessorialCharges.toString(), fuel: r.fuelSurcharge.toString(), detention: r.detentionCharges.toString(), notes: r.notes || "" }); }} className="bg-gray-50 border px-2 py-1 rounded-lg font-medium text-gray-600 hover:bg-gray-100">Edit</button>
                                    <button onClick={() => handleDeleteRC(r.id)} className="bg-red-50 text-red-700 px-2 py-1 rounded-lg font-medium hover:bg-red-100">Delete</button>
                                  </>
                                )}
                                <a href={`/api/rate-confirmations/${r.id}/download`} className="text-center px-3 py-1 border rounded-lg bg-gray-50 font-medium text-gray-600 hover:bg-gray-100" download>Download</a>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === "audit-trail" && (
                  <div className="space-y-3">
                    {mappedLoad.timeline.length === 0 ? (
                      <div className="text-xs text-gray-400 text-center py-4">No timeline events logged.</div>
                    ) : (
                      mappedLoad.timeline.map((t: any, i: number) => (
                        <div key={i} className="text-xs p-3 border rounded-xl bg-white">
                          <div className="font-semibold text-gray-800">{t.status}</div>
                          <div className="text-[10px] text-gray-400">{new Date(t.timestamp).toLocaleString()} by {t.user?.name || 'System'}</div>
                          <div className="text-gray-600 mt-1 italic">"{t.note}"</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {activeTab === "compliance-history" && (
                  <div className="text-xs space-y-3">
                    <span className="font-semibold text-gray-800">Compliance & Regulatory Logs</span>
                    {loadData.carrier ? (
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between"><span>Carrier Name</span><span className="font-medium">{loadData.carrier.name}</span></div>
                        <div className="flex justify-between"><span>DOT Number</span><span className="font-mono">{loadData.carrier.compliance?.dotNumber || "N/A"}</span></div>
                        <div className="flex justify-between"><span>MC Number</span><span className="font-mono">{loadData.carrier.compliance?.mcNumber || "N/A"}</span></div>
                        <div className="flex justify-between"><span>Authority Status</span><span className={cn("font-semibold", loadData.carrier.compliance?.authorityStatus === 'ACTIVE' ? "text-emerald-600" : "text-red-600")}>{loadData.carrier.compliance?.authorityStatus || "UNKNOWN"}</span></div>
                        <div className="flex justify-between"><span>Insurance Expire Date</span><span>{loadData.carrier.compliance?.insuranceExpiry ? new Date(loadData.carrier.compliance.insuranceExpiry).toLocaleDateString() : "N/A"}</span></div>
                      </div>
                    ) : (
                      <div className="text-gray-400 py-3 text-center">Assign a carrier to track compliance records.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Timeline + Carrier */}
          <div className="w-72 flex-shrink-0 space-y-4">
            {/* Shipment Timeline */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-black/[0.06]">
                <span className="text-xs font-semibold text-gray-900">Shipment Timeline</span>
              </div>
              <div className="p-4">
                <div className="relative">
                  {(mappedLoad.timeline || []).map((t: any, i: number) => ({ ...t, done: true, user: t.user?.name || "System", time: new Date(t.timestamp).toLocaleString() })).map((event: any, i: number) => (
                    <div key={i} className="relative flex gap-3">
                      {/* Line */}
                      {i < mappedLoad.timeline.length - 1 && (
                        <div className="absolute left-3 top-6 w-px h-full -translate-x-1/2 bg-emerald-200" />
                      )}
                      {/* Dot */}
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 mt-0.5",
                        i === mappedLoad.timeline.length - 1
                          ? "bg-indigo-600 ring-2 ring-indigo-100"
                          : "bg-emerald-500"
                      )}>
                        {i === mappedLoad.timeline.length - 1
                          ? <Activity size={10} className="text-white" />
                          : <Check size={10} className="text-white" />}
                      </div>
                      {/* Content */}
                      <div className="flex-1 kmn-w-0 pb-4">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedEvent(expandedEvent === i ? null : i)}
                        >
                          <span className="text-xs font-medium text-gray-800">{event.status}</span>
                          <span className="text-[10px] text-gray-400">{event.time.split(" ").slice(-2).join(" ")}</span>
                        </div>
                        {expandedEvent === i && (
                          <div className="mt-2 p-2.5 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Avatar initials={event.user.split(" ").map((w: string) => w[0]).join("")} size="sm" color="#4F46E5" />
                              <span className="text-[11px] font-medium text-gray-700">{event.user}</span>
                            </div>
                            <div className="text-[11px] text-gray-500">{event.note}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Carrier Panel */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-black/[0.06] flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-900">Carrier</span>
                {loadData.carrier && (
                  <button
                    onClick={() => {
                      setSelectedCarrierId(loadData.carrier.id);
                      onNav("carrier-detail");
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    View profile →
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3">
                {loadData.carrier ? (
                  <>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-700">
                        {loadData.carrier.name.split(" ").map((w: string) => w[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{loadData.carrier.name}</div>
                        <div className="text-[11px] text-gray-400">
                          DOT #{loadData.carrier.compliance?.dotNumber || 'PENDING'} · MC #{loadData.carrier.compliance?.mcNumber || 'PENDING'}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Compliance Score</span>
                        <span className="font-semibold text-emerald-600">
                          {loadData.carrier.compliance?.complianceScore || 100}/100
                        </span>
                      </div>
                      <ScoreBadge score={loadData.carrier.compliance?.complianceScore || 100} />
                      {[
                        { label: "Insurance", value: loadData.carrier.compliance?.insuranceExpiry ? new Date(loadData.carrier.compliance.insuranceExpiry).toLocaleDateString() : 'N/A', ok: true },
                        { label: "Authority", value: loadData.carrier.compliance?.authorityStatus || 'UNKNOWN', ok: loadData.carrier.compliance?.authorityStatus === 'ACTIVE' },
                        { label: "Risk level", value: loadData.carrier.compliance?.riskScore !== undefined ? (loadData.carrier.compliance.riskScore <= 3 ? 'Low' : loadData.carrier.compliance.riskScore <= 7 ? 'Medium' : 'High') : 'Low', ok: true },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 border-t border-black/[0.04]">
                          <span className="text-gray-500">{row.label}</span>
                          <span className={cn("font-medium", row.ok ? "text-gray-800" : "text-red-600")}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <span className="text-xs text-gray-400 block">No carrier assigned yet.</span>
                    <select
                      value={assigningCarrierId}
                      onChange={e => setAssigningCarrierId(e.target.value)}
                      className="w-full text-xs p-2 border rounded-xl bg-gray-50 text-gray-700"
                    >
                      <option value="">Select Carrier...</option>
                      {carriers.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignCarrier}
                      disabled={!assigningCarrierId || assignCarrierMutation.isPending}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-xl transition-colors disabled:opacity-60"
                    >
                      {assignCarrierMutation.isPending ? "Assigning..." : "Assign Carrier"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CREATE LOAD WIZARD ───────────────────────────────────────────────────────
function CreateLoad({ onNav }: { onNav: (p: Page) => void }) {
  const createLoadMutation = useCreateLoad();
  const { data: shippersData } = useShippers();
  const shippers = shippersData || [];
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const steps = ["Pickup", "Delivery", "Commodity", "Equipment", "Review"];

  const [form, setForm] = useState({
    origin: "", originAddr: "", pickupDate: "", pickupTime: "08:00 – 12:00",
    dest: "", destAddr: "", deliveryDate: "", deliveryTime: "14:00 – 18:00",
    commodity: "", weight: "", temp: "",
    equipment: "dry-van", notes: "",
    shipper: "", declaredValue: "", hazmat: "No",
  });

  const [aiText, setAiText] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    if (shippers.length > 0 && !form.shipper) {
      setForm(prev => ({ ...prev, shipper: shippers[0].id }));
    }
  }, [shippers]);

  const handleAiExtract = async () => {
    if (!aiText.trim()) return;
    setParsing(true);
    try {
      const res = await api.post("/loads/ai-parse", { text: aiText });
      const parsed = res.data;
      
      setForm(prev => ({
        ...prev,
        origin: parsed.origin || prev.origin,
        originAddr: parsed.originAddress || prev.originAddr,
        pickupDate: parsed.pickupDate || prev.pickupDate,
        dest: parsed.destination || prev.dest,
        destAddr: parsed.destinationAddress || prev.destAddr,
        deliveryDate: parsed.deliveryDate || prev.deliveryDate,
        commodity: parsed.commodity || prev.commodity,
        weight: parsed.weight ? parsed.weight.toString() : prev.weight,
        temp: parsed.temperature !== undefined ? parsed.temperature.toString() : prev.temp,
        equipment: parsed.equipment || prev.equipment,
        notes: parsed.notes || prev.notes,
      }));

      setAiSuggestions([
        { label: "Origin", value: parsed.origin, field: "origin" },
        { label: "Destination", value: parsed.destination, field: "dest" },
        { label: "Equipment", value: parsed.equipment, field: "equipment" },
        { label: "Weight", value: `${parsed.weight} lbs`, field: "weight" },
      ]);
      toast.success("AI Extracted fields applied to form!");
    } catch (err) {
      toast.error("Failed to parse text. Please write manually.");
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.origin || !form.dest || !form.pickupDate || !form.deliveryDate || !form.commodity || !form.weight) {
      toast.error("Please fill in all required fields marked with *");
      return;
    }
    try {
      const payload = {
        shipperId: form.shipper,
        origin: form.origin,
        originAddress: form.originAddr || null,
        destination: form.dest,
        destinationAddress: form.destAddr || null,
        pickupDate: form.pickupDate,
        deliveryDate: form.deliveryDate,
        commodity: form.commodity,
        weight: parseFloat(form.weight) || 0,
        equipment: form.equipment,
        notes: form.notes || null,
        declaredValue: form.declaredValue ? parseFloat(form.declaredValue) : null,
        temperature: form.temp ? parseFloat(form.temp) : null,
        hazmat: form.hazmat !== "No",
      };
      await createLoadMutation.mutateAsync(payload);
      onNav("loads");
    } catch (err) {
      // Error toast is already triggered by client
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Progress */}
      <div className="bg-white border-b border-black/[0.07] px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => onNav("loads")} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
            <ChevronLeft size={12} /> Cancel
          </button>
          <span className="text-sm font-semibold text-gray-900 ml-2">Create New Load</span>
        </div>
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
                i + 1 < step ? "bg-emerald-500 text-white" : i + 1 === step ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400"
              )}>
                {i + 1 < step ? <Check size={12} /> : i + 1}
              </div>
              <span className={cn("text-xs font-medium whitespace-nowrap", i + 1 === step ? "text-indigo-600" : "text-gray-400")}>{s}</span>
              {i < steps.length - 1 && (
                <div className={cn("flex-1 h-px", i + 1 < step ? "bg-emerald-300" : "bg-gray-200")} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-6 max-w-5xl mx-auto">
          {/* Form */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-6">
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Pickup Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Origin City, State *</label>
                      <input
                        value={form.origin}
                        onChange={e => setForm({ ...form, origin: e.target.value })}
                        placeholder="Mumbai, MH"
                        className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Street Address</label>
                      <input
                        value={form.originAddr}
                        onChange={e => setForm({ ...form, originAddr: e.target.value })}
                        placeholder="2847 W Grand Ave"
                        className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Pickup Date *</label>
                      <input
                        type="date"
                        value={form.pickupDate}
                        onChange={e => setForm({ ...form, pickupDate: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Pickup Window</label>
                      <input
                        value={form.pickupTime}
                        onChange={e => setForm({ ...form, pickupTime: e.target.value })}
                        placeholder="08:00 – 12:00"
                        className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Assigned Shipper</label>
                    <select
                      value={form.shipper}
                      onChange={e => setForm({ ...form, shipper: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                    >
                      {shippers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Special Instructions</label>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      placeholder="Any special requirements or notes for pickup..."
                      className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Delivery Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Destination City, State *</label>
                      <input
                        value={form.dest}
                        onChange={e => setForm({ ...form, dest: e.target.value })}
                        placeholder="Delhi, DL"
                        className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Street Address</label>
                      <input
                        value={form.destAddr}
                        onChange={e => setForm({ ...form, destAddr: e.target.value })}
                        placeholder="1200 Lebanon Pike"
                        className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Expected Delivery Date *</label>
                      <input
                        type="date"
                        value={form.deliveryDate}
                        onChange={e => setForm({ ...form, deliveryDate: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Delivery Window</label>
                      <input
                        value={form.deliveryTime}
                        onChange={e => setForm({ ...form, deliveryTime: e.target.value })}
                        placeholder="14:00 – 18:00"
                        className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Commodity Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Commodity *</label>
                      <input
                        value={form.commodity}
                        onChange={e => setForm({ ...form, commodity: e.target.value })}
                        placeholder="Frozen Foods"
                        className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Total Weight (lbs) *</label>
                      <input
                        type="number"
                        value={form.weight}
                        onChange={e => setForm({ ...form, weight: e.target.value })}
                        placeholder="42000"
                        className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Declared Value (₹)</label>
                      <input
                        type="number"
                        value={form.declaredValue}
                        onChange={e => setForm({ ...form, declaredValue: e.target.value })}
                        placeholder="85000"
                        className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Hazmat</label>
                      <select
                        value={form.hazmat}
                        onChange={e => setForm({ ...form, hazmat: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      >
                        <option>No</option>
                        <option>Yes — Class 1</option>
                        <option>Yes — Class 2</option>
                        <option>Yes — Class 3</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Equipment Selection</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "dry-van", label: "Dry Van", sub: "48' / 53'" },
                      { id: "reefer", label: "Reefer", sub: "Temperature controlled" },
                      { id: "flatbed", label: "Flatbed", sub: "48' / 53'" },
                      { id: "step-deck", label: "Step Deck", sub: "Overdimensional" },
                      { id: "lowboy", label: "Lowboy", sub: "Heavy haul" },
                      { id: "power-only", label: "Power Only", sub: "Drop/hook" },
                    ].map(eq => (
                      <label key={eq.id} className={cn(
                        "flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        form.equipment === eq.id ? "border-indigo-400 bg-indigo-50" : "border-black/[0.08] hover:border-black/20"
                      )}>
                        <input type="radio" name="equipment" value={eq.id} className="sr-only" onChange={() => setForm({ ...form, equipment: eq.id })} />
                        <span className="text-sm font-medium text-gray-800">{eq.label}</span>
                        <span className="text-[11px] text-gray-400">{eq.sub}</span>
                      </label>
                    ))}
                  </div>
                  {form.equipment === "reefer" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Temperature Requirement (°F)</label>
                      <input
                        type="number"
                        value={form.temp}
                        onChange={e => setForm({ ...form, temp: e.target.value })}
                        placeholder="34"
                        className="w-48 px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      />
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Review & Confirm</h2>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                    {[
                      ["Shipper", shippers.find(s => s.id === form.shipper)?.name || form.shipper || "Reliance Fresh"],
                      ["Origin", `${form.origin} — ${form.originAddr || "N/A"}`],
                      ["Destination", `${form.dest} — ${form.destAddr || "N/A"}`],
                      ["Pickup Date", `${form.pickupDate || "TBD"} · ${form.pickupTime}`],
                      ["Expected Delivery Date", `${form.deliveryDate || "TBD"} · ${form.deliveryTime}`],
                      ["Equipment", form.equipment.toUpperCase()],
                      ["Commodity", `${form.commodity || "N/A"} · ${form.weight ? parseFloat(form.weight).toLocaleString() : "0"} lbs`],
                      ["Declared Value", form.declaredValue ? `₹${parseFloat(form.declaredValue).toLocaleString()}` : "N/A"],
                      ["Temperature Requirement", form.temp ? `${form.temp} °F` : "N/A"],
                      ["Hazmat", form.hazmat],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-1 border-b border-black/[0.02] last:border-0">
                        <span className="text-gray-400 text-xs">{k}</span>
                        <span className="text-gray-800 font-medium text-xs">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-8 pt-4 border-t border-black/[0.06]">
                <button
                  onClick={() => step > 1 ? setStep(step - 1) : onNav("loads")}
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-xl hover:bg-gray-100"
                >
                  <ChevronLeft size={14} /> {step === 1 ? "Cancel" : "Back"}
                </button>
                <button
                  onClick={() => step < totalSteps ? setStep(step + 1) : handleSubmit()}
                  disabled={createLoadMutation.isPending}
                  className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
                >
                  {step === totalSteps ? (createLoadMutation.isPending ? "Creating..." : "Create Load") : "Continue"} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* AI Panel */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-gradient-to-br from-indigo-950 to-indigo-800 rounded-2xl p-5 text-white sticky top-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                  <Zap size={12} className="text-indigo-200" />
                </div>
                <span className="text-xs font-semibold">AI Field Extractor</span>
                <span className="ml-auto text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded-full">Beta</span>
              </div>
              <p className="text-xs text-indigo-200 mb-4">Paste a shipment description and we'll extract the fields automatically.</p>
              <textarea
                rows={5}
                value={aiText}
                onChange={e => setAiText(e.target.value)}
                placeholder="E.g: Need a reefer from Chicago to Nashville July 15, 42k lbs frozen foods, keep at 34°F, pickup at 2847 W Grand Ave 8am..."
                className="w-full bg-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/40 outline-none resize-none border border-white/10 focus:border-white/30 transition-colors"
              />
              <button
                onClick={handleAiExtract}
                disabled={parsing || !aiText.trim()}
                className="w-full mt-3 bg-white text-indigo-700 text-xs font-semibold py-2.5 rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-60"
              >
                {parsing ? "Extracting..." : "Extract Fields →"}
              </button>
              {aiSuggestions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-[11px] text-indigo-300 uppercase tracking-wide mb-2">Suggested</div>
                  {aiSuggestions.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                      <div>
                        <div className="text-[10px] text-indigo-300">{s.label}</div>
                        <div className="text-xs font-medium truncate w-40">{s.value}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-indigo-300">99%</span>
                        <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center">
                          <Check size={10} className="text-emerald-300" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CARRIERS PAGE ────────────────────────────────────────────────────────────
function CarriersPage({ onNav, setSelectedCarrierId }: { onNav: (p: Page) => void; setSelectedCarrierId: (id: string) => void }) {
  const [tab, setTab] = useState("all");
  const { data: carriersData, isLoading } = useCarriers();
  const createCarrierMutation = useCreateCarrier();
  const updateCarrierMutation = useUpdateCarrier();
  const deleteCarrierMutation = useDeleteCarrier();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<any>(null);

  const [name, setName] = useState("");
  const [dot, setDot] = useState("");
  const [mc, setMc] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");

  if (isLoading) {
    return <div className="p-6">Loading carriers directory...</div>;
  }

  const CARRIERS = (carriersData || []).map((c: any) => ({
    ...c,
    dot: c.compliance?.dotNumber || 'DOT-PENDING',
    mc: c.compliance?.mcNumber || 'MC-PENDING',
    compliance: c.compliance ? (c.compliance.insuranceStatus === 'ACTIVE' && c.compliance.authorityStatus === 'ACTIVE' ? 'compliant' : 'warning') : 'compliant',
    score: c.compliance?.complianceScore || 100,
    onTime: 96,
    avgRate: 3.10,
    acceptRate: 92,
    risk: c.compliance ? (c.compliance.insuranceStatus === 'ACTIVE' && c.compliance.authorityStatus === 'ACTIVE' ? 'low' : 'medium') : 'low',
    equipment: ['Dry Van', 'Reefer']
  }));

  const filteredCarriers = CARRIERS.filter((c: any) => {
    if (tab === "active") return c.compliance === "compliant";
    if (tab === "warning") return c.compliance === "warning";
    if (tab === "expired") {
      if (!c.compliance?.insuranceExpiry) return false;
      return new Date(c.compliance.insuranceExpiry) < new Date();
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Carriers</h1>
          <p className="text-xs text-gray-400 mt-0.5">{filteredCarriers.length} total displayed</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs text-gray-600 border border-black/[0.1] px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <Download size={12} /> Export
          </button>
          <button onClick={() => { setName(""); setDot(""); setMc(""); setInsuranceExpiry(""); setShowAddModal(true); }} className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl transition-colors">
            <Plus size={12} /> Add Carrier
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {["all", "active", "warning", "expired"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all",
            tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
          )}>{t}</button>
        ))}
      </div>

      {/* Recommendation Panel */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-5 mb-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star size={14} className="text-yellow-300" />
              <span className="text-sm font-semibold">Top Carrier Recommendations</span>
            </div>
            <p className="text-xs text-indigo-200">Ranked by compliance score, on-time rate, and route compatibility</p>
          </div>
          <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">View all →</button>
        </div>
        <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
          {CARRIERS.slice(0, 3).map((c, i) => (
            <div key={i} className="flex-shrink-0 bg-white/10 rounded-xl p-4 w-52">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-bold">{c.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}</div>
                <div>
                  <div className="text-xs font-semibold truncate">{c.name.split(" ")[0]}</div>
                  <div className="text-[10px] text-indigo-200">Score: {c.score}/100</div>
                </div>
                {i === 0 && <span className="ml-auto text-[10px] bg-yellow-400/20 text-yellow-200 px-1.5 py-0.5 rounded-full">#1</span>}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-indigo-200">On-time</span>
                  <span>{c.onTime}%</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-indigo-200">Avg Rate</span>
                  <span>₹{c.avgRate}/km</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-indigo-200">Accept Rate</span>
                  <span>{c.acceptRate}%</span>
                </div>
              </div>
              <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${c.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 flex-1 max-w-sm border border-black/[0.06]">
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <input placeholder="Search carriers..." className="bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none flex-1" />
          </div>
          <button className="flex items-center gap-1.5 text-xs text-gray-500 border border-black/[0.08] px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <Filter size={12} /> Filter
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.05]">
              {["Carrier", "DOT / MC", "Compliance", "Score", "On-Time", "Avg Rate", "Accept Rate", "Risk", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {filteredCarriers.map((c: any) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-700 flex-shrink-0">
                      {c.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-800">{c.name}</div>
                      <div className="text-[10px] text-gray-400">{c.equipment.join(", ")}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-gray-500 font-mono">{c.dot}</div>
                  <div className="text-[11px] text-gray-400 font-mono">{c.mc}</div>
                </td>
                <td className="px-4 py-3"><ComplianceBadge status={c.compliance} /></td>
                <td className="px-4 py-3 w-32">
                  <ScoreBadge score={c.score} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">{c.onTime}%</td>
                <td className="px-4 py-3 text-xs text-gray-700">₹{c.avgRate}/km</td>
                <td className="px-4 py-3 text-xs text-gray-700">{c.acceptRate}%</td>
                <td className="px-4 py-3"><RiskBadge risk={c.risk} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setSelectedCarrierId(c.id); onNav("carrier-detail"); }} className="text-[11px] text-indigo-600 hover:text-indigo-800">View</button>
                    <button onClick={() => { setEditingCarrier(c); setName(c.name); setDot(c.compliance?.dotNumber || ""); setMc(c.compliance?.mcNumber || ""); setInsuranceExpiry(c.compliance?.insuranceExpiry ? c.compliance.insuranceExpiry.split('T')[0] : ""); setShowEditModal(true); }} className="text-[11px] text-gray-600 hover:text-gray-800">Edit</button>
                    <button onClick={async () => { if (confirm(`Are you sure you want to suspend ${c.name}?`)) { await deleteCarrierMutation.mutateAsync(c.id); } }} className="text-[11px] text-red-600 hover:text-red-800">Suspend</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Carrier modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Add Carrier Partner</span>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!name) return;
              try {
                await createCarrierMutation.mutateAsync({ name, dot, mc, insuranceExpiry });
                setShowAddModal(false);
                setName(""); setDot(""); setMc(""); setInsuranceExpiry("");
              } catch {}
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Company Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} required placeholder="Tata Logistics" className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">DOT Number</label>
                <input value={dot} onChange={e => setDot(e.target.value)} placeholder="DOT-123456" className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">MC Number</label>
                <input value={mc} onChange={e => setMc(e.target.value)} placeholder="MC-123456" className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Insurance Expiry Date</label>
                <input type="date" value={insuranceExpiry} onChange={e => setInsuranceExpiry(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createCarrierMutation.isPending} className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                  {createCarrierMutation.isPending ? "Adding..." : "Add Carrier"}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-medium text-gray-600 border border-black/[0.1] hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Carrier modal */}
      {showEditModal && editingCarrier && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Edit Carrier Details</span>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!name) return;
              try {
                await updateCarrierMutation.mutateAsync({ id: editingCarrier.id, data: { name, dot, mc, insuranceExpiry } });
                setShowEditModal(false);
                setEditingCarrier(null);
                setName(""); setDot(""); setMc(""); setInsuranceExpiry("");
              } catch {}
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Company Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} required placeholder="Tata Logistics" className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">DOT Number</label>
                <input value={dot} onChange={e => setDot(e.target.value)} placeholder="DOT-123456" className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">MC Number</label>
                <input value={mc} onChange={e => setMc(e.target.value)} placeholder="MC-123456" className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Insurance Expiry Date</label>
                <input type="date" value={insuranceExpiry} onChange={e => setInsuranceExpiry(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={updateCarrierMutation.isPending} className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                  {updateCarrierMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-medium text-gray-600 border border-black/[0.1] hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CARRIER COMPLIANCE DETAIL ─────────────────────────────────────────────────
function CarrierDetail({ onNav, carrierId }: { onNav: (p: Page) => void; carrierId: string | null }) {
  const { data: carriersData } = useCarriers();
  const [localCarrierId, setLocalCarrierId] = useState<string | null>(null);

  useEffect(() => {
    if (carrierId) {
      setLocalCarrierId(carrierId);
    } else if (carriersData && carriersData.length > 0 && !localCarrierId) {
      setLocalCarrierId(carriersData[0].id);
    }
  }, [carrierId, carriersData]);

  const activeCarrierId = localCarrierId || (carriersData && carriersData.length > 0 ? carriersData[0].id : null);
  const { data: carrier, isLoading } = useCarrierDetail(activeCarrierId);
  const updateCompliance = useUpdateCarrierCompliance();

  if (isLoading || !carrier) {
    return <div className="p-6">Loading carrier profile...</div>;
  }

  const mappedCarrier = {
    ...carrier,
    dot: carrier.compliance?.dotNumber || 'DOT-PENDING',
    mc: carrier.compliance?.mcNumber || 'MC-PENDING',
    compliance: carrier.compliance ? (carrier.compliance.insuranceStatus === 'ACTIVE' && carrier.compliance.authorityStatus === 'ACTIVE' ? 'compliant' : 'warning') : 'compliant',
    score: carrier.compliance?.complianceScore || 100,
    risk: carrier.compliance ? (carrier.compliance.insuranceStatus === 'ACTIVE' && carrier.compliance.authorityStatus === 'ACTIVE' ? 'low' : 'medium') : 'low',
    equipment: ['Dry Van', 'Reefer']
  };

  const handleComplianceOverride = () => {
    updateCompliance.mutate({
      id: carrier.id,
      data: {
        insuranceStatus: 'ACTIVE',
        authorityStatus: 'ACTIVE',
        complianceScore: 100.0
      }
    });
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <button onClick={() => onNav("carriers")} className="hover:text-gray-700 transition-colors">Carriers</button>
          <ChevronRight size={12} />
          <span className="text-gray-700 font-medium">{mappedCarrier.name}</span>
        </div>
        
        {carriersData && carriersData.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Select Carrier:</span>
            <select
              value={activeCarrierId || ""}
              onChange={(e) => setLocalCarrierId(e.target.value)}
              className="text-xs font-semibold text-gray-700 bg-white border border-black/[0.08] px-3 py-1.5 rounded-xl outline-none cursor-pointer hover:border-black/[0.15] transition-all"
            >
              {carriersData.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Score hero */}
        <div className="col-span-1 bg-white rounded-2xl border border-black/[0.06] shadow-sm p-6 flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="8" />
              <circle cx="60" cy="60" r="50" fill="none" stroke={mappedCarrier.compliance === 'compliant' ? '#10B981' : (mappedCarrier.compliance === 'warning' ? '#F59E0B' : '#EF4444')} strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 50 * (mappedCarrier.score / 100)} ${2 * Math.PI * 50}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">{mappedCarrier.score}</span>
              <span className="text-[11px] text-gray-400">/ 100</span>
            </div>
          </div>
          <div className="text-sm font-semibold text-gray-900 text-center mb-1">{mappedCarrier.name}</div>
          <div className="text-xs text-gray-400 mb-3">Compliance Score</div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
            <CheckCircle size={12} /> {mappedCarrier.compliance === 'compliant' ? 'Excellent Standing' : (mappedCarrier.compliance === 'warning' ? 'Needs Attention' : 'Suspended')}
          </span>
        </div>

        {/* Health cards */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          {[
            { label: "Liability Insurance", value: "Aug 15, 2025", sub: "31 days remaining", icon: <Shield size={16} />, status: "ok", progress: 85 },
            { label: "Cargo Insurance", value: "$100,000 coverage", sub: "Active — expires Sep 3", icon: <Package size={16} />, status: "ok", progress: 90 },
            { label: "Operating Authority", value: "Active", sub: "MC #138616", icon: <Award size={16} />, status: "ok", progress: 100 },
            { label: "Safety Rating", value: "Satisfactory", sub: "FMCSA — updated Jun 2025", icon: <Star size={16} />, status: "ok", progress: 94 },
            { label: "Drug & Alcohol", value: "Compliant", sub: "Last test: Jun 12, 2025", icon: <CheckCircle size={16} />, status: "ok", progress: 100 },
            { label: "Equipment Certs", value: "Reefer, Dry Van", sub: "2 of 2 certified", icon: <Truck size={16} />, status: "ok", progress: 100 },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-black/[0.06] shadow-sm p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  {item.icon}
                </div>
                <div className="flex-1 kmn-w-0">
                  <div className="text-xs font-medium text-gray-700 truncate">{item.label}</div>
                  <div className="text-[11px] text-gray-400">{item.sub}</div>
                </div>
                <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
              </div>
              <div className="text-sm font-semibold text-gray-900 mb-2">{item.value}</div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commodity approvals + recommendation */}
      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
          <div className="text-xs font-semibold text-gray-900 mb-4">Commodity Approvals</div>
          <div className="space-y-2">
            {[
              ["Frozen Foods", true], ["Dry Goods", true], ["Electronics", true],
              ["Hazmat Class 3", false], ["Live Animals", false], ["Oversized", false],
            ].map(([label, approved]) => (
              <div key={label as string} className="flex items-center justify-between py-1.5 border-b border-black/[0.04] last:border-0">
                <span className="text-xs text-gray-700">{label as string}</span>
                {approved
                  ? <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1"><Check size={10} /> Approved</span>
                  : <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full flex items-center gap-1"><Minus size={10} /> N/A</span>
                }
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
          <div className="text-xs font-semibold text-gray-900 mb-4">Performance Metrics</div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "On-Time Rate", value: "96%", trend: "+2.1%" },
              { label: "Avg Delay", value: "0.8 hrs", trend: "-0.3 hrs" },
              { label: "Accept Rate", value: "78%", trend: "+4%" },
              { label: "Loads (90d)", value: "142", trend: "+18" },
            ].map((m, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <div className="text-lg font-bold text-gray-900">{m.value}</div>
                <div className="text-[11px] text-gray-400">{m.label}</div>
                <div className="text-[10px] text-emerald-600 mt-1">{m.trend} vs last period</div>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={REVENUE_DATA.map(d => ({ ...d, deliveries: Math.floor(d.loads * 0.48) }))}>
              <defs>
                <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.08)" }} />
              <Area type="monotone" dataKey="deliveries" stroke="#10B981" strokeWidth={2} fill="url(#perfGrad)" dot={false} name="Deliveries" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── RATE CONFIRMATIONS ───────────────────────────────────────────────────────
function RateConfirmations() {
  const versions = [
    { ver: 3, status: "approved", by: "Jyoti Mehta", avatar: "JW", date: "Jul 14, 2025 2:15 PM", rate: "$4,200", note: "Final approved rate" },
    { ver: 2, status: "rejected", by: "Rahul Verma", avatar: "MT", date: "Jul 14, 2025 11:02 AM", rate: "$3,950", note: "Rate too low — carrier declined" },
    { ver: 1, status: "draft", by: "Shreya Sharma", avatar: "SC", date: "Jul 14, 2025 9:30 AM", rate: "$3,800", note: "Initial draft" },
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Rate Confirmations</h1>
          <p className="text-xs text-gray-400 mt-0.5">RC-1192 · LD-2847</p>
        </div>
        <button className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl transition-colors">
          <Plus size={12} /> New Version
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Version history */}
        <div className="col-span-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Version History</div>
          <div className="space-y-3">
            {versions.map((v) => (
              <div key={v.ver} className={cn(
                "bg-white rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md",
                v.status === "approved" ? "border-emerald-200 ring-1 ring-emerald-100" : "border-black/[0.06]"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Version {v.ver}</span>
                  <span className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full font-medium",
                    v.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                    v.status === "rejected" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"
                  )}>{v.status}</span>
                </div>
                <div className="text-lg font-bold text-gray-900 mb-1">{v.rate}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <Avatar initials={v.avatar} size="sm" color="#4F46E5" />
                  {v.by}
                </div>
                <div className="text-[10px] text-gray-300 mt-1">{v.date}</div>
                <div className="text-[11px] text-gray-500 mt-2 italic">{v.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Diff View */}
        <div className="col-span-2 bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-900">Version Comparison: v2 → v3</span>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="bg-red-50 text-red-600 px-2 py-1 rounded-lg">− Removed</span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">+ Added</span>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {[
              { field: "Total Rate", old: "$3,950.00", new: "$4,200.00", changed: true },
              { field: "Rate per Mile", old: "$3.87/km", new: "$4.12/km", changed: true },
              { field: "Carrier", old: "Tata Logistics", new: "Tata Logistics", changed: false },
              { field: "Equipment", old: "Reefer 53'", new: "Reefer 53'", changed: false },
              { field: "Payment Terms", old: "Net 30", new: "Net 21", changed: true },
              { field: "Fuel Surcharge", old: "Not included", new: "$180.00", changed: true },
              { field: "Pickup Date", old: "Jul 15, 2025", new: "Jul 15, 2025", changed: false },
            ].map((row, i) => (
              <div key={i} className={cn(
                "grid grid-cols-3 gap-3 rounded-xl px-4 py-3 text-xs",
                row.changed ? "bg-amber-50" : "bg-gray-50"
              )}>
                <span className="text-gray-500 font-medium">{row.field}</span>
                <span className={cn("font-mono", row.changed ? "text-red-500 line-through" : "text-gray-600")}>{row.old}</span>
                <span className={cn("font-mono", row.changed ? "text-emerald-700 font-semibold" : "text-gray-600")}>{row.new}</span>
              </div>
            ))}
          </div>

          {/* Approval timeline */}
          <div className="px-5 py-4 border-t border-black/[0.06]">
            <div className="text-xs font-semibold text-gray-700 mb-3">Approval Timeline</div>
            <div className="flex items-center gap-4">
              {[
                { label: "Draft", user: "Shreya Sharma", done: true },
                { label: "Review", user: "Rahul Verma", done: true },
                { label: "Approved", user: "Jyoti Mehta", done: true },
                { label: "Sent to Carrier", user: "System", done: true },
                { label: "Carrier Signed", user: "Swift Transport", done: false },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    step.done ? "bg-emerald-500" : "bg-gray-100"
                  )}>
                    {step.done ? <Check size={10} className="text-white" /> : <Circle size={8} className="text-gray-300" />}
                  </div>
                  <span className="text-[10px] text-gray-600 text-center">{step.label}</span>
                  <span className="text-[9px] text-gray-400 text-center truncate w-full">{step.user}</span>
                  {i < 4 && <div className="absolute" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROLES & PERMISSIONS ──────────────────────────────────────────────────────
function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [perms, setPerms] = useState<Record<string, string[]>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);

  const { data: rolesData, isLoading: isLoadingRoles } = useRoles();
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissions();
  const createRoleMutation = useCreateRole();
  const updateRolePermissionsMutation = useUpdateRolePermissions();

  const availableRoles = (Array.isArray(rolesData) ? rolesData : ROLES) as Array<any>;
  const permissionGroups = (permissionsData && typeof permissionsData === 'object' ? permissionsData : PERMISSIONS) as Record<string, Array<{ id: string; name: string; desc: string }>>;
  const availablePermissions = Object.values(permissionGroups).flat();

  useEffect(() => {
    if (!selectedRole && availableRoles.length > 0) {
      setSelectedRole(availableRoles[0].id);
    }
  }, [availableRoles, selectedRole]);

  useEffect(() => {
    if (!selectedRole) return;
    const currentRole = availableRoles.find((r: any) => r.id === selectedRole);
    if (!currentRole) return;
    setPerms(prev => ({
      ...prev,
      [selectedRole]: prev[selectedRole] || (currentRole.permissions || []),
    }));
  }, [availableRoles, selectedRole]);

  const toggle = (roleId: string, permId: string) => {
    setPerms(prev => {
      const cur = prev[roleId] || [];
      return {
        ...prev,
        [roleId]: cur.includes(permId) ? cur.filter(p => p !== permId) : [...cur, permId],
      };
    });
  };

  const rolePerms = (selectedRole ? perms[selectedRole] : []) || [];
  const role = availableRoles.find((r: any) => r.id === selectedRole) || availableRoles[0] || ROLES[0];

  const deleteRoleMutation = useDeleteRole();

  const handleDeleteRole = async () => {
    if (!role?.id) return;
    if (confirm(`Are you sure you want to delete the custom role "${role.name}"?`)) {
      try {
        await deleteRoleMutation.mutateAsync(role.id);
        setSelectedRole(null);
      } catch {}
    }
  };

  const handleSaveRolePermissions = async () => {
    if (!role?.id) return;
    await updateRolePermissionsMutation.mutateAsync({ id: role.id, permissions: rolePerms });
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    await createRoleMutation.mutateAsync({
      name: newRoleName.trim(),
      description: newRoleDescription.trim(),
      permissions: newRolePermissions,
    });

    setShowCreateModal(false);
    setNewRoleName("");
    setNewRoleDescription("");
    setNewRolePermissions([]);
  };

  return (
    <div className="flex-1 overflow-hidden flex">
      {/* Role list */}
      <div className="w-56 border-r border-black/[0.07] bg-white flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-black/[0.06]">
          <div className="text-xs font-semibold text-gray-900 mb-1">Roles</div>
          <div className="text-[11px] text-gray-400">{availableRoles.length} configured</div>
        </div>
        <div className="p-2 space-y-1">
          {availableRoles.map((r: any) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all",
                selectedRole === r.id ? "bg-indigo-50" : "hover:bg-gray-50"
              )}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: r.color || "#4F46E5" }} />
              <div className="flex-1 kmn-w-0">
                <div className={cn("text-xs font-medium truncate", selectedRole === r.id ? "text-indigo-700" : "text-gray-700")}>{r.name}</div>
                <div className="text-[10px] text-gray-400">{r.users ?? 0} users</div>
              </div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-black/[0.06]">
          <button onClick={() => setShowCreateModal(true)} className="w-full flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 transition-colors justify-center py-2">
            <Plus size={12} /> New Role
          </button>
        </div>
      </div>

      {/* Permission matrix */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role?.color }} />
              <h1 className="text-base font-semibold text-gray-900">{role?.name}</h1>
            </div>
            <p className="text-xs text-gray-400">{role?.description || "No description"} · {role?.users ?? 0} users · {rolePerms.length} permissions</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-black/[0.06]">
              <Search size={13} className="text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search permissions..."
                className="bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none w-40"
              />
            </div>
            {role?.isCustom && (
              <button onClick={handleDeleteRole} disabled={deleteRoleMutation.isPending} className="flex items-center gap-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors disabled:opacity-60">
                {deleteRoleMutation.isPending ? "Deleting..." : "Delete Role"}
              </button>
            )}
            <button onClick={handleSaveRolePermissions} disabled={updateRolePermissionsMutation.isPending || !role?.id} className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl transition-colors disabled:opacity-60">
              {updateRolePermissionsMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Permission chips summary */}
        <div className="flex flex-wrap gap-2 mb-6">
          {rolePerms.slice(0, 8).map(p => {
            const perm = Object.values(PERMISSIONS).flat().find(pp => pp.id === p);
            return perm ? (
              <span key={p} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-medium">
                <Check size={10} /> {perm.name}
              </span>
            ) : null;
          })}
          {rolePerms.length > 8 && (
            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-[11px]">
              +{rolePerms.length - 8} more
            </span>
          )}
        </div>

        <div className="space-y-4">
          {Object.entries(permissionGroups).map(([category, perms]) => {
            const filtered = perms.filter(p =>
              !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase())
            );
            if (filtered.length === 0) return null;
            return (
              <div key={category} className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-black/[0.06] flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-800">{category}</span>
                  <span className="text-[11px] text-gray-400">
                    {filtered.filter(p => rolePerms.includes(p.id)).length}/{filtered.length} enabled
                  </span>
                </div>
                <div className="divide-y divide-black/[0.04]">
                  {filtered.map(perm => (
                    <div key={perm.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                      <button
                        onClick={() => toggle(selectedRole, perm.id)}
                        className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                          rolePerms.includes(perm.id)
                            ? "bg-indigo-600 border-indigo-600"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {rolePerms.includes(perm.id) && <Check size={11} className="text-white" />}
                      </button>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-800">{perm.name}</div>
                        <div className="text-[11px] text-gray-400">{perm.desc}</div>
                      </div>
                      <span className="text-[10px] text-gray-300 font-mono">{perm.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xl w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Create New Role</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Define a role and its initial permissions</div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateRole} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Role Name</label>
                <input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="Operations Lead" className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
                <input value={newRoleDescription} onChange={e => setNewRoleDescription(e.target.value)} placeholder="Supports dispatch and status updates" className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Permissions</label>
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-auto pr-1">
                  {availablePermissions.map((perm: any) => (
                    <label key={perm.id} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-2 py-2 border border-black/[0.05]">
                      <input type="checkbox" checked={newRolePermissions.includes(perm.id)} onChange={() => setNewRolePermissions(prev => prev.includes(perm.id) ? prev.filter(p => p !== perm.id) : [...prev, perm.id])} />
                      <span>{perm.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={createRoleMutation.isPending} className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-60">
                  {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-medium text-gray-600 border border-black/[0.1] hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────
function AuditLog() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Audit Log</h1>
          <p className="text-xs text-gray-400 mt-0.5">All system activity with full trail</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs text-gray-600 border border-black/[0.1] px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-black/[0.08] shadow-sm flex-1 max-w-xs">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input placeholder="Search audit events..." className="bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none flex-1" />
        </div>
        {["all", "loads", "carriers", "roles", "compliance", "system"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn(
            "px-3 py-2 text-xs font-medium rounded-xl capitalize transition-all",
            filter === f ? "bg-indigo-600 text-white" : "bg-white text-gray-500 border border-black/[0.08] hover:bg-gray-50"
          )}>{f}</button>
        ))}
        <select className="text-xs text-gray-600 border border-black/[0.08] bg-white rounded-xl px-3 py-2 outline-none shadow-sm">
          <option>All users</option>
          <option>Shreya Sharma</option>
          <option>Rahul Verma</option>
        </select>
        <select className="text-xs text-gray-600 border border-black/[0.08] bg-white rounded-xl px-3 py-2 outline-none shadow-sm">
          <option>Last 24 hours</option>
          <option>Last 7 days</option>
          <option>Last 30 days</option>
        </select>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-100" />
        <div className="space-y-3">
          {AUDIT_EVENTS.map((event) => (
            <div key={event.id} className="relative flex gap-4">
              <div className="w-16 flex-shrink-0 flex justify-center items-start pt-3">
                <Avatar initials={event.avatar} color={event.color} size="md" />
              </div>
              <div className="flex-1 bg-white rounded-2xl border border-black/[0.06] shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-gray-900">{event.user}</span>
                      <span className="text-[11px] text-gray-400">from</span>
                      <span className="text-[11px] text-gray-600">{event.org}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-gray-600">{event.action}</span>
                    </div>
                    <div className="text-xs text-gray-700">{event.detail}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-indigo-600 font-mono font-medium">{event.object}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400 font-mono">IP: {event.ip}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400 flex-shrink-0 whitespace-nowrap">{event.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
function Reports() {
  const [timeRange, setTimeRange] = useState("year-to-date");

  const getFilters = () => {
    const now = new Date();
    if (timeRange === "last-quarter") {
      const q = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return { startDate: q.toISOString() };
    }
    if (timeRange === "last-7-months") {
      const m = new Date(now.getFullYear(), now.getMonth() - 7, 1);
      return { startDate: m.toISOString() };
    }
    const ytd = new Date(now.getFullYear(), 0, 1);
    return { startDate: ytd.toISOString() };
  };

  const { data: reportsData, isLoading } = useReports(getFilters());

  if (isLoading || !reportsData) return <div className="p-6">Loading reports & analytics...</div>;

  const totalRevenue = reportsData.summary.totalRevenue;
  const totalVolume = reportsData.summary.totalVolume;
  const avgMargin = 14.5;
  const complianceRate = 96.4;

  const revenueTrends = (reportsData.revenueTrends || []).map((item: any) => ({
    ...item,
    loads: item.loads || Math.round(item.revenue / 2500) || 1
  }));

  const handleDownloadReport = () => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Revenue", `₹${totalRevenue.toLocaleString()}`],
      ["Total Loads Volume", totalVolume.toString()],
      ["Average Rate Per Mile", `₹${reportsData.summary.avgRatePerMile}`],
      ["Estimated Avg Margin", `${avgMargin}%`],
      ["Compliance Rate", `${complianceRate}%`]
    ];
    const csvContent = [headers.join(","), ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `loadflow_report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Executive summary report exported successfully!");
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Reports & Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">Executive overview · YTD</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="text-xs text-gray-600 border border-black/[0.08] bg-white rounded-xl px-3 py-2 outline-none shadow-sm cursor-pointer">
            <option value="last-7-months">Last 7 months</option>
            <option value="last-quarter">Last quarter</option>
            <option value="year-to-date">Year to date</option>
          </select>
          <button onClick={handleDownloadReport} className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl transition-colors">
            <Download size={12} /> Download Report
          </button>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Revenue", value: `₹${(totalRevenue / 100000).toFixed(2)} Lakhs`, sub: "Period YTD", color: "#4F46E5", up: true },
          { label: "Total Loads", value: totalVolume.toString(), sub: "Executed shipments", color: "#10B981", up: true },
          { label: "Avg Margin", value: `${avgMargin}%`, sub: "+1.8pp improvement", color: "#8B5CF6", up: true },
          { label: "Compliance Rate", value: `${complianceRate}%`, sub: "-0.3pp — monitor", color: "#F59E0B", up: false },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
            <div className="text-2xl font-bold text-gray-900 mb-1">{k.value}</div>
            <div className="text-xs text-gray-500 mb-2">{k.label}</div>
            <div className={cn("text-[11px] font-medium flex items-center gap-1", k.up ? "text-emerald-600" : "text-amber-600")}>
              {k.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Revenue chart */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
          <SectionHeader title="Monthly Revenue" action={
            <button onClick={handleDownloadReport} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"><Download size={11} /> Export</button>
          } />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueTrends}>
              <defs>
                <linearGradient id="rep1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`₹${(v/1000).toFixed(0)}k`]} contentStyle={{ fontSize: "11px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.08)" }} />
              <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} fill="url(#rep1)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Load volume */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
          <SectionHeader title="Load Volume" action={
            <button onClick={handleDownloadReport} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"><Download size={11} /> Export</button>
          } />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueTrends} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.08)" }} />
              <Bar dataKey="loads" fill="#8B5CF6" radius={[4,4,0,0]} name="Loads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Status distribution */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
          <SectionHeader title="Status Distribution" />
          <ResponsiveContainer width="100%" height={160}>
            <RePieChart>
              <Pie data={STATUS_DIST} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
                {STATUS_DIST.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, ""]} contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.08)" }} />
            </RePieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {STATUS_DIST.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-[11px] text-gray-600 flex-1">{s.name}</span>
                <span className="text-[11px] font-semibold text-gray-700">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Carrier performance */}
        <div className="col-span-2 bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
          <SectionHeader title="Carrier Performance Ranking" />
          <div className="space-y-3">
            {(reportsData.carrierPerformance || []).slice(0, 5).map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-300 w-4">#{i+1}</span>
                <div className="w-32 text-xs font-medium text-gray-700 truncate">{c.carrier}</div>
                <div className="flex-1">
                  <ScoreBadge score={c.score || 95} />
                </div>
                <span className="text-xs text-gray-500 w-16 text-right">{c.loads} loads</span>
                <span className="text-xs font-semibold text-gray-700 w-24 text-right">₹{c.revenue.toLocaleString()}</span>
              </div>
            ))}
            {(!reportsData.carrierPerformance || reportsData.carrierPerformance.length === 0) && (
              <div className="p-8 text-center text-xs text-gray-400">No carrier rankings available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GENERIC PLACEHOLDER ──────────────────────────────────────────────────────
function GenericPage({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <EmptyState icon={icon} title={title} desc={desc} />
    </div>
  );
}

// ─── LOADS LIST ───────────────────────────────────────────────────────────────
function LoadsList({ onNav, setSelectedLoadId }: { onNav: (p: Page) => void; setSelectedLoadId: (id: string | null) => void }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data: loadsData, isLoading } = useLoads();
  if (isLoading) return <div className="p-6">Loading loads...</div>;
  const LOADS = loadsData?.loads || [];

  const filtered = LOADS.filter(l => {
    const matchStatus = status === "all" || l.status === status;
    const loadNum = l.loadNumber || "";
    const shipperName = l.shipper?.name || "";
    const carrierName = l.carrier?.name || "";
    const matchSearch = !search || 
      loadNum.toLowerCase().includes(search.toLowerCase()) || 
      shipperName.toLowerCase().includes(search.toLowerCase()) || 
      carrierName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleExportLoads = () => {
    const headers = ["Load ID", "Shipper", "Origin", "Destination", "Carrier", "Equipment", "Pickup", "Revenue", "Status"];
    const rows = filtered.map((l: any) => [
      l.loadNumber,
      l.shipper?.name || 'Unknown',
      l.origin || '',
      l.destination || '',
      l.carrier?.name || 'Unassigned',
      l.equipmentType || '',
      new Date(l.pickupDate).toLocaleDateString(),
      `₹${l.revenue}`,
      l.status
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `loadflow_loads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Loads exported successfully to CSV!");
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-gray-900">All Loads</h1>
          <p className="text-xs text-gray-400 mt-0.5">{LOADS.length} total this month</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportLoads} className="flex items-center gap-1.5 text-xs text-gray-600 border border-black/[0.1] px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"><Download size={12} /> Export</button>
          <button onClick={() => onNav("create-load")} className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl transition-colors"><Plus size={12} /> New Load</button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-black/[0.08] shadow-sm flex-1 max-w-sm">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, shipper, carrier..." className="bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none flex-1" />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {["all", "posted", "in-transit", "delivered"].map(s => (
            <button key={s} onClick={() => setStatus(s)} className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all whitespace-nowrap",
              status === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            )}>{s === "all" ? "All" : s}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.05]">
              {["Load ID", "Shipper", "Route", "Carrier", "Equipment", "Pickup", "Revenue", "Status", "Compliance", "Priority"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {filtered.map(load => {
              const mappedLoad = {
                ...load,
                id: load.loadNumber,
                shipper: load.shipper?.name || 'Unknown',
                carrier: load.carrier?.name || 'Unassigned',
                pickup: new Date(load.pickupDate).toLocaleDateString(),
                delivery: new Date(load.deliveryDate).toLocaleDateString(),
                revenue: load.revenue,
                equipment: load.equipmentType,
                status: load.status,
                priority: load.priority,
                origin: load.origin,
                destination: load.destination,
                compliance: load.carrier?.complianceHold ? 'hold' : 'compliant',
              };
              return (
                <tr key={load.id} onClick={() => { setSelectedLoadId(load.id); onNav("load-detail"); }} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-indigo-600 font-mono">{mappedLoad.id}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">{mappedLoad.shipper}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <span>{(mappedLoad.origin || "").split(",")[0]}</span>
                    <ArrowRight size={10} className="text-gray-300 flex-shrink-0" />
                    <span>{(mappedLoad.destination || "").split(",")[0]}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{mappedLoad.carrier}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{mappedLoad.equipment}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{mappedLoad.pickup}</td>
                <td className="px-4 py-3 text-xs font-semibold text-gray-800">₹{mappedLoad.revenue.toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={mappedLoad.status} /></td>
                <td className="px-4 py-3"><ComplianceBadge status={mappedLoad.compliance} /></td>
                <td className="px-4 py-3"><PriorityBadge priority={mappedLoad.priority} /></td>
              </tr>
            );
          })}
        </tbody>
        </table>
        {filtered.length === 0 && (
          <EmptyState icon={<Package size={22} />} title="No loads found" desc="Try adjusting your filters or search query." />
        )}
      </div>
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-auto p-6 max-w-3xl mx-auto w-full">
      <h1 className="text-base font-semibold text-gray-900 mb-6">Settings</h1>

      {[
        { section: "Organization", fields: [
          { label: "Company Name", value: "LoadFlow India Logistics LLC", type: "text" },
          { label: "MC Number", value: "MC-558234", type: "text" },
          { label: "DOT Number", value: "DOT-2847165", type: "text" },
          { label: "Business Email", value: "ops@loadflow.io", type: "email" },
        ]},
        { section: "Notifications", fields: [
          { label: "Compliance Alerts", value: "enabled", type: "toggle" },
          { label: "Load Status Updates", value: "enabled", type: "toggle" },
          { label: "Insurance Expiry (days before)", value: "30", type: "number" },
          { label: "Daily Digest Email", value: "disabled", type: "toggle" },
        ]},
        { section: "Defaults", fields: [
          { label: "Default Equipment", value: "Dry Van 53'", type: "text" },
          { label: "Payment Terms", value: "Net 30", type: "select" },
          { label: "Default Priority", value: "medium", type: "select" },
        ]},
      ].map(({ section, fields }) => (
        <div key={section} className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-black/[0.06]">
            <span className="text-xs font-semibold text-gray-900">{section}</span>
          </div>
          <div className="divide-y divide-black/[0.04]">
            {fields.map(field => (
              <div key={field.label} className="flex items-center justify-between px-5 py-3">
                <label className="text-xs font-medium text-gray-700">{field.label}</label>
                {field.type === "toggle" ? (
                  <button className={cn(
                    "relative w-10 h-5 rounded-full transition-colors",
                    field.value === "enabled" ? "bg-indigo-600" : "bg-gray-200"
                  )}>
                    <span className={cn(
                      "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                      field.value === "enabled" ? "translate-x-5" : "translate-x-0.5"
                    )} />
                  </button>
                ) : (
                  <input
                    defaultValue={field.value}
                    className="text-xs text-gray-700 bg-gray-50 border border-black/[0.08] rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button onClick={save} className={cn(
          "flex items-center gap-2 text-xs font-medium px-4 py-2.5 rounded-xl transition-all",
          saved ? "bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
        )}>
          {saved ? <><Check size={13} /> Saved!</> : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── SHARED PORTAL SHELL ─────────────────────────────────────────────────────
type NavItem = { id: string; icon: React.ReactNode; label: string };

function PortalSidebar({ navItems, active, onNav, orgName, orgInitials, userName, userRole, accentColor = "#4F46E5", onLogout }: {
  navItems: NavItem[]; active: string; onNav: (id: string) => void;
  orgName: string; orgInitials: string; userName: string; userRole: string;
  accentColor?: string; onLogout: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={cn("h-screen flex flex-col border-r border-black/[0.07] bg-white transition-all duration-200 flex-shrink-0", collapsed ? "w-14" : "w-56")}>
      <div className="h-14 flex items-center px-4 border-b border-black/[0.07] gap-2.5 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accentColor }}>
          <Zap size={14} className="text-white" />
        </div>
        {!collapsed && <span className="text-sm font-semibold text-gray-900">LoadFlow</span>}
        <button className="ml-auto text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
      {!collapsed && (
        <div className="px-3 py-2 border-b border-black/[0.07]">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50">
            <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ backgroundColor: accentColor }}>{orgInitials}</div>
            <span className="text-xs font-medium text-gray-700 truncate flex-1">{orgName}</span>
          </div>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navItems.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)} className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all mb-0.5 group",
              isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            )}>
              <span className={cn("flex-shrink-0", isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")}>{item.icon}</span>
              {!collapsed && <span className="text-xs font-medium truncate">{item.label}</span>}
              {isActive && !collapsed && <span className="ml-auto w-1 h-1 rounded-full bg-indigo-500" />}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-black/[0.07] space-y-1">
        <div className={cn("flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer", collapsed && "justify-center")}>
          <Avatar initials={userName.split(" ").map(w => w[0]).join("")} color={accentColor} size="sm" />
          {!collapsed && (
            <div className="flex-1 kmn-w-0">
              <div className="text-xs font-medium text-gray-800 truncate">{userName}</div>
              <div className="text-[10px] text-gray-400 truncate">{userRole}</div>
            </div>
          )}
        </div>
        <button onClick={onLogout} className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-xs", collapsed && "justify-center")}>
          <LogOut size={13} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

function PortalTopNav({ title, subtitle, userName, accentColor = "#4F46E5" }: { title: string; subtitle?: string; userName: string; accentColor?: string }) {
  const [notifOpen, setNotifOpen] = useState(false);
  return (
    <header className="h-14 border-b border-black/[0.07] bg-white flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        {subtitle && <div className="text-[11px] text-gray-400">{subtitle}</div>}
      </div>
      <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 w-56 border border-black/[0.06]">
        <Search size={13} className="text-gray-400 flex-shrink-0" />
        <input placeholder="Search..." className="bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none flex-1" />
      </div>
      <div className="relative">
        <button onClick={() => setNotifOpen(!notifOpen)} className="relative w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-10 w-72 bg-white rounded-2xl border border-black/[0.08] shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-black/[0.06]"><span className="text-xs font-semibold text-gray-900">Notifications</span></div>
            <div className="p-4 text-center text-xs text-gray-400">No new notifications</div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1.5 rounded-xl transition-colors cursor-pointer">
        <Avatar initials={userName.split(" ").map(w => w[0]).join("")} color={accentColor} size="sm" />
        <ChevronDown size={12} className="text-gray-400" />
      </div>
    </header>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ onLogin }: { onLogin: () => void }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const features = [
    { icon: <Package size={20} />, title: "Load Management", desc: "Full load lifecycle from posting to POD — Kanban board, table view, and real-time status tracking.", color: "#4F46E5" },
    { icon: <Truck size={20} />, title: "Carrier Assignment", desc: "AI-powered carrier recommendations ranked by score, on-time rate, compliance, and equipment match.", color: "#3B82F6" },
    { icon: <Shield size={20} />, title: "Compliance Automation", desc: "Automatic insurance validation, authority checks, equipment certification, and renewal reminders.", color: "#10B981" },
    { icon: <FileText size={20} />, title: "Rate Confirmation Versioning", desc: "Full version history, diff comparison, approval workflow, and carrier e-signature support.", color: "#8B5CF6" },
    { icon: <ScrollText size={20} />, title: "Audit Trail", desc: "Immutable event log with user, action, timestamp, IP, and affected object — fully searchable.", color: "#F59E0B" },
    { icon: <Key size={20} />, title: "Role-Based Access", desc: "Custom RBAC with per-permission granularity. Each staff member sees only what they're allowed to.", color: "#EF4444" },
    { icon: <MapPin size={20} />, title: "Shipment Tracking", desc: "Live GPS status, kmtone timeline, ETA updates, and delay alerts — all in one pane.", color: "#06B6D4" },
    { icon: <Upload size={20} />, title: "POD Verification", desc: "Upload, OCR-parse, verify, and approve proof of delivery documents in a structured workflow.", color: "#EC4899" },
    { icon: <BarChart3 size={20} />, title: "Analytics & Reports", desc: "Revenue trends, carrier performance, compliance rates, and load volume — exportable to CSV/PDF.", color: "#14B8A6" },
  ];

  const testimonials = [
    { quote: "LoadFlow replaced three separate tools we were juggling. The compliance scoring alone saves us from bad carriers every week.", name: "Rachel Morrison", title: "VP Operations", company: "Apex Freight LLC", initials: "RM" },
    { quote: "Our dispatchers onboarded in a day. The interface is so clean compared to McLeod — it actually gets out of the way and lets you work.", name: "James Kowalski", title: "Director of Dispatch", company: "Heartland Transport", initials: "JK" },
    { quote: "Rate confirmation versioning and the audit log alone made LoadFlow worth it. We finally have accountability across the whole team.", name: "Divya Nair", title: "COO", company: "Pacific Brokerage Co.", initials: "DC" },
  ];

  const faqs = [
    { q: "How does carrier compliance scoring work?", a: "LoadFlow pulls insurance certificates, authority records, safety ratings, and equipment certifications automatically and computes a 0–100 score updated daily. You set the kmnimum threshold; loads are blocked if a carrier falls below it." },
    { q: "Can my carriers and shippers log in separately?", a: "Yes. LoadFlow has three distinct portal types: Broker, Carrier, and Shipper. Each has its own login, workspace, and permission model. Carriers see only their assigned loads; shippers see only their shipments." },
    { q: "How does the RBAC system work?", a: "Admins create custom roles with granular per-permission bundles. Staff accounts are assigned a role and the navigation automatically adjusts to show only the features that role can access." },
    { q: "Is there an API?", a: "Yes. LoadFlow exposes a full REST API with API key management, per-key scopes, and webhook support for load status events, compliance changes, and rate confirmation approvals." },
    { q: "What happens when a carrier's insurance expires?", a: "LoadFlow sends renewal reminders at 30, 14, and 7 days before expiry. Once expired, the carrier is automatically flagged and load assignments are blocked until updated insurance is uploaded and verified." },
  ];

  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif] overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-8">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center"><Zap size={14} className="text-white" /></div>
            <span className="text-sm font-semibold text-gray-900">LoadFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-6 flex-1">
            {["Features", "Compliance", "Pricing", "Docs"].map(l => (
              <a key={l} href="#" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={onLogin} className="text-xs text-gray-600 hover:text-gray-900 transition-colors font-medium">Log in</button>
            <button onClick={onLogin} className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors">Book Demo</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center mb-14">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Now in production · 200+ brokerages
          </span>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-5 max-w-3xl tracking-tight">
            Modern Freight Brokerage Operations.<br />
            <span className="text-indigo-600">Faster Dispatch. Smarter Compliance.</span>
          </h1>
          <p className="text-base text-gray-500 max-w-xl mb-8 leading-relaxed">
            The operations platform built for freight brokers who need more than a spreadsheet — load boards, carrier compliance, rate confirmations, and full RBAC in one unified workspace.
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-xl transition-colors shadow-md shadow-indigo-200">
              Start Free Trial <ArrowRight size={14} />
            </button>
            <button onClick={onLogin} className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-black/[0.12] px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">
              Book a Demo
            </button>
          </div>
        </div>

        {/* Dashboard mock */}
        <div className="relative rounded-2xl border border-black/[0.08] shadow-2xl shadow-black/[0.06] overflow-hidden bg-gray-50">
          <div className="h-8 bg-white border-b border-black/[0.06] flex items-center gap-1.5 px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /><div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <div className="flex-1 flex justify-center"><div className="w-48 h-4 bg-gray-100 rounded-md" /></div>
          </div>
          <div className="flex h-64">
            <div className="w-48 bg-white border-r border-black/[0.06] p-3 space-y-1">
              {[["Dashboard","#4F46E5",true],["Loads","#9CA3AF",false],["Carriers","#9CA3AF",false],["Compliance","#9CA3AF",false],["Reports","#9CA3AF",false]].map(([l,c,a]) => (
                <div key={l as string} className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-lg", a ? "bg-indigo-50" : "")}>
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: c as string }} />
                  <span className="text-[10px] font-medium" style={{ color: a ? "#4F46E5" : "#9CA3AF" }}>{l as string}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 p-4">
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[["147","Active Loads","#4F46E5"],["38","In Transit","#EF4444"],["₹24.3 Lakhs","Revenue","#8B5CF6"],["96%","On-Time","#10B981"]].map(([v,l,c]) => (
                  <div key={l as string} className="bg-white rounded-xl p-3 border border-black/[0.06]">
                    <div className="w-5 h-5 rounded-md mb-2 opacity-80" style={{ backgroundColor: c as string }} />
                    <div className="text-sm font-bold text-gray-900">{v as string}</div>
                    <div className="text-[10px] text-gray-400">{l as string}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {[["Posted","#6B7280"],["Assigned","#3B82F6"],["In Transit","#EF4444"],["Delivered","#10B981"]].map(([col,c]) => (
                  <div key={col as string} className="flex-1 bg-white rounded-xl p-2 border border-black/[0.06]">
                    <div className="flex items-center gap-1 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c as string }} />
                      <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide">{col as string}</span>
                    </div>
                    {[0,1].map(i => <div key={i} className="h-8 bg-gray-50 rounded-lg mb-1.5 border border-black/[0.04]" />)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="py-12 border-y border-black/[0.05] bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-6">Trusted by freight brokerages nationwide</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {["Apex Freight","Heartland TMS","Pacific Brokerage","Gati Logistics","Clearway Transport","Atlas Freight"].map(co => (
              <span key={co} className="text-sm font-semibold text-gray-300">{co}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything your brokerage needs</h2>
          <p className="text-sm text-gray-500 max-w-lg mx-auto">Built for freight brokers — not generic project management repurposed for logistics.</p>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl border border-black/[0.07] p-6 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4" style={{ backgroundColor: f.color }}>
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Workflow */}
      <section className="py-20 bg-gray-950 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">One platform. The entire lifecycle.</h2>
          <p className="text-sm text-gray-400 mb-14 max-w-lg mx-auto">From load creation to final invoice — every step tracked, every actor accountable.</p>
          <div className="flex items-center justify-between gap-2">
            {[
              { step: "01", label: "Broker Posts Load", sub: "Load created, shipper assigned", icon: <Plus size={18} />, color: "#4F46E5" },
              { step: "02", label: "Carrier Selected", sub: "AI-ranked, compliance verified", icon: <Truck size={18} />, color: "#3B82F6" },
              { step: "03", label: "Dispatch & Transit", sub: "Live tracking, status updates", icon: <MapPin size={18} />, color: "#F59E0B" },
              { step: "04", label: "POD Verified", sub: "Upload, OCR, approve", icon: <CheckCircle size={18} />, color: "#10B981" },
              { step: "05", label: "Load Closed", sub: "Audit trail finalized", icon: <Archive size={18} />, color: "#8B5CF6" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="text-[10px] text-gray-600 font-mono">{s.step}</div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: s.color }}>{s.icon}</div>
                  <div className="text-xs font-semibold text-white text-center">{s.label}</div>
                  <div className="text-[10px] text-gray-500 text-center">{s.sub}</div>
                </div>
                {i < 4 && <div className="flex-1 h-px border-t border-dashed border-gray-700 -mt-10" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-widest">Compliance Engine</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">Stop losing money to bad carriers</h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">LoadFlow's compliance engine automatically validates every carrier before dispatch and sends proactive alerts before anything expires.</p>
            <div className="space-y-4">
              {[
                { icon: <Shield size={16} className="text-emerald-600" />, title: "Insurance Validation", desc: "Liability and cargo insurance verified against FMCSA records daily" },
                { icon: <Award size={16} className="text-blue-600" />, title: "Authority Verification", desc: "Operating authority status checked in real-time before every assignment" },
                { icon: <Truck size={16} className="text-indigo-600" />, title: "Equipment Compatibility", desc: "Automatic matching of load requirements to carrier certifications" },
                { icon: <Package size={16} className="text-amber-600" />, title: "Commodity Approval", desc: "Commodity-specific certifications verified — hazmat, reefer, oversized" },
                { icon: <AlertTriangle size={16} className="text-red-500" />, title: "Risk Detection", desc: "CSA scores, safety ratings, and incident history factored into risk level" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">{item.icon}</div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800">{item.title}</div>
                    <div className="text-[11px] text-gray-400">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-black/[0.07] shadow-xl p-6">
            <div className="text-xs font-semibold text-gray-700 mb-4">Tata Logistics · Compliance Score</div>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#10B981" strokeWidth="8" strokeDasharray={`${2*Math.PI*50*0.94} ${2*Math.PI*50}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">94</span>
                  <span className="text-[11px] text-gray-400">/ 100</span>
                </div>
              </div>
            </div>
            <div className="space-y-2.5">
              {[["Liability Insurance","Aug 15, 2025","ok"],["Operating Authority","Active","ok"],["Safety Rating","Satisfactory","ok"],["Cargo Insurance","Active","ok"],["Drug & Alcohol","Compliant","ok"]].map(([l,v,s]) => (
                <div key={l} className="flex items-center justify-between text-xs py-2 border-b border-black/[0.04] last:border-0">
                  <span className="text-gray-500">{l}</span>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={11} className="text-emerald-500" />
                    <span className="font-medium text-gray-800">{v}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">What brokers are saying</h2>
          <div className="grid grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-black/[0.07] p-6">
                <div className="flex mb-3">{[0,1,2,3,4].map(s => <Star key={s} size={12} className="text-amber-400 fill-amber-400" />)}</div>
                <p className="text-sm text-gray-700 mb-5 leading-relaxed italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <Avatar initials={t.initials} color="#4F46E5" size="md" />
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{t.name}</div>
                    <div className="text-[11px] text-gray-400">{t.title} · {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Simple, transparent pricing</h2>
          <p className="text-sm text-gray-500">No per-load fees. No hidden charges. Cancel anytime.</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { name: "Starter", price: "₹24,999", period: "/mo", desc: "For small brokerages getting started", features: ["Up to 5 staff accounts","500 loads/month","Carrier compliance","Rate confirmations","Email support"], cta: "Start Free Trial", highlight: false },
            { name: "Growth", price: "₹64,999", period: "/mo", desc: "For growing operations needing more power", features: ["Up to 25 staff accounts","Unlimited loads","Full RBAC builder","Audit logs","Carrier recommendations","Priority support"], cta: "Start Free Trial", highlight: true },
            { name: "Enterprise", price: "Custom", period: "", desc: "For large brokerages with custom needs", features: ["Unlimited staff & loads","Custom integrations","Dedicated CSM","SLA & uptime guarantee","SSO & SCIM","On-premise option"], cta: "Contact Sales", highlight: false },
          ].map((tier, i) => (
            <div key={i} className={cn("rounded-2xl p-6 border transition-all", tier.highlight ? "border-indigo-300 bg-indigo-600 shadow-xl shadow-indigo-200" : "border-black/[0.08] bg-white hover:shadow-md")}>
              <div className={cn("text-xs font-semibold mb-1", tier.highlight ? "text-indigo-200" : "text-gray-500")}>{tier.name}</div>
              <div className="flex items-end gap-1 mb-1">
                <span className={cn("text-4xl font-bold", tier.highlight ? "text-white" : "text-gray-900")}>{tier.price}</span>
                <span className={cn("text-sm mb-1", tier.highlight ? "text-indigo-200" : "text-gray-400")}>{tier.period}</span>
              </div>
              <p className={cn("text-xs mb-6", tier.highlight ? "text-indigo-200" : "text-gray-500")}>{tier.desc}</p>
              <div className="space-y-2.5 mb-6">
                {tier.features.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <Check size={12} className={tier.highlight ? "text-emerald-300" : "text-emerald-500"} />
                    <span className={cn("text-xs", tier.highlight ? "text-indigo-100" : "text-gray-600")}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={onLogin} className={cn("w-full py-2.5 rounded-xl text-xs font-semibold transition-colors", tier.highlight ? "bg-white text-indigo-700 hover:bg-indigo-50" : "bg-indigo-600 text-white hover:bg-indigo-700")}>
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Frequently asked questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="text-sm font-medium text-gray-800">{faq.q}</span>
                <ChevronDown size={14} className={cn("text-gray-400 transition-transform flex-shrink-0 ml-3", faqOpen === i && "rotate-180")} />
              </button>
              {faqOpen === i && (
                <div className="px-5 pb-4">
                  <p className="text-xs text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto bg-indigo-600 rounded-3xl p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to modernize your brokerage?</h2>
          <p className="text-sm text-indigo-200 mb-6">Start a 14-day free trial. No credit card required.</p>
          <button onClick={onLogin} className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors">
            Get Started Free <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-5 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center"><Zap size={12} className="text-white" /></div>
                <span className="text-sm font-bold text-gray-900">LoadFlow</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-xs">The modern freight brokerage operations suite built for teams who demand speed and compliance.</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
              { title: "Resources", links: ["Documentation", "API Reference", "Status", "Support"] },
              { title: "Company", links: ["About", "Careers", "Privacy", "Terms"] },
            ].map(col => (
              <div key={col.title}>
                <div className="text-[11px] font-semibold text-gray-800 mb-3">{col.title}</div>
                <div className="space-y-2">
                  {col.links.map(l => <a key={l} href="#" className="block text-xs text-gray-400 hover:text-gray-700 transition-colors">{l}</a>)}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-black/[0.06] pt-6 flex items-center justify-between">
            <span className="text-xs text-gray-400">© 2025 LoadFlow Technologies, Inc.</span>
            <span className="text-xs text-gray-300">Built for freight brokers.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
type PortalType = "broker-admin" | "broker-staff" | "carrier-admin" | "carrier-staff" | "shipper";

function AuthScreen({ onAuth, onLogin, onSignup }: {
  onAuth: (portal: PortalType) => void;
  onLogin: (credentials: any) => Promise<any>;
  onSignup: (details: any) => Promise<any>;
}) {
  const [role, setRole] = useState<"broker" | "carrier" | "shipper">("broker");
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [adminMode, setAdminMode] = useState(true);

  useEffect(() => {
    if (role === 'broker') {
      setEmail(adminMode ? 'shreya@loadflow.com' : 'rahul@loadflow.com');
    } else if (role === 'carrier') {
      setEmail(adminMode ? 'deepak@swift.com' : 'jaspreet@swift.com');
    } else if (role === 'shipper') {
      setEmail('amit@midwestfoods.com');
    }
    setPassword('password123');
  }, [role, adminMode]);

  const roleConfig = {
    broker: {
      label: "Broker", desc: "Freight brokerage operations", icon: <Building2 size={18} />, color: "#4F46E5",
      portal: adminMode ? "broker-admin" as PortalType : "broker-staff" as PortalType,
      demoUser: adminMode ? "Shreya Sharma — Admin" : "Rahul Verma — Dispatcher",
    },
    carrier: {
      label: "Carrier", desc: "Carrier organization", icon: <Truck size={18} />, color: "#10B981",
      portal: adminMode ? "carrier-admin" as PortalType : "carrier-staff" as PortalType,
      demoUser: adminMode ? "Deepak Gupta — Admin" : "Jaspreet Singh — Driver",
    },
    shipper: {
      label: "Shipper", desc: "Shipment visibility", icon: <Package size={18} />, color: "#8B5CF6",
      portal: "shipper" as PortalType,
      demoUser: "Amit Kumar — Shipper",
    },
  };

  const cfg = roleConfig[role];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignup) {
        await onSignup({ email, password, name, organizationType: role.toUpperCase(), organizationName: `${name}'s Org` });
      } else {
        await onLogin({ email, password });
      }
    } catch (err) {
      // API error toast notifications triggered automatically
    }
  };

  return (
    <div className="min-h-screen flex font-[Inter,sans-serif]">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-[45%] flex-col bg-gray-950 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-gray-950 to-gray-900" />
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center"><Zap size={16} className="text-white" /></div>
            <span className="text-base font-semibold text-white">LoadFlow</span>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">Enterprise freight brokerage, simplified.</h2>
            <p className="text-sm text-gray-400 mb-10 leading-relaxed">Every tool your team needs — loads, carriers, compliance, and reporting — in one workspace.</p>
            <div className="space-y-4">
              {[
                { icon: <Shield size={14} />, text: "Automatic carrier compliance scoring" },
                { icon: <FileText size={14} />, text: "Rate confirmation versioning & approval" },
                { icon: <Key size={14} />, text: "Granular role-based access control" },
                { icon: <ScrollText size={14} />, text: "Immutable audit trail for every action" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-indigo-400">{f.icon}</div>
                  <span className="text-xs text-gray-400">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto flex items-center gap-3 bg-white/5 rounded-2xl p-4">
            <Avatar initials="RM" color="#4F46E5" size="md" />
            <div>
              <p className="text-xs text-white font-medium italic">"LoadFlow replaced three tools. The compliance engine pays for itself."</p>
              <p className="text-[11px] text-gray-500 mt-1">Rachel M. — VP Ops, Apex Freight</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-xl p-8">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900 mb-1">{isSignup ? "Create your account" : "Welcome back"}</h1>
              <p className="text-xs text-gray-400">Sign {isSignup ? "up for" : "in to"} your LoadFlow portal</p>
            </div>

            {/* Role selector */}
            <div className="mb-5">
              <div className="text-xs font-medium text-gray-600 mb-2">Account type</div>
              <div className="grid grid-cols-3 gap-2">
                {(["broker","carrier","shipper"] as const).map(r => (
                  <button key={r} onClick={() => setRole(r)} className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                    role === r ? "border-indigo-400 bg-indigo-50" : "border-transparent bg-gray-50 hover:bg-gray-100"
                  )}>
                    <span className={cn(role === r ? "text-indigo-600" : "text-gray-400")}>{roleConfig[r].icon}</span>
                    <span className={cn("text-[11px] font-semibold capitalize", role === r ? "text-indigo-700" : "text-gray-500")}>{roleConfig[r].label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Staff/Admin toggle for broker and carrier */}
            {role !== "shipper" && (
              <div className="mb-5 flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500 flex-1">Logging in as</span>
                <div className="flex gap-1 bg-white rounded-lg p-0.5 border border-black/[0.08]">
                  <button onClick={() => setAdminMode(true)} className={cn("px-2.5 py-1 rounded-md text-[11px] font-medium transition-all", adminMode ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800")}>Admin</button>
                  <button onClick={() => setAdminMode(false)} className={cn("px-2.5 py-1 rounded-md text-[11px] font-medium transition-all", !adminMode ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800")}>Staff</button>
                </div>
              </div>
            )}

            {/* Google SSO */}
            <button className="w-full flex items-center justify-center gap-2.5 border border-black/[0.1] rounded-xl py-2.5 mb-4 hover:bg-gray-50 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <span className="text-xs font-medium text-gray-700">Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-100" /><span className="text-[11px] text-gray-400">or</span><div className="flex-1 h-px bg-gray-100" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignup && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Shreya Sharma" className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@yourcompany.com" className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-600">Password</label>
                  {!isSignup && <button type="button" className="text-[11px] text-indigo-600 hover:text-indigo-800 transition-colors">Forgot password?</button>}
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors mt-1">
                {isSignup ? "Create Account" : `Sign in as ${cfg.demoUser}`}
              </button>
            </form>

            <div className="mt-4 text-center">
              <span className="text-xs text-gray-400">{isSignup ? "Already have an account? " : "Don't have an account? "}</span>
              <button onClick={() => setIsSignup(!isSignup)} className="text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors">{isSignup ? "Sign in" : "Create account"}</button>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-4">Protected by enterprise-grade encryption · SOC 2 Type II</p>
        </div>
      </div>
    </div>
  );
}

// ─── BROKER STAFF PORTAL ──────────────────────────────────────────────────────
const BROKER_STAFF_NAV: NavItem[] = [
  { id: "dashboard", icon: <LayoutDashboard size={16} />, label: "Dashboard" },
  { id: "loads", icon: <Package size={16} />, label: "Loads" },
  { id: "rate-confirmations", icon: <FileText size={16} />, label: "Rate Confirmations" },
  { id: "carriers", icon: <Truck size={16} />, label: "Carriers" },
];

function BrokerStaffPortal({ onLogout }: { onLogout: () => void }) {
  const [page, setPage] = useState("dashboard");
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string | null>(null);

  const PAGE_META: Record<string, { title: string; subtitle?: string }> = {
    dashboard: { title: "Dashboard", subtitle: "Your operational view" },
    loads: { title: "Loads", subtitle: "Assigned freight loads" },
    "rate-confirmations": { title: "Rate Confirmations", subtitle: "RC management" },
    carriers: { title: "Carriers", subtitle: "Carrier network" },
    "load-detail": { title: "Load LD-2847", subtitle: "Reliance Fresh" },
    "create-load": { title: "Create Load", subtitle: "New freight shipment" },
    "carrier-detail": { title: "Tata Logistics", subtitle: "Carrier profile" },
  };

  const meta = PAGE_META[page] || { title: "LoadFlow" };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard onNav={p => setPage(p)} setSelectedLoadId={setSelectedLoadId} />;
      case "loads": return <LoadsList onNav={p => setPage(p)} setSelectedLoadId={setSelectedLoadId} />;
      case "load-detail": return <LoadDetail onNav={p => setPage(p)} loadId={selectedLoadId} setSelectedCarrierId={setSelectedCarrierId} />;
      case "create-load": return <CreateLoad onNav={p => setPage(p)} />;
      case "carriers": return <CarriersPage onNav={p => setPage(p)} setSelectedCarrierId={setSelectedCarrierId} />;
      case "carrier-detail": return <CarrierDetail onNav={p => setPage(p)} carrierId={selectedCarrierId} />;
      case "rate-confirmations": return <RateConfirmations />;
      default: return <Dashboard onNav={p => setPage(p)} />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background font-[Inter,sans-serif]">
      <PortalSidebar navItems={BROKER_STAFF_NAV} active={page} onNav={setPage} orgName="LoadFlow India Logistics" orgInitials="FL" userName="Rahul Verma" userRole="Dispatcher" onLogout={onLogout} />
      <div className="flex-1 flex flex-col kmn-w-0 overflow-hidden">
        <PortalTopNav title={meta.title} subtitle={meta.subtitle} userName="Rahul Verma" />
        <main className="flex-1 overflow-hidden flex flex-col">{renderPage()}</main>
      </div>
    </div>
  );
}

// ─── CARRIER DATA ─────────────────────────────────────────────────────────────
const CARRIER_LOADS = [
  { id: "LD-2847", broker: "LoadFlow India Logistics", origin: "Mumbai, MH", dest: "Delhi, DL", equipment: "Reefer 53'", pickup: "Jul 15, 8:00 AM", delivery: "Jul 15, 6:00 PM", rate: "$4,200", status: "in-transit" as LoadStatus, km: 1020, weight: "42,000 lbs" },
  { id: "LD-2849", broker: "LoadFlow India Logistics", origin: "Pune, MH", dest: "Chennai, TN", equipment: "Flatbed 48'", pickup: "Jul 16, 7:00 AM", delivery: "Jul 17, 5:00 PM", rate: "$5,100", status: "rate-confirmed" as LoadStatus, km: 1380, weight: "36,000 lbs" },
  { id: "LD-2860", broker: "Gati Logistics", origin: "Ahmedabad, GJ", dest: "Guwahati, AS", equipment: "Dry Van 53'", pickup: "Jul 17, 9:00 AM", delivery: "Jul 17, 9:00 PM", rate: "$2,800", status: "posted" as LoadStatus, km: 740, weight: "40,000 lbs" },
  { id: "LD-2862", broker: "Apex Freight LLC", origin: "Hyderabad, TS", dest: "Chennai, TN", equipment: "Reefer 53'", pickup: "Jul 18, 6:00 AM", delivery: "Jul 18, 3:00 PM", rate: "$1,900", status: "posted" as LoadStatus, km: 370, weight: "28,000 lbs" },
];

const CARRIER_DELIVERY_DATA = [
  { month: "Jan", deliveries: 58, revenue: 218000 },
  { month: "Feb", deliveries: 64, revenue: 241000 },
  { month: "Mar", deliveries: 71, revenue: 267000 },
  { month: "Apr", deliveries: 68, revenue: 254000 },
  { month: "May", deliveries: 79, revenue: 297000 },
  { month: "Jun", deliveries: 84, revenue: 316000 },
  { month: "Jul", deliveries: 72, revenue: 271000 },
];

// ─── CARRIER ADMIN PORTAL ─────────────────────────────────────────────────────
const CARRIER_ADMIN_NAV: NavItem[] = [
  { id: "dashboard", icon: <LayoutDashboard size={16} />, label: "Dashboard" },
  { id: "assigned-loads", icon: <Package size={16} />, label: "Assigned Loads" },
  { id: "status-updates", icon: <Activity size={16} />, label: "Status Updates" },
  { id: "pod-upload", icon: <Upload size={16} />, label: "POD Upload" },
  { id: "carrier-compliance", icon: <Shield size={16} />, label: "Compliance" },
  { id: "staff", icon: <Users size={16} />, label: "Staff" },
  { id: "roles", icon: <Key size={16} />, label: "Roles & Permissions" },
  { id: "reports", icon: <BarChart3 size={16} />, label: "Reports" },
  { id: "settings", icon: <Settings size={16} />, label: "Settings" },
];

function CarrierDashboardPage({ onNav }: { onNav: (p: string) => void }) {
  const { data: loadsData, isLoading } = useLoads();

  if (isLoading) return <div className="p-6">Loading dashboard...</div>;

  const carrierLoads = (loadsData?.loads || []).map((l: any, index: number) => ({
    ...l,
    id: l.loadNumber || l.id || `load-${index + 1}`,
    broker: l.broker?.name || 'LoadFlow India Logistics',
    pickup: l.pickupDate ? new Date(l.pickupDate).toLocaleDateString() : 'TBD',
    delivery: l.deliveryDate ? new Date(l.deliveryDate).toLocaleDateString() : 'TBD',
    rate: l.revenue != null ? `₹${Number(l.revenue).toLocaleString()}` : '₹0',
    km: Number(l.miles ?? 500),
    weight: l.weight ? `${Number(l.weight).toLocaleString()} lbs` : '42,000 lbs',
    equipment: l.equipmentType || 'Dry Van',
  }));

  const assignedLoadsCount = carrierLoads.length;
  const inTransitCount = carrierLoads.filter((l: any) => l.status === "in-transit").length;
  const deliveredCount = carrierLoads.filter((l: any) => ["delivered", "pod-verified", "closed"].includes(l.status)).length;
  const pendingPODCount = carrierLoads.filter((l: any) => l.status === "delivered" && (!l.pods || l.pods.length === 0)).length;
  const totalRevenue = carrierLoads.reduce((acc: number, l: any) => acc + (l.revenue || 0), 0);

  const kpis = [
    { label: "Assigned Loads", value: assignedLoadsCount.toString(), sub: "active assignments", icon: <Package size={16} />, trend: { val: "3", up: true }, color: "#4F46E5" },
    { label: "In Transit", value: inTransitCount.toString(), sub: "on the road", icon: <Truck size={16} />, trend: { val: "1", up: true }, color: "#EF4444" },
    { label: "Delivered", value: deliveredCount.toString(), sub: "completed", icon: <CheckCircle size={16} />, trend: { val: "2", up: true }, color: "#10B981" },
    { label: "Pending POD", value: pendingPODCount.toString(), sub: "awaiting upload", icon: <Upload size={16} />, trend: { val: "1", up: false }, color: "#F59E0B" },
    { label: "Revenue (YTD)", value: `₹${(totalRevenue / 100000).toFixed(2)} L`, sub: "Total earnings", icon: <DollarSign size={16} />, trend: { val: "8%", up: true }, color: "#8B5CF6" },
    { label: "On-Time Rate", value: "96%", sub: "last 30 days", icon: <Target size={16} />, trend: { val: "2%", up: true }, color: "#06B6D4" },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="grid grid-cols-6 gap-4">
        {kpis.map((k, i) => <KPICard key={i} {...k} />)}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Today's loads */}
        <div className="col-span-2 bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-900">Assigned Loads</span>
            <button onClick={() => onNav("assigned-loads")} className="text-[11px] text-indigo-600 hover:text-indigo-800 transition-colors">View all →</button>
          </div>
          {carrierLoads.slice(0, 3).map((load: any) => (
            <div key={load.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex-1 kmn-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-indigo-600 font-mono">{load.id}</span>
                  <StatusBadge status={load.status} />
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin size={10} />{(load.origin || "").split(",")[0]} → {(load.destination || "").split(",")[0]}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-900">{load.rate}</div>
                <div className="text-[11px] text-gray-400">{load.equipment}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onNav("status-updates")} className="text-[11px] font-medium text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">Update Status</button>
              </div>
            </div>
          ))}
          {carrierLoads.length === 0 && (
            <div className="p-8 text-center text-xs text-gray-400">No shipments assigned.</div>
          )}
        </div>

        {/* Compliance summary */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
          <div className="text-xs font-semibold text-gray-900 mb-4">My Compliance</div>
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#10B981" strokeWidth="10" strokeDasharray={`${2*Math.PI*50*0.94} ${2*Math.PI*50}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900">94</span>
                <span className="text-[10px] text-gray-400">/100</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-600 mt-2">Excellent</span>
          </div>
          <div className="space-y-2">
            {[["Insurance","Active","ok"],["Authority","Active","ok"],["Safety Rating","Satisfactory","ok"],["Drug Test","Compliant","ok"]].map(([l,v,s]) => (
              <div key={l} className="flex items-center justify-between text-xs py-1.5 border-b border-black/[0.04] last:border-0">
                <span className="text-gray-500">{l}</span>
                <div className="flex items-center gap-1"><CheckCircle size={11} className="text-emerald-500" /><span className="font-medium text-gray-700">{v}</span></div>
              </div>
            ))}
          </div>
          <button onClick={() => onNav("carrier-compliance")} className="w-full mt-3 text-xs text-indigo-600 py-2 hover:bg-indigo-50 rounded-lg transition-colors">View full report →</button>
        </div>
      </div>

      {/* Performance chart */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
        <SectionHeader title="Monthly Performance" action={<span className="text-xs text-gray-400">Last 7 months</span>} />
        <div className="grid grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={CARRIER_DELIVERY_DATA}>
              <defs>
                <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.08)" }} />
              <Area type="monotone" dataKey="deliveries" stroke="#4F46E5" strokeWidth={2} fill="url(#cGrad)" dot={false} name="Deliveries" />
            </AreaChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={CARRIER_DELIVERY_DATA} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`₹${(v/1000).toFixed(0)}k`, "Revenue"]} contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.08)" }} />
              <Bar dataKey="revenue" fill="#10B981" radius={[4,4,0,0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AssignedLoadsPage({ onNav }: { onNav: (p: string) => void }) {
  const [tab, setTab] = useState("active");
  const [selectedLoad, setSelectedLoad] = useState<string | null>(null);

  const { data: loadsData, isLoading } = useLoads();
  if (isLoading) return <div className="p-6">Loading assigned loads...</div>;
  const CARRIER_LOADS = (loadsData?.loads || []).map((l: any, index: number) => ({
    ...l,
    id: l.loadNumber || l.id || `load-${index + 1}`,
    broker: l.broker?.name || 'LoadFlow India Logistics',
    pickup: l.pickupDate ? new Date(l.pickupDate).toLocaleDateString() : 'TBD',
    delivery: l.deliveryDate ? new Date(l.deliveryDate).toLocaleDateString() : 'TBD',
    rate: l.revenue != null ? `₹${Number(l.revenue).toLocaleString()}` : '₹0',
    km: Number(l.miles ?? 500),
    weight: l.weight ? `${Number(l.weight).toLocaleString()} lbs` : '42,000 lbs',
    equipment: l.equipmentType || 'Dry Van',
  }));

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-base font-semibold text-gray-900">Assigned Loads</h1><p className="text-xs text-gray-400 mt-0.5">Manage your active and upcoming loads</p></div>
      </div>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {["active","pending","completed"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all", tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800")}>{t}</button>
        ))}
      </div>
      <div className="space-y-3">
        {CARRIER_LOADS.map(load => {
          const mappedLoad = load;
          return (
            <div key={load.id} className={cn("bg-white rounded-2xl border shadow-sm overflow-hidden transition-all", selectedLoad === mappedLoad.id ? "border-indigo-300 ring-1 ring-indigo-100" : "border-black/[0.06] hover:shadow-md")}>
            <div className="p-5 flex items-start gap-5" onClick={() => setSelectedLoad(selectedLoad === mappedLoad.id ? null : mappedLoad.id)}>
              <div className="flex-1 kmn-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-sm font-semibold text-indigo-600 font-mono">{mappedLoad.id}</span>
                  <StatusBadge status={mappedLoad.status} />
                  <span className="text-[11px] text-gray-400">{load.broker}</span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div><div className="text-gray-400 mb-0.5">Origin</div><div className="font-medium text-gray-800">{mappedLoad.origin}</div></div>
                  <div><div className="text-gray-400 mb-0.5">Destination</div><div className="font-medium text-gray-800">{mappedLoad.destination}</div></div>
                  <div><div className="text-gray-400 mb-0.5">Pickup</div><div className="font-medium text-gray-800">{mappedLoad.pickup}</div></div>
                  <div><div className="text-gray-400 mb-0.5">Equipment</div><div className="font-medium text-gray-800">{mappedLoad.equipment}</div></div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <div className="text-lg font-bold text-gray-900">{load.rate}</div>
                <div className="text-[11px] text-gray-400">{Number(load.km ?? 0).toLocaleString()} km · {mappedLoad.weight}</div>
              </div>
            </div>
            {selectedLoad === mappedLoad.id && (
              <div className="px-5 pb-5 border-t border-black/[0.06] pt-4">
                <div className="flex items-center gap-3">
                  {mappedLoad.status === "posted" ? (
                    <>
                      <button className="flex items-center gap-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl transition-colors"><CheckCircle size={14} /> Accept Load</button>
                      <button className="flex items-center gap-2 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 px-5 py-2.5 rounded-xl transition-colors"><XCircle size={14} /> Decline</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onNav("status-updates")} className="flex items-center gap-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl transition-colors"><Activity size={14} /> Update Status</button>
                      <button onClick={() => onNav("pod-upload")} className="flex items-center gap-2 text-xs font-medium text-gray-600 border border-black/[0.1] hover:bg-gray-50 px-5 py-2.5 rounded-xl transition-colors"><Upload size={14} /> Upload POD</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ); })}
      </div>
    </div>
  );
}

function StatusUpdatePage() {
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadStatus>("in-transit");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: loadsData, isLoading } = useLoads();
  const updateLoadMutation = useUpdateLoad();

  const getTransitions = (currentStatus: string): string[] => {
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
    return transitions[currentStatus] || [];
  };

  const carrierLoads = (loadsData?.loads || []).map((l: any, index: number) => ({
    ...l,
    id: l.loadNumber || l.id || `load-${index + 1}`,
    dbId: l.dbId || l.id,
    dest: l.destination || 'TBD',
  }));

  useEffect(() => {
    if (!selectedLoadId && carrierLoads.length > 0) {
      const firstLoad = carrierLoads.find((l: any) => l.status !== "posted" && l.status !== "closed");
      setSelectedLoadId((firstLoad ?? carrierLoads[0]).dbId || (firstLoad ?? carrierLoads[0]).id);
    }
  }, [carrierLoads, selectedLoadId]);

  const selectedLoad = carrierLoads.find((l: any) => (l.dbId || l.id) === selectedLoadId) || null;

  useEffect(() => {
    if (selectedLoad) {
      const allowed = getTransitions(selectedLoad.status);
      if (allowed.length > 0) {
        setStatus(allowed[0] as any);
      }
    }
  }, [selectedLoadId, selectedLoad]);

  const handleSubmit = async () => {
    if (!selectedLoadId) return;
    try {
      await updateLoadMutation.mutateAsync({ id: selectedLoadId, data: { status, notes: note || undefined } });
      setSubmitted(true);
      setNote("");
    } catch {
      // Error surfaced by mutation hook
    }
  };

  if (isLoading) return <div className="p-6">Loading updates...</div>;

  const allowedTransitions = selectedLoad ? getTransitions(selectedLoad.status) : [];

  return (
    <div className="flex-1 overflow-auto p-6 max-w-3xl mx-auto w-full">
      <h1 className="text-base font-semibold text-gray-900 mb-6">Status Update</h1>
      {submitted ? (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4"><CheckCircle size={28} className="text-emerald-500" /></div>
          <div className="text-base font-semibold text-gray-900 mb-1">Status updated successfully</div>
          <div className="text-xs text-gray-400">{selectedLoad?.id || "Selected load"} is now marked as {status}</div>
          <button onClick={() => setSubmitted(false)} className="mt-6 text-xs text-indigo-600 hover:text-indigo-800 transition-colors">Update another load</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-700 mb-3">Select Load</div>
            <select
              value={selectedLoadId ?? ""}
              onChange={e => setSelectedLoadId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            >
              {carrierLoads.filter(l => l.status !== "posted").map(l => (
                <option key={l.dbId || l.id} value={l.dbId || l.id}>{l.id} — {(l.origin || "").split(",")[0]} → {(l.dest || "").split(",")[0]} (Current: {l.status})</option>
              ))}
            </select>
          </div>
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-700 mb-1">New Status</div>
            <div className="text-xs text-gray-400 mb-3">Only valid transitions matching status machine rules are displayed.</div>
            {allowedTransitions.length === 0 ? (
              <div className="text-xs text-gray-500 py-2">No valid status transitions available for this load's current state: <b>{selectedLoad?.status}</b>. Wait for Rate Confirmation or POD verification as applicable.</div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {allowedTransitions.map((s) => (
                  <label key={s} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all", status === s ? "border-indigo-400 bg-indigo-50" : "border-black/[0.08] hover:border-black/20")}>
                    <input type="radio" name="status" className="sr-only" checked={status === s} onChange={() => setStatus(s as any)} />
                    <StatusBadge status={s} />
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
            <div className="text-xs font-semibold text-gray-700 mb-3">Notes (optional)</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Add location, delay reason, or other context..." className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all resize-none" />
          </div>
          <button onClick={handleSubmit} disabled={updateLoadMutation.isPending || !selectedLoadId || allowedTransitions.length === 0} className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-60">
            {updateLoadMutation.isPending ? "Updating..." : "Submit Status Update"}
          </button>
        </div>
      )}
    </div>
  );
}

function PODUploadPage() {
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [verified, setVerified] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const checks = ["Delivery date matches", "Recipient signature present", "Load ID visible", "Legible and undamaged", "All pages included"];

  const { data: loadsData, isLoading } = useLoads();
  const uploadPODMutation = useUploadPOD();

  const carrierLoads = (loadsData?.loads || []).map((l: any, index: number) => ({
    ...l,
    id: l.loadNumber || l.id || `load-${index + 1}`,
    dbId: l.dbId || l.id,
  }));

  useEffect(() => {
    if (!selectedLoadId && carrierLoads.length > 0) {
      setSelectedLoadId(carrierLoads[0].dbId || carrierLoads[0].id);
    }
  }, [carrierLoads, selectedLoadId]);

  const handleFileSelection = async (file: File | null) => {
    if (!file || !selectedLoadId) return;
    setSelectedFile(file);
    setFileName(file.name);
    setUploaded(true);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedLoadId) return;
    try {
      await uploadPODMutation.mutateAsync({ loadId: selectedLoadId, file: selectedFile });
      setUploaded(true);
    } catch {
      // Error surfaced by the mutation hook / toast path.
    }
  };

  if (isLoading) return <div className="p-6">Loading POD options...</div>;

  return (
    <div className="flex-1 overflow-auto p-6 max-w-3xl mx-auto w-full">
      <h1 className="text-base font-semibold text-gray-900 mb-6">Upload Proof of Delivery</h1>
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5">
          <div className="text-xs font-semibold text-gray-700 mb-3">Select Load</div>
          <select
            value={selectedLoadId ?? ""}
            onChange={e => { setSelectedLoadId(e.target.value); setUploaded(false); setSelectedFile(null); setFileName(""); }}
            className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
          >
            {carrierLoads.map(l => (
              <option key={l.dbId || l.id} value={l.dbId || l.id}>{l.id} — {(l.origin || "").split(",")[0]} → {(l.destination || "").split(",")[0]}</option>
            ))}
          </select>
        </div>

        {!uploaded ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={async e => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0] ?? null;
              await handleFileSelection(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn("bg-white rounded-2xl border-2 border-dashed p-12 flex flex-col items-center cursor-pointer transition-all", dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-gray-300")}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={e => handleFileSelection(e.target.files?.[0] || null)}
            />
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4"><Upload size={24} className="text-gray-400" /></div>
            <div className="text-sm font-medium text-gray-700 mb-1">Drop POD document here</div>
            <div className="text-xs text-gray-400 mb-4">PDF, JPG, or PNG — up to 20MB</div>
            <div className="text-xs font-medium text-indigo-600 border border-indigo-200 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors">Browse Files</div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><FileText size={16} className="text-red-500" /></div>
                <div><div className="text-xs font-medium text-gray-800">{fileName || "Selected POD file"}</div><div className="text-[11px] text-gray-400">Ready to upload</div></div>
              </div>
              <CheckCircle size={16} className="text-emerald-500" />
            </div>
            <div className="p-5">
              <div className="text-xs font-semibold text-gray-700 mb-3">Verification Checklist</div>
              <div className="space-y-2.5">
                {checks.map(c => (
                  <label key={c} className="flex items-center gap-3 cursor-pointer">
                    <button onClick={() => setVerified(p => ({ ...p, [c]: !p[c] }))} className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all", verified[c] ? "bg-indigo-600 border-indigo-600" : "border-gray-200 hover:border-gray-300")}>
                      {verified[c] && <Check size={11} className="text-white" />}
                    </button>
                    <span className={cn("text-xs", verified[c] ? "text-gray-800 font-medium" : "text-gray-500")}>{c}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5 flex items-center gap-3">
              <button onClick={handleUpload} disabled={uploadPODMutation.isPending || !selectedFile || !selectedLoadId} className="flex items-center gap-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"><CheckCircle size={14} /> {uploadPODMutation.isPending ? "Uploading..." : "Submit POD"}</button>
              <button onClick={() => { setUploaded(false); setSelectedFile(null); setFileName(""); }} className="text-xs text-gray-500 hover:text-gray-700 transition-colors">Upload different file</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CarrierAdminPortal({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [page, setPage] = useState("dashboard");
  const selectedCarrierId = user?.organizationId || null;

  const PAGE_META: Record<string, { title: string; subtitle?: string }> = {
    dashboard: { title: "Dashboard", subtitle: "Tata Logistics overview" },
    "assigned-loads": { title: "Assigned Loads", subtitle: "Active freight assignments" },
    "status-updates": { title: "Status Updates", subtitle: "Update load status" },
    "pod-upload": { title: "POD Upload", subtitle: "Proof of delivery" },
    "carrier-compliance": { title: "Compliance", subtitle: "Tata Logistics compliance" },
    staff: { title: "Staff", subtitle: "Driver & staff management" },
    roles: { title: "Roles & Permissions", subtitle: "RBAC configuration" },
    reports: { title: "Reports", subtitle: "Performance analytics" },
    settings: { title: "Settings", subtitle: "Organization settings" },
  };

  const meta = PAGE_META[page] || { title: "LoadFlow" };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <CarrierDashboardPage onNav={setPage} />;
      case "assigned-loads": return <AssignedLoadsPage onNav={setPage} />;
      case "status-updates": return <StatusUpdatePage />;
      case "pod-upload": return <PODUploadPage />;
      case "carrier-compliance": return <CarrierDetail onNav={p => setPage(p)} carrierId={selectedCarrierId} />;
      case "staff": return <StaffPage />;
      case "roles": return <RolesPage />;
      case "reports": return <Reports />;
      case "settings": return <SettingsPage />;
      default: return <CarrierDashboardPage onNav={setPage} />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background font-[Inter,sans-serif]">
      <PortalSidebar navItems={CARRIER_ADMIN_NAV} active={page} onNav={setPage} orgName="Tata Logistics" orgInitials="ST" userName="Deepak Gupta" userRole="Admin" accentColor="#10B981" onLogout={onLogout} />
      <div className="flex-1 flex flex-col kmn-w-0 overflow-hidden">
        <PortalTopNav title={meta.title} subtitle={meta.subtitle} userName="Deepak Gupta" accentColor="#10B981" />
        <main className="flex-1 overflow-hidden flex flex-col">{renderPage()}</main>
      </div>
    </div>
  );
}

// ─── CARRIER STAFF PORTAL ─────────────────────────────────────────────────────
const CARRIER_STAFF_NAV: NavItem[] = [
  { id: "dashboard", icon: <LayoutDashboard size={16} />, label: "Dashboard" },
  { id: "assigned-loads", icon: <Package size={16} />, label: "My Loads" },
  { id: "status-updates", icon: <Activity size={16} />, label: "Update Status" },
  { id: "pod-upload", icon: <Upload size={16} />, label: "Upload POD" },
];

function CarrierStaffDashboard() {
  const { data: loadsData, isLoading } = useLoads();
  if (isLoading) return <div className="p-6">Loading driver dashboard...</div>;
  const CARRIER_LOADS = (loadsData?.loads || []).map((l: any, index: number) => ({
    ...l,
    id: l.loadNumber || l.id || `load-${index + 1}`,
    broker: l.broker?.name || 'LoadFlow India Logistics',
    pickup: l.pickupDate ? new Date(l.pickupDate).toLocaleDateString() : 'TBD',
    delivery: l.deliveryDate ? new Date(l.deliveryDate).toLocaleDateString() : 'TBD',
    rate: l.revenue != null ? `₹${Number(l.revenue).toLocaleString()}` : '₹0',
    km: Number(l.miles ?? 500),
    dest: l.destination || 'TBD',
  }));
  const todayLoad = CARRIER_LOADS[0] || null;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "My Loads Today", value: CARRIER_LOADS.length.toString(), icon: <Package size={16} />, color: "#4F46E5" },
          { label: "In Transit", value: CARRIER_LOADS.filter(l => l.status === "in-transit").length.toString(), icon: <Truck size={16} />, color: "#EF4444" },
          { label: "Completed Today", value: CARRIER_LOADS.filter(l => l.status === "delivered").length.toString(), icon: <CheckCircle size={16} />, color: "#10B981" },
          { label: "Pending POD", value: CARRIER_LOADS.filter(l => l.status === "delivered" && (!l.pods || l.pods.length === 0)).length.toString(), icon: <Upload size={16} />, color: "#F59E0B" },
        ].map((k, i) => <KPICard key={i} {...k} />)}
      </div>

      {todayLoad ? (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06] bg-gradient-to-r from-indigo-50 to-white">
            <div className="text-xs font-semibold text-gray-900 mb-0.5">Current Load</div>
            <div className="text-[11px] text-gray-400">In progress · update status when ready</div>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1"><span className="text-lg font-bold text-indigo-600 font-mono">{todayLoad.id}</span><StatusBadge status={todayLoad.status} /></div>
                <div className="text-sm text-gray-600">{todayLoad.broker}</div>
              </div>
              <div className="text-right"><div className="text-xl font-bold text-gray-900">{todayLoad.rate}</div><div className="text-xs text-gray-400">{Number(todayLoad.km ?? 0).toLocaleString()} km</div></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5 text-xs">
              <div className="bg-emerald-50 rounded-xl p-3 flex items-start gap-2.5"><div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" /><div><div className="text-gray-400 mb-0.5">Pickup</div><div className="font-semibold text-gray-800">{todayLoad.origin}</div><div className="text-gray-400 mt-0.5">{todayLoad.pickup}</div></div></div>
              <div className="bg-indigo-50 rounded-xl p-3 flex items-start gap-2.5"><div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 flex-shrink-0" /><div><div className="text-gray-400 mb-0.5">Delivery</div><div className="font-semibold text-gray-800">{todayLoad.dest}</div><div className="text-gray-400 mt-0.5">{todayLoad.delivery}</div></div></div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl transition-colors"><Activity size={16} /> Update Status</button>
              <button className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-3 rounded-xl transition-colors border border-emerald-200"><Upload size={16} /> Upload POD</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3"><Package size={20} className="text-gray-400" /></div>
          <span className="text-sm font-medium text-gray-800">No active load assigned today</span>
          <span className="text-xs text-gray-400 mt-1">Check back later or contact your dispatcher</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.06]"><span className="text-xs font-semibold text-gray-900">Upcoming Loads</span></div>
        <div className="divide-y divide-black/[0.04]">
          {CARRIER_LOADS.slice(1, 3).map(l => (
            <div key={l.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="text-xs font-semibold text-indigo-600 font-mono">{l.id}</span><StatusBadge status={l.status} /></div><div className="text-xs text-gray-500">{(l.origin || "").split(",")[0]} → {(l.dest || "").split(",")[0]}</div></div>
              <div className="text-right"><div className="text-xs font-semibold text-gray-800">{l.rate}</div><div className="text-[11px] text-gray-400">{(l.pickup || "").split(",")[0]}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CarrierStaffPortal({ onLogout }: { onLogout: () => void }) {
  const [page, setPage] = useState("dashboard");
  const meta: Record<string, { title: string; subtitle?: string }> = {
    dashboard: { title: "My Dashboard", subtitle: "Jaspreet Singh · Driver" },
    "assigned-loads": { title: "My Loads", subtitle: "Active assignments" },
    "status-updates": { title: "Update Status", subtitle: "Report load progress" },
    "pod-upload": { title: "Upload POD", subtitle: "Proof of delivery" },
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <CarrierStaffDashboard />;
      case "assigned-loads": return <AssignedLoadsPage onNav={setPage} />;
      case "status-updates": return <StatusUpdatePage />;
      case "pod-upload": return <PODUploadPage />;
      default: return <CarrierStaffDashboard />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background font-[Inter,sans-serif]">
      <PortalSidebar navItems={CARRIER_STAFF_NAV} active={page} onNav={setPage} orgName="Tata Logistics" orgInitials="ST" userName="Jaspreet Singh" userRole="Driver" accentColor="#10B981" onLogout={onLogout} />
      <div className="flex-1 flex flex-col kmn-w-0 overflow-hidden">
        <PortalTopNav title={meta[page]?.title || "LoadFlow"} subtitle={meta[page]?.subtitle} userName="Jaspreet Singh" accentColor="#10B981" />
        <main className="flex-1 overflow-hidden flex flex-col">{renderPage()}</main>
      </div>
    </div>
  );
}

// ─── SHIPPER PORTAL ───────────────────────────────────────────────────────────
const SHIPPER_LOADS = [
  { id: "LD-2847", origin: "Mumbai, MH", dest: "Delhi, DL", status: "in-transit" as LoadStatus, carrier: "Tata Logistics", pickup: "Jul 15", eta: "Jul 15, 6:00 PM", progress: 68 },
  { id: "LD-2849", origin: "Pune, MH", dest: "Chennai, TN", status: "rate-confirmed" as LoadStatus, carrier: "Mahindra Logistics", pickup: "Jul 16", eta: "Jul 17, 5:00 PM", progress: 20 },
  { id: "LD-2854", origin: "Mumbai, MH", dest: "Delhi, DL", status: "delivered" as LoadStatus, carrier: "Landstar", pickup: "Jul 13", eta: "Delivered Jul 13", progress: 100 },
  { id: "LD-2853", origin: "Chennai, TN", dest: "Hyderabad, TS", status: "pod-verified" as LoadStatus, carrier: "Old Dominion", pickup: "Jul 14", eta: "Delivered Jul 14", progress: 100 },
];

const SHIPPER_NAV: NavItem[] = [
  { id: "dashboard", icon: <LayoutDashboard size={16} />, label: "Dashboard" },
  { id: "my-shipments", icon: <Package size={16} />, label: "My Shipments" },
  { id: "documents", icon: <FileText size={16} />, label: "Documents" },
  { id: "notifications", icon: <Bell size={16} />, label: "Notifications" },
  { id: "profile", icon: <User size={16} />, label: "Profile" },
];

function ShipperDashboardPage({ onNav }: { onNav: (p: string) => void }) {
  const { data: loadsData, isLoading } = useLoads();
  if (isLoading) return <div className="p-6">Loading shipper dashboard...</div>;
  const SHIPPER_LOADS = (loadsData?.loads || []).map((l: any, index: number) => ({
    ...l,
    id: l.loadNumber || l.id || `shipment-${index + 1}`,
    carrier: l.carrier?.name || 'Unassigned',
    pickup: l.pickupDate ? new Date(l.pickupDate).toLocaleDateString() : 'TBD',
    delivery: l.deliveryDate ? new Date(l.deliveryDate).toLocaleDateString() : 'TBD',
    eta: l.deliveryDate ? new Date(l.deliveryDate).toLocaleString() : 'N/A',
    progress: l.status === 'posted' ? 10 : (l.status === 'assigned' ? 20 : (l.status === 'rate-confirmed' ? 40 : (l.status === 'dispatched' ? 60 : (l.status === 'in-transit' ? 80 : 100)))),
  }));

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Shipments", value: SHIPPER_LOADS.filter(l => l.status === "in-transit" || l.status === "rate-confirmed" || l.status === "dispatched").length.toString(), sub: "in progress", icon: <Package size={16} />, color: "#4F46E5" },
          { label: "Delivered (30d)", value: SHIPPER_LOADS.filter(l => l.status === "delivered" || l.status === "pod-verified").length.toString(), sub: "completed", icon: <CheckCircle size={16} />, color: "#10B981" },
          { label: "Pending Confirmation", value: SHIPPER_LOADS.filter(l => l.status === "assigned").length.toString(), sub: "rate confirmation", icon: <Clock size={16} />, color: "#F59E0B" },
        ].map((k, i) => <KPICard key={i} {...k} />)}
      </div>

      {/* Active shipments */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-900">Active Shipments</span>
          <button onClick={() => onNav("my-shipments")} className="text-[11px] text-indigo-600 hover:text-indigo-800 transition-colors">View all →</button>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {SHIPPER_LOADS.filter(l => l.status === "in-transit" || l.status === "rate-confirmed").map(load => {
            const mappedLoad = load;
            return (
              <div key={load.id} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1"><span className="text-sm font-semibold text-indigo-600 font-mono">{mappedLoad.id}</span><StatusBadge status={mappedLoad.status} /></div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin size={11} />{(mappedLoad.origin || "").split(",")[0]} → {(mappedLoad.destination || "").split(",")[0]}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-medium text-gray-800">{mappedLoad.carrier}</div>
                    <div className="text-gray-400">ETA: {load.eta}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${load.progress}%` }} />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-600 w-8 text-right">{load.progress}%</span>
                </div>
                <div className="flex items-center gap-6 mt-3">
                  {["Posted","Rate Confirmed","Dispatched","In Transit","Delivered","POD Verified"].map((s, i) => {
                    const thresholds = [0,20,40,60,80,100];
                    const done = load.progress >= thresholds[i];
                    return (
                      <div key={s} className="flex flex-col items-center gap-1">
                        <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", done ? "bg-indigo-600" : "bg-gray-100")}>
                          {done && <Check size={9} className="text-white" />}
                        </div>
                        <span className={cn("text-[9px] text-center leading-tight", done ? "text-indigo-600 font-medium" : "text-gray-300")}>{s}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivered */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.06]"><span className="text-xs font-semibold text-gray-900">Recent Deliveries</span></div>
        <div className="divide-y divide-black/[0.04]">
          {SHIPPER_LOADS.filter(l => l.status === "delivered" || l.status === "pod-verified").map(load => {
            const mappedLoad = load;
            return (
              <div key={load.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0"><CheckCircle size={14} className="text-emerald-500" /></div>
                <div className="flex-1 kmn-w-0">
                  <div className="flex items-center gap-2"><span className="text-xs font-semibold text-indigo-600 font-mono">{mappedLoad.id}</span><StatusBadge status={mappedLoad.status} /></div>
                  <div className="text-[11px] text-gray-400">{(mappedLoad.origin || "").split(",")[0]} → {(mappedLoad.destination || "").split(",")[0]} · {mappedLoad.carrier}</div>
                </div>
                <button className="text-[11px] text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"><Eye size={12} /> View POD</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ShipperMyShipments() {
  const [search, setSearch] = useState("");
  const { data: loadsData, isLoading } = useLoads();
  if (isLoading) return <div className="p-6">Loading shipments...</div>;
  const SHIPPER_LOADS = (loadsData?.loads || []).map((l: any, index: number) => ({
    ...l,
    id: l.loadNumber || l.id || `shipment-${index + 1}`,
    carrier: l.carrier?.name || 'Unassigned',
    pickup: l.pickupDate ? new Date(l.pickupDate).toLocaleDateString() : 'TBD',
    delivery: l.deliveryDate ? new Date(l.deliveryDate).toLocaleDateString() : 'TBD',
    eta: l.deliveryDate ? new Date(l.deliveryDate).toLocaleString() : 'N/A',
    progress: l.status === 'posted' ? 10 : (l.status === 'assigned' ? 20 : (l.status === 'rate-confirmed' ? 40 : (l.status === 'dispatched' ? 60 : (l.status === 'in-transit' ? 80 : 100)))),
  }));

  const filtered = SHIPPER_LOADS.filter(l => {
    return !search || l.id.toLowerCase().includes(search.toLowerCase()) || l.carrier.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-base font-semibold text-gray-900">My Shipments</h1><p className="text-xs text-gray-400 mt-0.5">Reliance Fresh · All shipments</p></div>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-black/[0.08] shadow-sm flex-1 max-w-sm">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shipments..." className="bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none flex-1" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.05]">
              {["Shipment ID","Route","Carrier","Pickup","ETA","Status","Progress",""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {filtered.map(load => {
              const mappedLoad = load;
              return (
                <tr key={load.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3"><span className="text-xs font-semibold text-indigo-600 font-mono">{mappedLoad.id}</span></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1 text-xs text-gray-600"><span>{(mappedLoad.origin || "").split(",")[0]}</span><ArrowRight size={10} className="text-gray-300" /><span>{(mappedLoad.destination || "").split(",")[0]}</span></div></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{mappedLoad.carrier}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{mappedLoad.pickup}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{load.eta}</td>
                  <td className="px-4 py-3"><StatusBadge status={mappedLoad.status} /></td>
                  <td className="px-4 py-3 w-28">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${load.progress}%` }} /></div>
                      <span className="text-[10px] text-gray-400">{load.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><button className="text-[11px] text-indigo-600 hover:text-indigo-800 transition-colors">Details →</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ShipperDocuments() {
  const { data: loadsData, isLoading } = useLoads();
  if (isLoading) return <div className="p-6">Loading documents...</div>;

  const loads = loadsData?.loads || [];
  const documents: Array<{ name: string; load: string; type: string; date: string; size: string; downloadUrl: string; icon: any }> = [];

  loads.forEach((l: any) => {
    if (l.rateConfirmations) {
      l.rateConfirmations.forEach((rc: any) => {
        documents.push({
          name: `${rc.rcNumber}_v${rc.versionNumber}.pdf`,
          load: l.loadNumber || l.id,
          type: "Rate Confirmation",
          date: new Date(rc.createdAt).toLocaleDateString(),
          size: "150 KB",
          downloadUrl: `/api/rate-confirmations/${rc.id}/download`,
          icon: <FileText size={14} className="text-indigo-500" />
        });
      });
    }
    if (l.pods) {
      l.pods.forEach((pod: any) => {
        documents.push({
          name: pod.fileName,
          load: l.loadNumber || l.id,
          type: "Proof of Delivery",
          date: new Date(pod.createdAt).toLocaleDateString(),
          size: pod.fileSize || "1.5 MB",
          downloadUrl: `/api/pod/download/${pod.id}`,
          icon: <CheckCircle size={14} className="text-emerald-500" />
        });
      });
    }
  });

  return (
    <div className="flex-1 overflow-auto p-6">
      <h1 className="text-base font-semibold text-gray-900 mb-6">Documents</h1>
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.06]"><span className="text-xs font-semibold text-gray-900">Rate Confirmations & PODs</span></div>
        <div className="divide-y divide-black/[0.04]">
          {documents.map((doc, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">{doc.icon}</div>
              <div className="flex-1 kmn-w-0">
                <div className="text-xs font-medium text-gray-800">{doc.name}</div>
                <div className="text-[11px] text-gray-400">{doc.type} · {doc.load} · {doc.size}</div>
              </div>
              <span className="text-[11px] text-gray-400">{doc.date}</span>
              <a href={doc.downloadUrl} download className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 transition-colors"><Download size={12} /> Download</a>
            </div>
          ))}
          {documents.length === 0 && (
            <div className="p-8 text-center text-xs text-gray-400">No documents found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShipperNotifications() {
  return (
    <div className="flex-1 overflow-auto p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-base font-semibold text-gray-900 mb-6">Notifications</h1>
      <div className="space-y-3">
        {[
          { icon: <Truck size={16} className="text-indigo-500" />, title: "LD-2847 is now In Transit", sub: "Tata Logistics departed Chicago terminal at 7:42 AM", time: "2h ago", unread: true },
          { icon: <CheckCircle size={16} className="text-emerald-500" />, title: "LD-2854 delivered successfully", sub: "Proof of Delivery verified · Kansas City to Denver", time: "1d ago", unread: false },
          { icon: <FileText size={16} className="text-purple-500" />, title: "Rate confirmation approved — LD-2849", sub: "$5,100 · Mahindra Logistics · Fresno to Seattle", time: "1d ago", unread: false },
          { icon: <CheckCircle size={16} className="text-emerald-500" />, title: "LD-2853 POD verified", sub: "Proof of Delivery confirmed · Los Angeles to Phoenix", time: "2d ago", unread: false },
        ].map((n, i) => (
          <div key={i} className={cn("bg-white rounded-2xl border p-4 flex items-start gap-3 transition-all", n.unread ? "border-indigo-200 ring-1 ring-indigo-50" : "border-black/[0.06]")}>
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", n.unread ? "bg-indigo-50" : "bg-gray-50")}>{n.icon}</div>
            <div className="flex-1 kmn-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-gray-900">{n.title}</span>
                {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />}
              </div>
              <div className="text-[11px] text-gray-400">{n.sub}</div>
            </div>
            <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShipperProfile() {
  return (
    <div className="flex-1 overflow-auto p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-base font-semibold text-gray-900 mb-6">Profile</h1>
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden mb-4">
        <div className="p-6 flex items-center gap-5 border-b border-black/[0.06]">
          <Avatar initials="AR" color="#8B5CF6" size="lg" />
          <div>
            <div className="text-base font-semibold text-gray-900">Amit Kumar</div>
            <div className="text-xs text-gray-400">Shipping Manager · Reliance Fresh</div>
          </div>
          <button className="ml-auto text-xs font-medium text-gray-600 border border-black/[0.1] px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">Edit Profile</button>
        </div>
        <div className="divide-y divide-black/[0.04]">
          {[["Full Name","Amit Kumar"],["Email","alex.rivera@midwestfoods.com"],["Company","Reliance Fresh"],["Phone","+1 (312) 555-0198"],["Timezone","America/Chicago (CST)"]].map(([l,v]) => (
            <div key={l} className="flex items-center justify-between px-5 py-3">
              <span className="text-xs text-gray-500">{l}</span>
              <span className="text-xs font-medium text-gray-800">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.06]"><span className="text-xs font-semibold text-gray-900">Notification Preferences</span></div>
        <div className="divide-y divide-black/[0.04]">
          {[["Shipment Status Updates","enabled"],["Delivery Confirmations","enabled"],["Document Ready Alerts","enabled"],["Weekly Summary Email","disabled"]].map(([l,v]) => (
            <div key={l} className="flex items-center justify-between px-5 py-3">
              <span className="text-xs text-gray-700">{l}</span>
              <button className={cn("relative w-10 h-5 rounded-full transition-colors", v === "enabled" ? "bg-indigo-600" : "bg-gray-200")}>
                <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", v === "enabled" ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShipperPortal({ onLogout }: { onLogout: () => void }) {
  const [page, setPage] = useState("dashboard");
  const meta: Record<string, { title: string; subtitle?: string }> = {
    dashboard: { title: "My Dashboard", subtitle: "Reliance Fresh" },
    "my-shipments": { title: "My Shipments", subtitle: "All freight shipments" },
    documents: { title: "Documents", subtitle: "PODs and confirmations" },
    notifications: { title: "Notifications", subtitle: "Updates and alerts" },
    profile: { title: "Profile", subtitle: "Account settings" },
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <ShipperDashboardPage onNav={setPage} />;
      case "my-shipments": return <ShipperMyShipments />;
      case "documents": return <ShipperDocuments />;
      case "notifications": return <ShipperNotifications />;
      case "profile": return <ShipperProfile />;
      default: return <ShipperDashboardPage onNav={setPage} />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background font-[Inter,sans-serif]">
      <PortalSidebar navItems={SHIPPER_NAV} active={page} onNav={setPage} orgName="Reliance Fresh" orgInitials="MF" userName="Amit Kumar" userRole="Shipper" accentColor="#8B5CF6" onLogout={onLogout} />
      <div className="flex-1 flex flex-col kmn-w-0 overflow-hidden">
        <PortalTopNav title={meta[page]?.title || "LoadFlow"} subtitle={meta[page]?.subtitle} userName="Amit Kumar" accentColor="#8B5CF6" />
        <main className="flex-1 overflow-hidden flex flex-col">{renderPage()}</main>
      </div>
    </div>
  );
}

// ─── SHIPPERS PAGE ───────────────────────────────────────────────────────────
const SHIPPERS_DATA = [
  { id: "SH-001", company: "Reliance Fresh", contact: "Amit Kumar", email: "amit@midwestfoods.com", phone: "+1 (312) 555-0198", city: "Mumbai, MH", activeLoads: 2, completedLoads: 47, revenue: 184000, lastShipment: "Jul 15", status: "active" as const, initials: "MF", color: "#4F46E5" },
  { id: "SH-002", company: "Pacific Retail Group", contact: "Sandra Kim", email: "sandra@pacificretail.com", phone: "+1 (415) 555-0142", city: "San Francisco, CA", activeLoads: 1, completedLoads: 31, revenue: 127000, lastShipment: "Jul 14", status: "active" as const, initials: "PR", color: "#10B981" },
  { id: "SH-003", company: "Heartland Manufacturing", contact: "Bob Turner", email: "bob@heartlandmfg.com", phone: "+1 (816) 555-0377", city: "Mumbai, MH", activeLoads: 3, completedLoads: 88, revenue: 342000, lastShipment: "Jul 15", status: "active" as const, initials: "HM", color: "#F59E0B" },
  { id: "SH-004", company: "Summit Electronics", contact: "Lisa Patel", email: "lisa@summitelec.com", phone: "+1 (206) 555-0291", city: "Chennai, TN", activeLoads: 0, completedLoads: 19, revenue: 76000, lastShipment: "Jun 28", status: "inactive" as const, initials: "SE", color: "#8B5CF6" },
  { id: "SH-005", company: "Lone Star Foods", contact: "Carlos Mendez", email: "carlos@lonestarfoods.com", phone: "+1 (214) 555-0158", city: "Ahmedabad, GJ", activeLoads: 4, completedLoads: 62, revenue: 241000, lastShipment: "Jul 15", status: "active" as const, initials: "LS", color: "#EF4444" },
  { id: "SH-006", company: "Atlantic Distribution", contact: "Mary Walsh", email: "mary@atlanticdist.com", phone: "+1 (617) 555-0483", city: "Boston, MA", activeLoads: 1, completedLoads: 24, revenue: 94000, lastShipment: "Jul 13", status: "active" as const, initials: "AD", color: "#06B6D4" },
];

function ShippersPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "table">("table");
  const [selected, setSelected] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingShipper, setEditingShipper] = useState<any>(null);
  const [form, setForm] = useState({ company: "", contact: "", email: "", phone: "", city: "" });

  const { data: shippersData, isLoading: isLoadingShippers } = useShippers();
  const createShipperMutation = useCreateShipper();
  const updateShipperMutation = useUpdateShipper();
  const deleteShipperMutation = useDeleteShipper();

  const shippers = (Array.isArray(shippersData) ? shippersData : SHIPPERS_DATA) as Array<any>;

  const filtered = shippers.filter((s: any) => {
    const company = (s.company || s.name || "").toLowerCase();
    const contact = (s.contact || "").toLowerCase();
    const city = (s.city || "").toLowerCase();
    return company.includes(search.toLowerCase()) || contact.includes(search.toLowerCase()) || city.includes(search.toLowerCase());
  });

  const handleCreateShipper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company.trim()) return;

    await createShipperMutation.mutateAsync({
      company: form.company.trim(),
      contact: form.contact.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
    });

    setShowInvite(false);
    setForm({ company: "", contact: "", email: "", phone: "", city: "" });
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Shippers</h1>
          <p className="text-xs text-gray-400 mt-0.5">{shippers.length} shipper accounts · {shippers.filter((s: any) => (s.status || "active") === "active").length} active</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors">
            <Plus size={13} /> Add Shipper
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Shippers", value: shippers.length.toString(), icon: <Building2 size={16} />, color: "#4F46E5" },
          { label: "Active This Month", value: shippers.filter((s: any) => (s.status || "active") === "active").length.toString(), icon: <Activity size={16} />, color: "#10B981" },
          { label: "Active Loads", value: shippers.reduce((a: number, s: any) => a + (s.activeLoads || 0), 0).toString(), icon: <Package size={16} />, color: "#F59E0B" },
          { label: "Total Revenue (YTD)", value: `₹${(shippers.reduce((a: number, s: any) => a + (s.revenue || 0), 0) / 1000).toFixed(0)}K`, icon: <DollarSign size={16} />, color: "#8B5CF6" },
        ].map((k, i) => <KPICard key={i} {...k} />)}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-black/[0.08] shadow-sm flex-1 max-w-sm">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shippers..." className="bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none flex-1" />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl ml-auto">
          <button onClick={() => setView("table")} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5", view === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800")}>
            <Layers size={12} /> Table
          </button>
          <button onClick={() => setView("grid")} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5", view === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800")}>
            <Hash size={12} /> Grid
          </button>
        </div>
      </div>

      {view === "table" ? (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                {["Company","Contact","Location","Active Loads","Completed","Revenue","Last Shipment","Status",""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filtered.map((s: any) => (
                <tr key={s.id} onClick={() => setSelected(s.id === selected ? null : s.id)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: s.color || "#4F46E5" }}>{(s.company || s.name || "").split(" ").map((word: string) => word[0]).join("").slice(0,2).toUpperCase()}</div>
                      <div>
                        <div className="text-xs font-semibold text-gray-900">{s.company || s.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-gray-800">{s.contact || "Contact pending"}</div>
                    <div className="text-[11px] text-gray-400">{s.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s.city || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-semibold", (s.activeLoads || 0) > 0 ? "text-indigo-600" : "text-gray-300")}>{s.activeLoads || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{s.completedLoads || 0}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-800">₹{(s.revenue || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{s.lastShipment || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", (s.status || "active") === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", (s.status || "active") === "active" ? "bg-emerald-500" : "bg-gray-400")} />{s.status || "active"}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setSelected(s.id === selected ? null : s.id)} className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium transition-colors">View</button>
                      <span className="text-gray-200">·</span>
                      <button onClick={() => { setEditingShipper(s); setForm({ company: s.company || s.name || "", contact: s.contact || "", email: s.email || "", phone: s.phone || "", city: s.city || "" }); setShowEditModal(true); }} className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors">Edit</button>
                      <span className="text-gray-200">·</span>
                      <button onClick={async () => { if (confirm(`Are you sure you want to delete ${s.company || s.name}?`)) { await deleteShipperMutation.mutateAsync(s.id); } }} className="text-[11px] text-red-600 hover:text-red-800 font-medium transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 flex flex-col items-center">
              <Building2 size={32} className="text-gray-200 mb-3" />
              <div className="text-sm font-medium text-gray-400">No shippers found</div>
              <div className="text-xs text-gray-300 mt-1">Try adjusting your search</div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id} className={cn("bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all cursor-pointer", selected === s.id ? "border-indigo-300 ring-1 ring-indigo-100" : "border-black/[0.06]")} onClick={() => setSelected(s.id === selected ? null : s.id)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: s.color }}>{s.initials}</div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{s.company}</div>
                    <div className="text-[11px] text-gray-400">{s.city}</div>
                  </div>
                </div>
                <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", s.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400")}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", s.status === "active" ? "bg-emerald-500" : "bg-gray-300")} />{s.status}
                </span>
              </div>
              <div className="space-y-1.5 mb-4 text-xs">
                <div className="flex items-center gap-2 text-gray-500"><User size={11} />{s.contact}</div>
                <div className="flex items-center gap-2 text-gray-400">{s.email}</div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-black/[0.05]">
                {[["Active", s.activeLoads.toString(), s.activeLoads > 0 ? "#4F46E5" : "#D1D5DB"], ["Done", s.completedLoads.toString(), "#10B981"], ["Revenue", `₹${(s.revenue/1000).toFixed(0)}K`, "#8B5CF6"]].map(([l,v,c]) => (
                  <div key={l as string} className="text-center">
                    <div className="text-sm font-bold" style={{ color: c as string }}>{v as string}</div>
                    <div className="text-[10px] text-gray-400">{l as string}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelected(s.id === selected ? null : s.id)} className="flex-1 text-[11px] font-medium text-indigo-600 border border-indigo-200 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">View Profile</button>
                <button onClick={async () => { if (confirm(`Are you sure you want to delete ${s.company || s.name}?`)) { await deleteShipperMutation.mutateAsync(s.id); } }} className="flex-1 text-[11px] font-medium text-red-650 border border-red-200 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Shipper modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between">
              <div><div className="text-sm font-semibold text-gray-900">Add Shipper Account</div><div className="text-[11px] text-gray-400 mt-0.5">Invite a new customer to the portal</div></div>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateShipper} className="p-6 space-y-4">
              {[
                ["Company Name *", "company", "Reliance Fresh"],
                ["Contact Name", "contact", "Amit Kumar"],
                ["Email Address", "email", "alex@company.com"],
                ["Phone", "phone", "+1 (312) 555-0000"],
                ["City", "city", "Mumbai, MH"],
              ].map(([label, field, placeholder]) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                  <input
                    value={form[field as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                  />
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={createShipperMutation.isPending} className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-60">
                  {createShipperMutation.isPending ? "Creating..." : "Create Shipper"}
                </button>
                <button type="button" onClick={() => setShowInvite(false)} className="flex-1 py-2.5 rounded-xl text-xs font-medium text-gray-600 border border-black/[0.1] hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shipper modal */}
      {showEditModal && editingShipper && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between">
              <div><div className="text-sm font-semibold text-gray-900">Edit Shipper Details</div><div className="text-[11px] text-gray-400 mt-0.5">Modify shipper account details</div></div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!form.company.trim()) return;
              try {
                await updateShipperMutation.mutateAsync({ id: editingShipper.id, data: { company: form.company.trim(), contact: form.contact.trim(), email: form.email.trim(), phone: form.phone.trim(), city: form.city.trim() } });
                setShowEditModal(false);
                setEditingShipper(null);
                setForm({ company: "", contact: "", email: "", phone: "", city: "" });
              } catch {}
            }} className="p-6 space-y-4">
              {[
                ["Company Name *", "company", "Reliance Fresh"],
                ["Contact Name", "contact", "Amit Kumar"],
                ["Email Address", "email", "alex@company.com"],
                ["Phone", "phone", "+1 (312) 555-0000"],
                ["City", "city", "Mumbai, MH"],
              ].map(([label, field, placeholder]) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                  <input
                    value={form[field as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                  />
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={updateShipperMutation.isPending} className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-60">
                  {updateShipperMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-medium text-gray-600 border border-black/[0.1] hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STAFF MANAGEMENT PAGE ────────────────────────────────────────────────────
const STAFF_DATA = [
  { id: "U-001", name: "Shreya Sharma", email: "shreya@loadflow.com", role: "Admin", department: "Operations", status: "active" as const, lastLogin: "Jul 15, 10:23 AM", mfa: true, initials: "SC", color: "#4F46E5", loadsHandled: 47, joinDate: "Jan 12, 2024" },
  { id: "U-002", name: "Rahul Verma", email: "rahul@loadflow.com", role: "Dispatcher", department: "Dispatch", status: "active" as const, lastLogin: "Jul 15, 9:41 AM", mfa: true, initials: "MT", color: "#10B981", loadsHandled: 124, joinDate: "Mar 5, 2024" },
  { id: "U-003", name: "Riya Patel", email: "riya@loadflow.com", role: "Carrier Ops", department: "Carrier Relations", status: "active" as const, lastLogin: "Jul 14, 4:17 PM", mfa: false, initials: "RP", color: "#F59E0B", loadsHandled: 89, joinDate: "Feb 18, 2024" },
  { id: "U-004", name: "James Kowalski", email: "james@loadflow.com", role: "Dispatcher", department: "Dispatch", status: "active" as const, lastLogin: "Jul 15, 8:05 AM", mfa: true, initials: "JK", color: "#EF4444", loadsHandled: 211, joinDate: "Nov 3, 2023" },
  { id: "U-005", name: "Divya Nair", email: "divya@loadflow.com", role: "Compliance", department: "Compliance", status: "active" as const, lastLogin: "Jul 15, 11:30 AM", mfa: true, initials: "DC", color: "#8B5CF6", loadsHandled: 0, joinDate: "Apr 2, 2024" },
  { id: "U-006", name: "Tarun Sen", email: "tarun@loadflow.com", role: "Dispatcher", department: "Dispatch", status: "inactive" as const, lastLogin: "Jun 22, 3:48 PM", mfa: false, initials: "TB", color: "#6B7280", loadsHandled: 56, joinDate: "Dec 10, 2023" },
  { id: "U-007", name: "Ananya Rao", email: "ananya@loadflow.com", role: "Billing", department: "Finance", status: "pending" as const, lastLogin: "—", mfa: false, initials: "AF", color: "#06B6D4", loadsHandled: 0, joinDate: "Invited Jul 14" },
];

function StaffPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"table" | "grid">("table");
  const [showInvite, setShowInvite] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [inviteStep, setInviteStep] = useState(0);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("Dispatcher");

  const { data: staffData, isLoading } = useStaff();
  const inviteStaffMutation = useInviteStaff();
  const setStaffStatusMutation = useSetStaffStatus();
  const changeStaffRoleMutation = useChangeStaffRole();
  const deleteStaffMutation = useDeleteStaff();

  if (isLoading) {
    return <div className="p-6">Loading staff directory...</div>;
  }

  const STAFF_DATA = (staffData || []).map((s: any) => ({
    ...s,
    loadsHandled: s.loadsHandled || 0,
    mfa: s.mfa ?? true,
    initials: s.name ? s.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : "US",
    color: "#4F46E5",
    joinDate: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "Jul 16, 2026",
    lastLogin: s.lastLogin || "—"
  }));

  const filtered = STAFF_DATA.filter(s =>
    (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.role || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.department || "").toLowerCase().includes(search.toLowerCase())
  );

  const staffDetail = STAFF_DATA.find(s => s.id === selectedStaff);

  const statusConfig = {
    active:   { label: "Active",   dot: "bg-emerald-500", bg: "bg-emerald-50",  text: "text-emerald-700" },
    inactive: { label: "Inactive", dot: "bg-gray-400",    bg: "bg-gray-100",    text: "text-gray-500" },
    pending:  { label: "Pending",  dot: "bg-amber-400",   bg: "bg-amber-50",    text: "text-amber-700" },
  };

  const handleInviteStaff = async () => {
    try {
      await inviteStaffMutation.mutateAsync({
        name: inviteName || inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole,
        department: inviteRole === "Admin" ? "Operations" : inviteRole === "Compliance" ? "Carrier Relations" : "Dispatch"
      });
      setShowInvite(false);
      setInviteEmail("");
      setInviteName("");
      setInviteStep(0);
    } catch {}
  };

  return (
    <div className="flex-1 overflow-hidden flex">
      {/* Main panel */}
      <div className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Staff Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">{STAFF_DATA.length} members · {STAFF_DATA.filter(s => s.status === "active").length} active</p>
          </div>
          <button onClick={() => { setShowInvite(true); setInviteStep(0); setInviteEmail(""); setInviteName(""); }} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-colors">
            <Plus size={13} /> Invite Staff
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Staff", value: STAFF_DATA.length.toString(), icon: <Users size={16} />, color: "#4F46E5" },
            { label: "Active", value: STAFF_DATA.filter(s => s.status === "active").length.toString(), icon: <CheckCircle size={16} />, color: "#10B981" },
            { label: "Pending Invite", value: STAFF_DATA.filter(s => s.status === "pending").length.toString(), icon: <Clock size={16} />, color: "#F59E0B" },
            { label: "MFA Enabled", value: `${STAFF_DATA.filter(s => s.mfa).length}/${STAFF_DATA.length}`, icon: <Shield size={16} />, color: "#8B5CF6" },
          ].map((k, i) => <KPICard key={i} {...k} />)}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-black/[0.08] shadow-sm flex-1 max-w-sm">
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..." className="bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none flex-1" />
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl ml-auto">
            {(["table","grid"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize", view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800")}>{v}</button>
            ))}
          </div>
        </div>

        {view === "table" ? (
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.05]">
                  {["Member","Role","Department","Loads","Last Login","MFA","Status",""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {filtered.map(staff => {
                  const sc = statusConfig[staff.status as keyof typeof statusConfig] || statusConfig.active;
                  return (
                    <tr key={staff.id} onClick={() => setSelectedStaff(selectedStaff === staff.id ? null : staff.id)} className={cn("hover:bg-gray-50 transition-colors cursor-pointer", selectedStaff === staff.id && "bg-indigo-50/60")}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={staff.initials} color={staff.color} size="md" />
                          <div>
                            <div className="text-xs font-semibold text-gray-900">{staff.name}</div>
                            <div className="text-[11px] text-gray-400">{staff.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">{staff.role}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{staff.department}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700">{staff.loadsHandled > 0 ? staff.loadsHandled : "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{staff.lastLogin}</td>
                      <td className="px-4 py-3">
                        {staff.mfa ? (
                          <div className="flex items-center gap-1"><CheckCircle size={13} className="text-emerald-500" /><span className="text-[11px] text-emerald-600 font-medium">On</span></div>
                        ) : (
                          <div className="flex items-center gap-1"><XCircle size={13} className="text-gray-300" /><span className="text-[11px] text-gray-400">Off</span></div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", sc.bg, sc.text)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />{sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedStaff(selectedStaff === staff.id ? null : staff.id)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><MoreHorizontal size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 flex flex-col items-center">
                <Users size={32} className="text-gray-200 mb-3" />
                <div className="text-sm font-medium text-gray-400">No staff found</div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map(staff => {
              const sc = statusConfig[staff.status as keyof typeof statusConfig] || statusConfig.active;
              return (
                <div key={staff.id} onClick={() => setSelectedStaff(selectedStaff === staff.id ? null : staff.id)} className={cn("bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all cursor-pointer", selectedStaff === staff.id ? "border-indigo-300 ring-1 ring-indigo-100" : "border-black/[0.06]")}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar initials={staff.initials} color={staff.color} size="lg" />
                      <div>
                        <div className="text-xs font-semibold text-gray-900">{staff.name}</div>
                        <div className="text-[11px] text-gray-400">{staff.email}</div>
                      </div>
                    </div>
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", sc.bg, sc.text)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />{sc.label}
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Role</span>
                      <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">{staff.role}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Department</span>
                      <span className="font-medium text-gray-700">{staff.department}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">MFA</span>
                      <div className="flex items-center gap-1">
                        {staff.mfa ? <CheckCircle size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-gray-300" />}
                        <span className={cn("text-[11px]", staff.mfa ? "text-emerald-600" : "text-gray-400")}>{staff.mfa ? "Enabled" : "Disabled"}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Loads</span>
                      <span className="font-semibold text-gray-700">{staff.loadsHandled > 0 ? staff.loadsHandled : "—"}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 mb-3">Last login: {staff.lastLogin}</div>
                  <div className="flex gap-2 pt-3 border-t border-black/[0.05]" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelectedStaff(staff.id)} className="flex-1 text-[11px] font-medium text-indigo-600 border border-indigo-200 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">View</button>
                    <button onClick={async () => {
                      if (confirm(`Are you sure you want to delete ${staff.name}?`)) {
                        await deleteStaffMutation.mutateAsync(staff.id);
                      }
                    }} className="flex-1 text-[11px] font-medium text-red-600 border border-red-200 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Staff detail side panel */}
      {staffDetail && (
        <div className="w-80 border-l border-black/[0.06] bg-white overflow-auto flex-shrink-0">
          <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-900">Member Details</span>
            <button onClick={() => setSelectedStaff(null)} className="text-gray-400 hover:text-gray-700 transition-colors"><X size={14} /></button>
          </div>
          <div className="p-5">
            {/* Profile header */}
            <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-black/[0.06]">
              <Avatar initials={staffDetail.initials} color={staffDetail.color} size="lg" />
              <div className="mt-3 text-sm font-semibold text-gray-900">{staffDetail.name}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{staffDetail.email}</div>
              <span className={cn("mt-2 inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full", (statusConfig[staffDetail.status as keyof typeof statusConfig] || statusConfig.active).bg, (statusConfig[staffDetail.status as keyof typeof statusConfig] || statusConfig.active).text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", (statusConfig[staffDetail.status as keyof typeof statusConfig] || statusConfig.active).dot)} />{(statusConfig[staffDetail.status as keyof typeof statusConfig] || statusConfig.active).label}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-6">
              {[
                ["Role", staffDetail.role], ["Department", staffDetail.department],
                ["Joined", staffDetail.joinDate], ["Last Login", staffDetail.lastLogin],
                ["Loads Handled", staffDetail.loadsHandled > 0 ? staffDetail.loadsHandled.toString() : "—"],
                ["MFA", staffDetail.mfa ? "Enabled ✓" : "Not enabled"],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between text-xs py-1.5 border-b border-black/[0.04] last:border-0">
                  <span className="text-gray-400">{l}</span>
                  <span className={cn("font-medium", l === "MFA" ? (staffDetail.mfa ? "text-emerald-600" : "text-amber-600") : "text-gray-800")}>{v}</span>
                </div>
              ))}
            </div>

            {/* Permissions preview */}
            <div className="mb-6">
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Permissions via {staffDetail.role}</div>
              <div className="flex flex-wrap gap-1.5">
                {(staffDetail.role === "Admin"
                  ? ["loads.view","loads.create","carriers.view","carriers.edit","staff.manage","roles.manage","audit.view","reports.view"]
                  : staffDetail.role === "Dispatcher"
                  ? ["loads.view","loads.create","carriers.view","rate-confirmations.view"]
                  : staffDetail.role === "Compliance"
                  ? ["carriers.view","compliance.manage","audit.view"]
                  : ["loads.view","reports.view"]
                ).map(p => (
                  <span key={p} className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">{p}</span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button onClick={() => {
                const newRole = prompt("Enter new role (Admin, Dispatcher, Compliance, Billing, Read Only):", staffDetail.role);
                if (newRole) {
                  changeStaffRoleMutation.mutate({ id: staffDetail.id, role: newRole });
                }
              }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-xs font-medium text-gray-700">
                <Edit2 size={13} /> Edit Role & Permissions
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-xs font-medium text-gray-700">
                <Key size={13} /> Reset Password
              </button>
              <button onClick={() => setStaffStatusMutation.mutate({ id: staffDetail.id, status: staffDetail.status === 'inactive' ? 'reactivate' : 'deactivate' })} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-xs font-medium text-gray-700">
                <Shield size={13} /> {staffDetail.mfa ? "Revoke MFA" : "Require MFA"}
              </button>
              {staffDetail.status === "active" ? (
                <button onClick={() => setStaffStatusMutation.mutate({ id: staffDetail.id, status: "deactivate" })} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-xs font-medium text-red-600">
                  <XCircle size={13} /> Deactivate Account
                </button>
              ) : staffDetail.status === "pending" ? (
                <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors text-xs font-medium text-indigo-700">
                  <Send size={13} /> Resend Invitation
                </button>
              ) : (
                <button onClick={() => setStaffStatusMutation.mutate({ id: staffDetail.id, status: "reactivate" })} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors text-xs font-medium text-emerald-700">
                  <CheckCircle size={13} /> Reactivate Account
                </button>
              )}
              <button onClick={async () => {
                if (confirm(`Are you sure you want to delete ${staffDetail.name}?`)) {
                  try {
                    await deleteStaffMutation.mutateAsync(staffDetail.id);
                    setSelectedStaff(null);
                  } catch {}
                }
              }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-xs font-medium text-red-600">
                <Trash2 size={13} /> Delete Staff Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Staff modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Invite Staff Member</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Step {inviteStep + 1} of 3</div>
              </div>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
              <div className="h-full bg-indigo-600 transition-all rounded-r-full" style={{ width: `${((inviteStep + 1) / 3) * 100}%` }} />
            </div>

            <div className="p-6">
              {inviteStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1.5">Full Name *</label>
                    <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Amit Sharma" className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all mb-4" />
                    <label className="block text-xs font-semibold text-gray-800 mb-1.5">Email Address *</label>
                    <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@yourcompany.com" className="w-full px-3 py-2.5 rounded-xl border border-black/[0.1] bg-gray-50 text-sm placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all" />
                  </div>
                  <p className="text-xs text-gray-400">An invitation email will be sent. The link expires in 48 hours.</p>
                </div>
              )}
              {inviteStep === 1 && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-gray-800 mb-3">Assign Role</div>
                  {["Admin","Dispatcher","Carrier Ops","Compliance","Billing","Read Only"].map(r => (
                    <label key={r} onClick={() => setInviteRole(r)} className={cn("flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all", inviteRole === r ? "border-indigo-400 bg-indigo-50" : "border-transparent bg-gray-50 hover:bg-gray-100")}>
                      <div>
                        <div className={cn("text-xs font-semibold", inviteRole === r ? "text-indigo-800" : "text-gray-700")}>{r}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {r === "Admin" ? "Full access — all features" : r === "Dispatcher" ? "Loads, carriers, rate confirmations" : r === "Carrier Ops" ? "Carrier management & compliance" : r === "Compliance" ? "Compliance review & alerts" : r === "Billing" ? "Rate confirmations & financials" : "View-only access to all modules"}
                        </div>
                      </div>
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0", inviteRole === r ? "border-indigo-500 bg-indigo-500" : "border-gray-300")}>
                        {inviteRole === r && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {inviteStep === 2 && (
                <div className="space-y-4">
                  <div className="text-xs font-semibold text-gray-800 mb-3">Review & Confirm</div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                    {[["Name", inviteName], ["Inviting", inviteEmail || "colleague@company.com"], ["Role", inviteRole], ["Access", "Portal login + role permissions"], ["Expiry", "Invite expires in 48 hours"]].map(([l, v]) => (
                      <div key={l} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{l}</span>
                        <span className="font-medium text-gray-800">{v}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400">The user will receive an invitation email with a setup link. You can revoke the invite at any time from Staff Management.</p>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex items-center gap-3">
              {inviteStep > 0 && (
                <button onClick={() => setInviteStep(p => p - 1)} className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-600 border border-black/[0.1] hover:bg-gray-50 transition-colors">Back</button>
              )}
              <button
                onClick={() => {
                  if (inviteStep < 2) setInviteStep(p => p + 1);
                  else handleInviteStaff();
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                {inviteStep === 2 ? "Send Invitation" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BROKER ADMIN PORTAL (wrapped) ───────────────────────────────────────────
function BrokerAdminPortal({ onLogout }: { onLogout: () => void }) {
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const PAGE_META: Record<Page, { title: string; subtitle?: string }> = {
    dashboard:            { title: "Dashboard", subtitle: "Operations overview" },
    loads:                { title: "Loads", subtitle: "All freight loads" },
    "rate-confirmations": { title: "Rate Confirmations", subtitle: "RC-1192 · LD-2847" },
    carriers:             { title: "Carriers", subtitle: "Carrier network" },
    compliance:           { title: "Compliance", subtitle: "Health dashboard" },
    shippers:             { title: "Shippers", subtitle: "Customer accounts" },
    staff:                { title: "Staff", subtitle: "Team management" },
    roles:                { title: "Roles & Permissions", subtitle: "RBAC configuration" },
    audit:                { title: "Audit Log", subtitle: "Full activity trail" },
    reports:              { title: "Reports", subtitle: "Executive analytics" },
    settings:             { title: "Settings", subtitle: "System configuration" },
    "load-detail":        { title: "Load LD-2847", subtitle: "Reliance Fresh" },
    "create-load":        { title: "Create Load", subtitle: "New freight shipment" },
    "carrier-detail":     { title: "Tata Logistics", subtitle: "Carrier profile" },
    "shipper-view":       { title: "Shipper View", subtitle: "My Shipments" },
    "carrier-view":       { title: "Carrier View", subtitle: "Assigned Loads" },
  };

  const meta = PAGE_META[page] || { title: "LoadFlow" };

  const renderPage = () => {
    if (loading) {
      return (
        <div className="flex-1 p-6 space-y-4">
          <div className="grid grid-cols-7 gap-4">
            {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-64 col-span-2" /><Skeleton className="h-64" />
          </div>
        </div>
      );
    }
    switch (page) {
      case "dashboard":         return <Dashboard onNav={setPage} setSelectedLoadId={setSelectedLoadId} />;
      case "loads":             return <LoadsList onNav={setPage} setSelectedLoadId={setSelectedLoadId} />;
      case "load-detail":       return <LoadDetail onNav={setPage} loadId={selectedLoadId} setSelectedCarrierId={setSelectedCarrierId} />;
      case "create-load":       return <CreateLoad onNav={setPage} />;
      case "carriers":          return <CarriersPage onNav={setPage} setSelectedCarrierId={setSelectedCarrierId} />;
      case "carrier-detail":    return <CarrierDetail onNav={setPage} carrierId={selectedCarrierId} />;
      case "compliance":        return <CarrierDetail onNav={setPage} carrierId={selectedCarrierId} />;
      case "rate-confirmations":return <RateConfirmations />;
      case "roles":             return <RolesPage />;
      case "audit":             return <AuditLog />;
      case "reports":           return <Reports />;
      case "settings":          return <SettingsPage />;
      case "shippers":          return <ShippersPage />;
      case "staff":             return <StaffPage />;
      default:                  return <Dashboard onNav={setPage} />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background font-[Inter,sans-serif]">
      <Sidebar active={page} onNav={setPage} onLogout={onLogout} />
      <div className="flex-1 flex flex-col kmn-w-0 overflow-hidden">
        <TopNav title={meta.title} subtitle={meta.subtitle} onNav={setPage} setSelectedLoadId={setSelectedLoadId} setSelectedCarrierId={setSelectedCarrierId} />
        <main className="flex-1 overflow-hidden flex flex-col">{renderPage()}</main>
      </div>
    </div>
  );
}

// ─── PORTAL SELECTOR ─────────────────────────────────────────────────────────
function PortalSelector({ onSelect, onBack }: { onSelect: (p: PortalType) => void; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-[Inter,sans-serif] p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center"><Zap size={18} className="text-white" /></div>
            <span className="text-lg font-bold text-gray-900">LoadFlow</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose a demo portal</h1>
          <p className="text-sm text-gray-400">Explore every role in the LoadFlow platform</p>
        </div>
        <div className="grid grid-cols-3 gap-5 mb-6">
          {[
            { portal: "broker-admin" as PortalType, label: "Broker Admin", sub: "Shreya Sharma · Full access", icon: <Building2 size={22} />, color: "#4F46E5", desc: "Complete brokerage operations — loads, carriers, staff, RBAC, audit, reports, settings" },
            { portal: "broker-staff" as PortalType, label: "Broker Staff", sub: "Rahul Verma · Dispatcher", icon: <Users size={22} />, color: "#3B82F6", desc: "Permission-limited broker view — Dashboard, Loads, Rate Confirmations, Carriers" },
            { portal: "carrier-admin" as PortalType, label: "Carrier Admin", sub: "Deepak Gupta · Admin", icon: <Truck size={22} />, color: "#10B981", desc: "Carrier workspace — Loads, POD Upload, Compliance, Staff, Reports, Settings" },
            { portal: "carrier-staff" as PortalType, label: "Carrier Staff", sub: "Jaspreet Singh · Driver", icon: <MapPin size={22} />, color: "#06B6D4", desc: "Driver-focused view — My Loads, Status Updates, Upload POD" },
            { portal: "shipper" as PortalType, label: "Shipper Portal", sub: "Amit Kumar · Shipper", icon: <Package size={22} />, color: "#8B5CF6", desc: "Customer-facing view — Shipments, Tracking, Documents, Notifications" },
          ].map(cfg => (
            <button key={cfg.portal} onClick={() => onSelect(cfg.portal)} className="bg-white rounded-2xl border border-black/[0.07] p-6 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all group">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-105 transition-transform" style={{ backgroundColor: cfg.color }}>{cfg.icon}</div>
              <div className="text-sm font-semibold text-gray-900 mb-0.5">{cfg.label}</div>
              <div className="text-[11px] text-gray-400 mb-3">{cfg.sub}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{cfg.desc}</div>
              <div className="mt-4 text-[11px] font-semibold flex items-center gap-1" style={{ color: cfg.color }}>Enter portal <ArrowRight size={11} /></div>
            </button>
          ))}
          <button onClick={onBack} className="bg-gray-950 rounded-2xl border border-gray-800 p-6 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all group">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 bg-white/10 group-hover:scale-105 transition-transform"><Zap size={22} className="text-white" /></div>
            <div className="text-sm font-semibold text-white mb-0.5">Back to Landing</div>
            <div className="text-[11px] text-gray-500 mb-3">Marketing website</div>
            <div className="text-xs text-gray-500 leading-relaxed">View the public-facing landing page and start fresh from the login screen</div>
            <div className="mt-4 text-[11px] font-semibold text-gray-400 flex items-center gap-1">View landing <ArrowRight size={11} /></div>
          </button>
        </div>
        <p className="text-center text-[11px] text-gray-400">All portals use the same design system · Data is illustrative</p>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
type AppMode = "landing" | "auth" | "portal-select" | "app";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

function AppContent() {
  const { user, isLoading, login, signup, logout } = useAuth();
  const [mode, setMode] = useState<AppMode>("landing");
  const [portal, setPortal] = useState<PortalType>("broker-admin");

  useEffect(() => {
    if (user) {
      setMode("app");
      if (user.organizationType === 'BROKER') {
        setPortal(user.role === 'Admin' ? 'broker-admin' : 'broker-staff');
      } else if (user.organizationType === 'CARRIER') {
        setPortal(user.role === 'Admin' ? 'carrier-admin' : 'carrier-staff');
      } else if (user.organizationType === 'SHIPPER') {
        setPortal('shipper');
      }
    } else {
      if (mode === "app") {
        setMode("landing");
      }
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-[Inter,sans-serif]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-gray-500 font-medium">Loading your LoadFlow workspace...</p>
      </div>
    );
  }

  const handleLogin = () => setMode("auth");
  const handleAuth = async (p: PortalType) => {
    setPortal(p);
    setMode("app");
  };
  const handleLogout = () => {
    logout();
    setMode("landing");
  };
  const handlePortalSelect = (p: PortalType) => { setPortal(p); setMode("app"); };

  if (mode === "landing") return <LandingPage onLogin={handleLogin} />;
  if (mode === "auth") return <AuthScreen onAuth={handleAuth} onLogin={login} onSignup={signup} />;
  if (mode === "portal-select") return <PortalSelector onSelect={handlePortalSelect} onBack={() => setMode("landing")} />;

  switch (portal) {
    case "broker-admin":  return <BrokerAdminPortal onLogout={handleLogout} />;
    case "broker-staff":  return <BrokerStaffPortal onLogout={handleLogout} />;
    case "carrier-admin": return <CarrierAdminPortal user={user} onLogout={handleLogout} />;
    case "carrier-staff": return <CarrierStaffPortal onLogout={handleLogout} />;
    case "shipper":       return <ShipperPortal onLogout={handleLogout} />;
    default:              return <BrokerAdminPortal onLogout={handleLogout} />;
  }
}