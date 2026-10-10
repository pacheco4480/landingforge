import * as React from "react";

import { Card } from "@/components/ui/layout";
import { cn } from "@/lib/utils";

export function Table({
  className,
  caption,
  "aria-label": ariaLabel,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & { caption?: string }) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        aria-label={ariaLabel ?? (caption ? undefined : "Data table")}
        className={cn("w-full min-w-max text-left text-sm", className)}
        {...props}
      >
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {props.children}
      </table>
    </div>
  );
}

export function DataTable({
  caption,
  columns,
  rows,
}: {
  caption?: string;
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
}) {
  return (
    <Table caption={caption}>
      <thead className="border-border text-muted-foreground border-b text-xs uppercase">
        <tr>
          {columns.map((column) => (
            <th className="px-3 py-2 font-semibold" key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr className="border-border border-b last:border-0" key={`row-${rowIndex}`}>
            {row.map((cell, cellIndex) => (
              <td className="px-3 py-3" key={`${rowIndex}-${cellIndex}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-border rounded-md border border-dashed p-8 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <Card>
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-normal">{value}</p>
      {helper ? (
        <p className="text-muted-foreground mt-2 text-sm">{helper}</p>
      ) : null}
    </Card>
  );
}
