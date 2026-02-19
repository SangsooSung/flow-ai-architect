import type { SchemaDefinition } from "@/types/project";
import { Database, Key, Link2, AlertCircle } from "lucide-react";

interface SchemaDictProps {
  schemas: SchemaDefinition[];
}

export function SchemaDict({ schemas }: SchemaDictProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Database className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Schema & Data Dictionary</h3>
          <p className="text-xs text-muted-foreground">Column-to-type mapping for ERP database</p>
        </div>
      </div>

      {schemas.map((schema) => (
        <div key={schema.artifactId} className="border border-border/60 rounded-2xl bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 bg-gradient-to-r from-indigo-50/50 dark:from-indigo-950/30 to-transparent">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold font-mono">
                {schema.proposedTableName}
              </span>
              <span className="text-xs text-muted-foreground">
                from {schema.artifactName}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30 text-left">
                  <th className="px-4 py-2.5 font-semibold text-muted-foreground">Column</th>
                  <th className="px-4 py-2.5 font-semibold text-muted-foreground">Target Type</th>
                  <th className="px-4 py-2.5 font-semibold text-muted-foreground hidden md:table-cell">Description</th>
                  <th className="px-4 py-2.5 font-semibold text-muted-foreground text-center">Nullable</th>
                </tr>
              </thead>
              <tbody>
                {schema.columns.map((col, i) => (
                  <tr key={col.columnName} className={`border-t border-border/30 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/10'}`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {col.isPrimaryKey && (
                          <span title="Primary Key"><Key className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /></span>
                        )}
                        {col.isForeignKey && (
                          <span title="Foreign Key"><Link2 className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" /></span>
                        )}
                        <span className="font-mono font-medium text-foreground">{col.columnName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] ${getTypeColor(col.targetType)}`}>
                        {col.targetType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell max-w-xs">
                      <span className="line-clamp-2">{col.description}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {col.nullable ? (
                        <span className="text-amber-500 dark:text-amber-400 text-[10px] font-medium">NULL</span>
                      ) : (
                        <span className="text-emerald-500 dark:text-emerald-400 text-[10px] font-medium">NOT NULL</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 border-t border-border/40 bg-muted/20 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Primary Key
            </span>
            <span className="flex items-center gap-1">
              <Link2 className="w-3 h-3 text-cyan-500 dark:text-cyan-400" /> Foreign Key
            </span>
            <span className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> {schema.columns.length} columns
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function getTypeColor(type: string): string {
  if (type.includes("Varchar") || type.includes("string")) return "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300";
  if (type.includes("Decimal") || type.includes("Integer") || type.includes("int")) return "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300";
  if (type.includes("Enum")) return "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300";
  if (type.includes("FK") || type.includes("Foreign")) return "bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300";
  if (type.includes("Timestamp") || type.includes("Date")) return "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300";
  if (type.includes("Computed") || type.includes("calculated")) return "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300";
  return "bg-muted text-foreground";
}
