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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type User,
  createUser,
  deactivateUser,
  deleteUser,
  getAllUsers,
  getSession,
  reactivateUser,
  resetUserPassword,
  updateUser,
} from "@/lib/store";
import {
  KeyRound,
  Pencil,
  PowerOff,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(() => getAllUsers());
  const session = getSession();

  const refresh = () => setUsers(getAllUsers());

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "auditor" as "admin" | "auditor",
  });

  // Edit modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "auditor" as "admin" | "auditor",
  });

  // Reset password modal
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  // Deactivate confirm
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);

  const handleAdd = () => {
    if (!addForm.name || !addForm.email || !addForm.password) {
      toast.error("Please fill in all fields.");
      return;
    }
    createUser(addForm);
    refresh();
    setAddOpen(false);
    setAddForm({ name: "", email: "", password: "", role: "auditor" });
    toast.success("User created successfully.");
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  };

  const handleEdit = () => {
    if (!editUser) return;
    updateUser(editUser.id, editForm);
    refresh();
    setEditUser(null);
    toast.success("User updated successfully.");
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser(deleteTarget.id);
    refresh();
    setDeleteTarget(null);
    toast.success("User deleted.");
  };

  const handleDeactivate = () => {
    if (!deactivateTarget) return;
    deactivateUser(deactivateTarget.id);
    refresh();
    setDeactivateTarget(null);
    toast.success(`${deactivateTarget.name} deactivated.`);
  };

  const handleReactivate = (user: User) => {
    reactivateUser(user.id);
    refresh();
    toast.success(`${user.name} reactivated.`);
  };

  const handleReset = () => {
    if (!resetUser) return;
    if (resetPw !== resetConfirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (resetPw.length < 4) {
      toast.error("Password must be at least 4 characters.");
      return;
    }
    resetUserPassword(resetUser.id, resetPw);
    setResetUser(null);
    setResetPw("");
    setResetConfirm("");
    toast.success("Password reset successfully.");
  };

  const activeUsers = users.filter((u) => u.status === "active");
  const deactivatedUsers = users.filter((u) => u.status === "deactivated");

  const renderRoleBadge = (role: string) => (
    <Badge
      className={`capitalize ${role === "admin" ? "badge-brand" : ""}`}
      variant={role === "admin" ? "default" : "secondary"}
    >
      {role}
    </Badge>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-lg">
            User Management
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeUsers.length} active user
            {activeUsers.length !== 1 ? "s" : ""}
            {deactivatedUsers.length > 0
              ? `, ${deactivatedUsers.length} deactivated`
              : ""}
          </p>
        </div>
        <Button
          data-ocid="users.add_button"
          onClick={() => setAddOpen(true)}
          className="gap-2 btn-brand"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {users.length === 0 ? (
        <div
          data-ocid="users.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Users className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">No users found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Create the first user to get started
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table data-ocid="users.table">
            <TableHeader>
              <TableRow className="bg-muted/40 tr-brand-header">
                <TableHead className="font-semibold th-brand">Name</TableHead>
                <TableHead className="font-semibold th-brand">Email</TableHead>
                <TableHead className="font-semibold th-brand">Role</TableHead>
                <TableHead className="font-semibold th-brand">Status</TableHead>
                <TableHead className="font-semibold text-right th-brand">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, idx) => (
                <TableRow
                  key={user.id}
                  data-ocid={`users.item.${idx + 1}`}
                  className={user.status === "deactivated" ? "opacity-60" : ""}
                >
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>{renderRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {user.status === "deactivated" ? (
                      <Badge variant="secondary" className="text-xs">
                        Deactivated
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs border-green-500 text-green-600 dark:text-green-400"
                      >
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`users.edit_button.${idx + 1}`}
                        onClick={() => openEdit(user)}
                        className="h-8 w-8 hover:bg-accent"
                        title="Edit"
                      >
                        <Pencil
                          className="w-3.5 h-3.5 icon-brand"
                          data-light-icon="pencil"
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-ocid={`users.secondary_button.${idx + 1}`}
                        onClick={() => {
                          setResetUser(user);
                          setResetPw("");
                          setResetConfirm("");
                        }}
                        className="h-8 w-8 hover:bg-accent"
                        title="Reset Password"
                      >
                        <KeyRound
                          className="w-3.5 h-3.5 icon-brand"
                          data-light-icon="key"
                        />
                      </Button>
                      {user.id !== session?.userId && (
                        <>
                          {user.status === "active" ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              data-ocid={`users.toggle.${idx + 1}`}
                              onClick={() => setDeactivateTarget(user)}
                              className="h-8 w-8 hover:bg-orange-500/10 hover:text-orange-500"
                              title="Deactivate"
                            >
                              <PowerOff
                                className="w-3.5 h-3.5 icon-brand"
                                data-light-icon="deactivate"
                              />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              data-ocid={`users.toggle.${idx + 1}`}
                              onClick={() => handleReactivate(user)}
                              className="h-8 w-8 hover:bg-green-500/10 hover:text-green-500"
                              title="Reactivate"
                            >
                              <RefreshCw className="w-3.5 h-3.5 icon-brand" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`users.delete_button.${idx + 1}`}
                            onClick={() => setDeleteTarget(user)}
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2
                              className="w-3.5 h-3.5 icon-brand"
                              data-light-icon="trash"
                            />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add User Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent data-ocid="users.add_modal" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                data-ocid="users.add_modal.name_input"
                placeholder="Full name"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input
                data-ocid="users.add_modal.input"
                type="email"
                placeholder="user@example.com"
                value={addForm.email}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                data-ocid="users.add_modal.password_input"
                type="password"
                placeholder="Set a password"
                value={addForm.password}
                onChange={(e) =>
                  setAddForm((p) => ({ ...p, password: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={addForm.role}
                onValueChange={(v) =>
                  setAddForm((p) => ({ ...p, role: v as "admin" | "auditor" }))
                }
              >
                <SelectTrigger data-ocid="users.add_modal.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auditor">Auditor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="users.add_modal.cancel_button"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="users.add_modal.submit_button"
              className="btn-brand"
              onClick={handleAdd}
            >
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent data-ocid="users.edit_modal" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                data-ocid="users.edit_modal.name_input"
                placeholder="Full name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input
                data-ocid="users.edit_modal.input"
                type="email"
                placeholder="user@example.com"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) =>
                  setEditForm((p) => ({ ...p, role: v as "admin" | "auditor" }))
                }
              >
                <SelectTrigger data-ocid="users.edit_modal.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auditor">Auditor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="users.edit_modal.cancel_button"
              onClick={() => setEditUser(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="users.edit_modal.save_button"
              className="btn-brand"
              onClick={handleEdit}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
        <DialogContent data-ocid="users.reset_modal" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Reset Password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Reset password for{" "}
            <span className="font-medium text-foreground">
              {resetUser?.name}
            </span>
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input
                data-ocid="users.reset_modal.password_input"
                type="password"
                placeholder="New password"
                value={resetPw}
                onChange={(e) => setResetPw(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input
                data-ocid="users.reset_modal.input"
                type="password"
                placeholder="Confirm new password"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="users.reset_modal.cancel_button"
              onClick={() => setResetUser(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="users.reset_modal.submit_button"
              className="btn-brand"
              onClick={handleReset}
            >
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirm */}
      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(o) => !o && setDeactivateTarget(null)}
      >
        <AlertDialogContent data-ocid="users.deactivate_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Deactivate User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deactivate <strong>{deactivateTarget?.name}</strong>? They won't
              be able to log in. You can reactivate them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="users.deactivate_dialog.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="users.deactivate_dialog.confirm_button"
              onClick={handleDeactivate}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="users.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleteTarget?.name}</strong>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="users.delete_dialog.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="users.delete_dialog.confirm_button"
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
