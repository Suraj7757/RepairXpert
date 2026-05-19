import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  Users,
  Shield,
  Mail,
  Phone,
  Trash2,
  Edit2,
  CheckCircle2,
  Briefcase,
  IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase";

export default function StaffManagement() {
  const { user } = useAuth();
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phone: "",
    role: "technician",
    salary_type: "fixed",
    fixed_salary: 0,
    commission_percent: 0,
  });

  const fetchStaff = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("staff_members")
      .select("*")
      .eq("shop_user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load staff members");
    } else {
      setStaffMembers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, [user]);

  const resetForm = () => {
    setNewStaff({
      name: "",
      email: "",
      phone: "",
      role: "technician",
      salary_type: "fixed",
      fixed_salary: 0,
      commission_percent: 0,
    });
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (staff: any) => {
    setNewStaff({
      name: staff.name,
      email: staff.email || "",
      phone: staff.phone || "",
      role: staff.role,
      salary_type: staff.salary_type,
      fixed_salary: staff.fixed_salary,
      commission_percent: staff.commission_percent,
    });
    setEditingId(staff.id);
    setIsAddOpen(true);
  };

  const handleSaveStaff = async () => {
    if (!newStaff.name) {
      toast.error("Name is required");
      return;
    }
    if (!user) return;

    setIsSubmitting(true);
    try {
      const payload = {
        shop_user_id: user.id,
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role,
        salary_type: newStaff.salary_type,
        fixed_salary: Number(newStaff.fixed_salary),
        commission_percent: Number(newStaff.commission_percent),
      };

      if (editingId) {
        const { error } = await supabase
          .from("staff_members")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Staff updated successfully");
      } else {
        const { error } = await supabase
          .from("staff_members")
          .insert([payload]);
        if (error) throw error;
        toast.success("Staff added successfully");
      }

      setIsAddOpen(false);
      resetForm();
      fetchStaff();
    } catch (error: any) {
      toast.error(error.message || "Failed to save staff");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const { error } = await supabase
        .from("staff_members")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Staff member removed");
      fetchStaff();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete staff");
    }
  };

  const activeStaff = staffMembers.filter(s => s.is_active).length;

  return (
    <MainLayout title="Staff Management">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" /> Team Management
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">
              Manage your shop's technicians, receptionists, and salaries.
            </p>
          </div>
          <Button
            onClick={handleOpenAdd}
            className="rounded-xl font-bold px-6 shadow-lg shadow-primary/20 gap-2 h-12"
          >
            <UserPlus className="h-4 w-4" /> Add Staff Member
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-primary/5 border-primary/10 shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Total Staff
                  </p>
                  <p className="text-3xl font-black text-foreground">
                    {staffMembers.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/5 border-emerald-500/10 shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Active Now
                  </p>
                  <p className="text-3xl font-black text-foreground">{activeStaff}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/5 border-blue-500/10 shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Technicians
                  </p>
                  <p className="text-3xl font-black text-foreground">
                    {staffMembers.filter(s => s.role === 'technician').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-xl ring-1 ring-white/5 overflow-hidden border-0">
          <CardHeader className="bg-card/50 border-b pb-4">
            <CardTitle className="text-xl font-black tracking-tight">
              Staff Directory
            </CardTitle>
            <CardDescription>
              View and manage all members with access to this shop.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold">Staff Member</TableHead>
                    <TableHead className="font-bold">Contact</TableHead>
                    <TableHead className="font-bold">Role & Type</TableHead>
                    <TableHead className="font-bold">Compensation</TableHead>
                    <TableHead className="font-bold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : staffMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Users className="h-12 w-12 opacity-20 mb-4" />
                          <p className="font-medium">No staff members found.</p>
                          <Button
                            variant="link"
                            onClick={handleOpenAdd}
                          >
                            Add your first technician
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    staffMembers.map((member: any, i: number) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center font-bold text-primary-foreground shadow-md">
                              {member.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">
                                {member.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Joined: {new Date(member.joined_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {member.email && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" /> <span>{member.email}</span>
                              </div>
                            )}
                            {member.phone && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" /> <span>{member.phone}</span>
                              </div>
                            )}
                            {!member.email && !member.phone && <span className="text-xs text-muted-foreground italic">No contact info</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            <Badge
                              className={`rounded-lg px-2 py-0.5 font-bold uppercase text-[10px] ${member.role === "manager" ? "bg-primary/20 text-primary border-primary/20" : "bg-muted text-muted-foreground"}`}
                            >
                              {member.role}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] uppercase font-bold text-muted-foreground border-muted-foreground/30">
                              {member.salary_type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm">
                            {member.salary_type === "fixed" ? (
                              <span className="flex items-center"><IndianRupee className="h-3 w-3 mr-0.5"/> {member.fixed_salary}/mo</span>
                            ) : (
                              <span>{member.commission_percent}% per job</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary"
                              onClick={() => handleOpenEdit(member)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
            <div className="gradient-primary p-6 text-center">
              <UserPlus className="h-10 w-10 text-primary-foreground/20 mx-auto mb-2" />
              <DialogTitle className="text-2xl font-black text-primary-foreground tracking-tight">
                {editingId ? "Edit Staff Member" : "Add Staff Member"}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/70 font-medium">
                {editingId ? "Update staff details and compensation." : "Create a new staff profile to assign jobs."}
              </DialogDescription>
            </div>
            <div className="p-6 space-y-4 bg-card max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Full Name *
                </Label>
                <Input
                  placeholder="e.g. Rahul Sharma"
                  className="rounded-xl border-2 focus-visible:ring-primary h-12"
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Mobile
                  </Label>
                  <Input
                    placeholder="Mobile number"
                    className="rounded-xl border-2 focus-visible:ring-primary h-12"
                    value={newStaff.phone}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="Optional email"
                    className="rounded-xl border-2 focus-visible:ring-primary h-12"
                    value={newStaff.email}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, email: e.target.value })
                    }
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Role
                </Label>
                <Select
                  value={newStaff.role}
                  onValueChange={(v) => setNewStaff({ ...newStaff, role: v })}
                >
                  <SelectTrigger className="rounded-xl border-2 h-12">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="technician">Technician (Repairs jobs)</SelectItem>
                    <SelectItem value="receptionist">Receptionist (Front desk)</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Salary Type
                </Label>
                <Select
                  value={newStaff.salary_type}
                  onValueChange={(v) => setNewStaff({ ...newStaff, salary_type: v })}
                >
                  <SelectTrigger className="rounded-xl border-2 h-12">
                    <SelectValue placeholder="Salary Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="fixed">Fixed Monthly Salary</SelectItem>
                    <SelectItem value="commission">Commission Based (per job)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStaff.salary_type === "fixed" ? (
                <div className="space-y-2 animate-fade-in">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Monthly Salary (₹)
                  </Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="e.g. 15000"
                      className="rounded-xl border-2 pl-9 focus-visible:ring-primary h-12"
                      value={newStaff.fixed_salary}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, fixed_salary: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 animate-fade-in">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Commission (%) per job
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="e.g. 40"
                      className="rounded-xl border-2 pr-9 focus-visible:ring-primary h-12"
                      value={newStaff.commission_percent}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, commission_percent: Number(e.target.value) })
                      }
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">%</span>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-12 font-bold"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl h-12 font-black shadow-lg shadow-primary/20"
                  onClick={handleSaveStaff}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : editingId ? "Update Staff" : "Add Staff"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
