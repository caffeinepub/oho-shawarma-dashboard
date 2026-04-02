import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type MaintenanceRow, getMaintenanceTrackerData } from "@/lib/store";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function MaintenanceTrackerPage() {
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMaintenanceTrackerData()
      .then((data) => {
        setMaintenanceData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load maintenance data:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-[#fdbc0c] pl-4">
        <h2 className="font-display font-bold text-2xl">Maintenance Tracker</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Each row represents one audit submission. Records are never
          overwritten &mdash; all historical data is preserved.
        </p>
      </div>

      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="font-display font-bold text-base flex items-center gap-2">
            <span className="w-2 h-5 rounded-sm bg-primary inline-block" />
            Maintenance &amp; Expiry Tracker
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Tracks fire extinguisher expiry, equipment service dates, and pest
            control schedules across all outlets. Sorted by latest audit date.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div
              data-ocid="maintenance.table.loading_state"
              className="flex justify-center items-center py-16"
            >
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div
              className="overflow-auto"
              style={{ maxHeight: "calc(100vh - 220px)" }}
            >
              <table className="min-w-full text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr>
                    {[
                      "Outlet Name",
                      "Audit Date",
                      "Fire Extinguisher Expiry",
                      "Duct & Hood Last Service",
                      "Water Filter Last Service",
                      "Visicooler Last Service",
                      "Deep Freezer Last Service",
                      "Next Pest Control Date",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 text-left font-semibold whitespace-nowrap border-b dark:bg-slate-800 dark:text-slate-100"
                        style={{ backgroundColor: "#fdbc0c", color: "#361e14" }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {maintenanceData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        data-ocid="maintenance.table.empty_state"
                        className="px-3 py-10 text-center text-muted-foreground"
                      >
                        No audit data yet. Submit audits to populate this
                        tracker.
                      </td>
                    </tr>
                  ) : (
                    maintenanceData.map((row, idx) => (
                      <tr
                        key={`${row.outletName}-${row.auditDate ?? "none"}-${idx}`}
                        data-ocid={`maintenance.table.item.${idx + 1}`}
                        className={
                          idx % 2 === 0 ? "bg-background" : "bg-muted/30"
                        }
                      >
                        <td className="px-3 py-2 font-medium whitespace-nowrap border-b">
                          {row.outletName}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-b">
                          {row.auditDate ?? "--"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-b">
                          {row.fireExtinguisherExpiryDate ?? "--"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-b">
                          {row.ductHoodLastServiceDate ?? "--"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-b">
                          {row.waterFilterLastServiceDate ?? "--"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-b">
                          {row.visicoolerLastServiceDate ?? "--"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-b">
                          {row.deepFreezerLastServiceDate ?? "--"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap border-b">
                          {row.pestControlDate ?? "--"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
