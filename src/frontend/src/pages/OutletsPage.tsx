import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type Outlet,
  createOutlet,
  deactivateOutlet,
  deleteOutlet,
  getAllOutlets,
  reactivateOutlet,
  updateOutlet,
} from "@/lib/store";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  ChevronUp,
  Pencil,
  PlusCircle,
  PowerOff,
  RefreshCw,
  Store,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function OutletsPage() {
  const [allOutlets, setAllOutlets] = useState<Outlet[]>(() => getAllOutlets());
  const [sortAZ, setSortAZ] = useState(true);
  const [deactivatedOpen, setDeactivatedOpen] = useState(false);

  const refresh = () => setAllOutlets(getAllOutlets());

  const activeOutlets = allOutlets
    .filter((o) => o.status === "active")
    .sort((a, b) =>
      sortAZ ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );

  const deactivatedOutlets = allOutlets
    .filter((o) => o.status === "deactivated")
    .sort((a, b) => a.name.localeCompare(b.name));

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", code: "" });

  // Edit modal
  const [editOutlet, setEditOutlet] = useState<Outlet | null>(null);
  const [editForm, setEditForm] = useState({ name: "", code: "" });

  // Deactivate confirm
  const [deactivateTarget, setDeactivateTarget] = useState<Outlet | null>(null);

  // Delete confirm (test only)
  const [deleteTarget, setDeleteTarget] = useState<Outlet | null>(null);

  const handleAdd = () => {
    if (!addForm.name || !addForm.code) {
      toast.error("Please fill in all fields.");
      return;
    }
    createOutlet(addForm);
    refresh();
    setAddOpen(false);
    setAddForm({ name: "", code: "" });
    toast.success("Outlet added successfully.");
  };

  const openEdit = (outlet: Outlet) => {
    setEditOutlet(outlet);
    setEditForm({ name: outlet.name, code: outlet.code });
  };

  const handleEdit = () => {
    if (!editOutlet) return;
    updateOutlet(editOutlet.id, editForm);
    refresh();
    setEditOutlet(null);
    toast.success("Outlet updated successfully.");
  };

  const handleDeactivate = () => {
    if (!deactivateTarget) return;
    deactivateOutlet(deactivateTarget.id);
    refresh();
    setDeactivateTarget(null);
    toast.success(`${deactivateTarget.name} deactivated.`);
  };

  const handleReactivate = (outlet: Outlet) => {
    reactivateOutlet(outlet.id);
    refresh();
    toast.success(`${outlet.name} reactivated.`);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteOutlet(deleteTarget.id);
    refresh();
    setDeleteTarget(null);
    toast.success("Test outlet deleted.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-semibold text-lg">
            Outlet Management
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeOutlets.length} active outlet
            {activeOutlets.length !== 1 ? "s" : ""}
            {deactivatedOutlets.length > 0
              ? `, ${deactivatedOutlets.length} deactivated`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            data-ocid="outlets.sort_toggle"
            onClick={() => setSortAZ((v) => !v)}
            className="gap-2"
          >
            {sortAZ ? (
              <ArrowDownAZ className="w-4 h-4" />
            ) : (
              <ArrowUpAZ className="w-4 h-4" />
            )}
            {sortAZ ? "A → Z" : "Z → A"}
          </Button>
          <Button
            data-ocid="outlets.add_button"
            onClick={() => setAddOpen(true)}
            className="gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Add Outlet
          </Button>
        </div>
      </div>

      {/* Active Outlets Table */}
      {activeOutlets.length === 0 ? (
        <div
          data-ocid="outlets.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center border rounded-lg"
        >
          <Store className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">No active outlets</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Add your first outlet to get started
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table data-ocid="outlets.table">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Code</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeOutlets.map((outlet, idx) => (
                <TableRow key={outlet.id} data-ocid={`outlets.item.${idx + 1}`}>
                  <TableCell className="font-medium">
                    <span>{outlet.name}</span>
                    {outlet.isTest && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-xs border-amber-400 text-amber-600 dark:text-amber-400"
                      >
                        Test
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {outlet.code}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-green-500 text-green-600 dark:text-green-400"
                    >
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`outlets.edit_button.${idx + 1}`}
                        onClick={() => openEdit(outlet)}
                        className="h-8 w-8 hover:bg-accent"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`outlets.secondary_button.${idx + 1}`}
                        onClick={() => setDeactivateTarget(outlet)}
                        className="h-8 w-8 hover:bg-orange-500/10 hover:text-orange-500"
                        title="Deactivate"
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                      </Button>
                      {outlet.isTest && (
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`outlets.delete_button.${idx + 1}`}
                          onClick={() => setDeleteTarget(outlet)}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          title="Delete (Test Outlet)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Deactivated Outlets Collapsible */}
      {deactivatedOutlets.length > 0 && (
        <Collapsible open={deactivatedOpen} onOpenChange={setDeactivatedOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              data-ocid="outlets.deactivated.toggle"
            >
              <span className="text-sm font-medium">
                Deactivated Outlets ({deactivatedOutlets.length})
              </span>
              {deactivatedOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border rounded-lg overflow-hidden mt-2">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deactivatedOutlets.map((outlet, idx) => (
                    <TableRow
                      key={outlet.id}
                      data-ocid={`outlets.deactivated.item.${idx + 1}`}
                      className="opacity-70"
                    >
                      <TableCell className="font-medium">
                        {outlet.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {outlet.code}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Deactivated</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-ocid={`outlets.deactivated.secondary_button.${idx + 1}`}
                          onClick={() => handleReactivate(outlet)}
                          className="gap-1.5 text-xs h-7 hover:bg-green-500/10 hover:text-green-600"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Reactivate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Add Outlet Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent data-ocid="outlets.add_modal" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add New Outlet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Outlet Name</Label>
              <Input
                data-ocid="outlets.add_modal.name_input"
                placeholder="e.g. Oho Shawarma Pune"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Outlet Code</Label>
              <Input
                data-ocid="outlets.add_modal.input"
                placeholder="e.g. PN031"
                value={addForm.code}
                onChange={(e) =>
                  setAddForm((p) => ({
                    ...p,
                    code: e.target.value.toUpperCase(),
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="outlets.add_modal.cancel_button"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="outlets.add_modal.submit_button"
              onClick={handleAdd}
            >
              Add Outlet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Outlet Modal */}
      <Dialog
        open={!!editOutlet}
        onOpenChange={(o) => !o && setEditOutlet(null)}
      >
        <DialogContent data-ocid="outlets.edit_modal" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Outlet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Outlet Name</Label>
              <Input
                data-ocid="outlets.edit_modal.name_input"
                placeholder="e.g. Oho Shawarma Pune"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Outlet Code</Label>
              <Input
                data-ocid="outlets.edit_modal.input"
                placeholder="e.g. PN031"
                value={editForm.code}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    code: e.target.value.toUpperCase(),
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="outlets.edit_modal.cancel_button"
              onClick={() => setEditOutlet(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="outlets.edit_modal.save_button"
              onClick={handleEdit}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirm */}
      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => !o && setDeactivateTarget(null)}
      >
        <AlertDialogContent data-ocid="outlets.deactivate_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Deactivate Outlet
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deactivate <strong>{deactivateTarget?.name}</strong>? It will be
              hidden from the active list and from auditors. You can reactivate
              it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="outlets.deactivate_dialog.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="outlets.deactivate_dialog.confirm_button"
              onClick={handleDeactivate}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm (Test Outlet only) */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="outlets.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Test Outlet
            </AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleteTarget?.name}</strong>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="outlets.delete_dialog.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="outlets.delete_dialog.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
