import { Component, For } from 'solid-js';
import { Loader2 } from 'lucide-solid';

export interface TableSkeletonProps {
  cols: number;
  rows?: number;
}

export const TableSkeleton: Component<TableSkeletonProps> = (props) => {
  const rowCount = () => props.rows ?? 5;
  const colCount = () => props.cols;

  return (
    <For each={Array.from({ length: rowCount() })}>
      {(_, idx) => (
        <tr class="border-b border-slate-100 animate-pulse">
          <For each={Array.from({ length: colCount() })}>
            {(_, cIdx) => {
              // Vary widths slightly across columns to make it look realistic
              const widthClasses = [
                'w-28',
                'w-20',
                'w-16',
                'w-24',
                'w-14',
                'w-20',
                'w-16'
              ];
              const w = widthClasses[(idx() + cIdx()) % widthClasses.length];
              return (
                <td class="p-3">
                  <div class={`h-3.5 bg-slate-200/80 rounded-md ${w}`} />
                </td>
              );
            }}
          </For>
        </tr>
      )}
    </For>
  );
};

export interface CardSkeletonProps {
  count?: number;
}

export const CardSkeleton: Component<CardSkeletonProps> = (props) => {
  const count = () => props.count ?? 4;

  return (
    <For each={Array.from({ length: count() })}>
      {() => (
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs animate-pulse space-y-3">
          <div class="flex items-center justify-between">
            <div class="h-3 bg-slate-200/80 rounded w-20" />
            <div class="w-8 h-8 rounded-lg bg-slate-100" />
          </div>
          <div class="h-7 bg-slate-200 rounded w-32" />
          <div class="h-2.5 bg-slate-100 rounded w-24" />
        </div>
      )}
    </For>
  );
};

export interface ListItemSkeletonProps {
  count?: number;
}

export const ListItemSkeleton: Component<ListItemSkeletonProps> = (props) => {
  const count = () => props.count ?? 4;

  return (
    <div class="divide-y divide-slate-100">
      <For each={Array.from({ length: count() })}>
        {() => (
          <div class="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="h-4 bg-slate-200 rounded w-36" />
                <div class="h-3 bg-slate-100 rounded w-24" />
              </div>
              <div class="flex items-center gap-2">
                <div class="h-3 bg-slate-100 rounded w-20" />
                <div class="h-3 bg-slate-100 rounded w-28" />
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="h-5 bg-slate-200 rounded w-24" />
              <div class="h-8 bg-slate-100 rounded w-20" />
            </div>
          </div>
        )}
      </For>
    </div>
  );
};

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  center?: boolean;
}

export const LoadingSpinner: Component<LoadingSpinnerProps> = (props) => {
  const sizeClass = () => {
    switch (props.size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      default:
        return 'w-5 h-5';
    }
  };

  const content = (
    <div class="inline-flex items-center gap-2 text-slate-500 font-medium">
      <Loader2 class={`${sizeClass()} animate-spin text-emerald-600`} />
      {props.text && <span class="text-xs">{props.text}</span>}
    </div>
  );

  if (props.center) {
    return (
      <div class="flex items-center justify-center p-8 w-full">
        {content}
      </div>
    );
  }

  return content;
};
