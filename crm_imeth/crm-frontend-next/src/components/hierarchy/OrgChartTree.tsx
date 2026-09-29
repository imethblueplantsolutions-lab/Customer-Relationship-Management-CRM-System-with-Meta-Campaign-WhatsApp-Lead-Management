'use client';

import React, { useState } from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';
import type { User } from '@/types';
import {
  Crown,
  Shield,
  Zap,
  Briefcase,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Users,
  ChevronRight,
  Sparkles,
  Building2,
  Maximize2,
  Trash2,
} from 'lucide-react';

// Role styling and metadata
const ROLE_CONFIG: Record<
  string,
  {
    label: string;
    tier: number;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
    cardBorder: string;
    cardBg: string;
  }
> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    tier: 1,
    icon: Crown,
    badgeClass:
      'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    cardBorder: 'border-purple-300/80 dark:border-purple-700/80 shadow-purple-500/10',
    cardBg: 'bg-gradient-to-b from-purple-50/50 to-white dark:from-purple-950/20 dark:to-slate-900',
  },
  ADMIN: {
    label: 'Administrator',
    tier: 2,
    icon: Shield,
    badgeClass:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    cardBorder: 'border-blue-300/80 dark:border-blue-700/80 shadow-blue-500/10',
    cardBg: 'bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-950/20 dark:to-slate-900',
  },
  TEAM_LEAD: {
    label: 'Team Lead',
    tier: 3,
    icon: Zap,
    badgeClass:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    cardBorder: 'border-amber-300/80 dark:border-amber-700/80 shadow-amber-500/10',
    cardBg: 'bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-950/20 dark:to-slate-900',
  },
  AGENT: {
    label: 'Sales Agent',
    tier: 4,
    icon: Briefcase,
    badgeClass:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    cardBorder: 'border-emerald-300/80 dark:border-emerald-700/80 shadow-emerald-500/10',
    cardBg: 'bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900',
  },
};

function getRoleMeta(role?: string) {
  return ROLE_CONFIG[role || 'AGENT'] || ROLE_CONFIG.AGENT;
}

// ─── Individual Org Node Card ────────────────────────────────────────────────
interface OrgNodeCardProps {
  node: User;
  onAssign?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export const OrgNodeCard: React.FC<OrgNodeCardProps> = ({ node, onAssign, onDelete }) => {
  const meta = getRoleMeta(node.role);
  const RoleIcon = meta.icon;
  const directReportsCount = node.teamMembers?.length || 0;
  const isSuper = node.role === 'SUPER_ADMIN';

  return (
    <div
      className={`inline-block text-left rounded-2xl border-2 p-3.5 min-w-[200px] max-w-[250px] shadow-sm hover:shadow-md transition-all duration-200 select-none group relative bg-white dark:bg-slate-900 ${meta.cardBorder} ${meta.cardBg}`}
    >
      {/* Top Header: Role Badge & Delete Icon / Level */}
      <div className="flex items-center justify-between gap-1 mb-2.5">
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border tracking-wide uppercase ${meta.badgeClass}`}
        >
          <RoleIcon className="h-3 w-3 shrink-0" />
          <span>{meta.label}</span>
        </span>

        {/* Delete Icon Action replacing the Level */}
        {!isSuper && onDelete ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
            title={`Delete ${node.name || node.email}`}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 dark:hover:text-red-400 transition-colors cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-800"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
            L{meta.tier}
          </span>
        )}
      </div>

      {/* User Info with Avatar */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="relative shrink-0">
          {node.avatar ? (
            <img
              src={node.avatar}
              alt={node.name || node.email}
              className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 font-bold text-white text-xs shadow-xs">
              {node.name ? node.name.charAt(0).toUpperCase() : node.email.charAt(0).toUpperCase()}
            </div>
          )}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
              node.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
            title={node.isActive !== false ? 'Active User' : 'Inactive User'}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {node.name || node.email.split('@')[0]}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={node.email}>
            {node.email}
          </p>
        </div>
      </div>

      {/* Footer Info: Subordinates Count & Quick Actions */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
        {directReportsCount > 0 ? (
          <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
            <Users className="h-3 w-3" />
            <span>
              {directReportsCount} {directReportsCount === 1 ? 'report' : 'reports'}
            </span>
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 italic">No reports</span>
        )}

        {onAssign && !isSuper && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAssign(node);
            }}
            className="rounded-md border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 px-2 py-0.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 transition-colors cursor-pointer"
          >
            Reassign
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main OrgChartTree Component ─────────────────────────────────────────────
interface OrgChartTreeProps {
  data: User[] | User;
  onAssignManager?: (user: User) => void;
  onDeleteUser?: (user: User) => void;
}

export default function OrgChartTree({ data, onAssignManager, onDeleteUser }: OrgChartTreeProps) {
  const [zoom, setZoom] = useState(1);

  // Normalize data into array of roots
  const roots: User[] = Array.isArray(data) ? data : data ? [data] : [];

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => setZoom(1);

  // Recursive tree rendering for child nodes
  const renderTreeNodes = (nodes?: User[]) => {
    if (!nodes || nodes.length === 0) return null;
    return nodes.map((node) => (
      <TreeNode
        key={node.id}
        label={<OrgNodeCard node={node} onAssign={onAssignManager} onDelete={onDeleteUser} />}
      >
        {renderTreeNodes(node.teamMembers)}
      </TreeNode>
    ));
  };

  if (roots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
        <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No organizational hierarchy data available.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Click &quot;Auto-Link Standard Hierarchy&quot; above to build the organizational tree.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 md:p-8 dark:border-slate-800 dark:bg-slate-950/40 shadow-xs overflow-hidden">
      {/* Zoom and Navigation Toolbar */}
      <div className="sticky top-2 z-20 flex items-center justify-between mb-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-fit mx-auto">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono font-semibold px-2 text-slate-600 dark:text-slate-300 min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset Zoom"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Tree Visualization Canvas with Horizontal Scroll */}
      <div className="w-full overflow-x-auto pb-8 pt-2">
        <div
          className="inline-block min-w-full text-center transition-transform duration-150 origin-top"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          {roots.length === 1 ? (
            <Tree
              lineWidth="2px"
              lineColor="#cbd5e1"
              lineBorderRadius="4px"
              nodePadding="16px"
              label={<OrgNodeCard node={roots[0]} onAssign={onAssignManager} onDelete={onDeleteUser} />}
            >
              {renderTreeNodes(roots[0].teamMembers)}
            </Tree>
          ) : (
            // If multiple roots exist (e.g. multiple unassigned or multi-head org), group under Apex Header
            <Tree
              lineWidth="2px"
              lineColor="#cbd5e1"
              lineBorderRadius="4px"
              nodePadding="20px"
              label={
                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md border border-slate-700/80">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold tracking-tight">Organization Root</p>
                    <p className="text-[10px] text-slate-400">
                      {roots.length} Executive Branches
                    </p>
                  </div>
                </div>
              }
            >
              {roots.map((root) => (
                <TreeNode
                  key={root.id}
                  label={<OrgNodeCard node={root} onAssign={onAssignManager} onDelete={onDeleteUser} />}
                >
                  {renderTreeNodes(root.teamMembers)}
                </TreeNode>
              ))}
            </Tree>
          )}
        </div>
      </div>

      <div className="mt-4 text-center">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          💡 Tip: Use mouse scroll or trackpad horizontally to inspect wider branch levels. Click Reassign on any node to change reporting supervisor.
        </span>
      </div>
    </div>
  );
}
