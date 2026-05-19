import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndianRupee, Wallet, CalendarDays, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/services/supabase";

export default function StaffEarnings() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  
  const [payData, setPayData] = useState({
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0],
    amount: "",
    deductions: "0",
    method: "cash",
    notes: ""
  });

  const fetchStaffEarnings = async () => {
    if (!user) return;
    setLoading(true);
    // Fetch staff
    const { data: staffData } = await supabase
      .from("staff_members")
      .select("*")
      .eq("shop_user_id", user.id);
      
    // Ideally we would join staff_job_assignments and calculate commissions
    // For now, we'll just display staff and let shopkeeper pay them manually
    setStaff(staffData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStaffEarnings();
  }, [user]);

  const handleOpenPay = (member: any) => {
    setSelectedStaff(member);
    setPayData({
      ...payData,
      amount: member.salary_type === 'fixed' ? String(member.fixed_salary) : "0"
    });
    setPayOpen(true);
  };

  const handlePaySalary = async () => {
    if (!selectedStaff || !user) return;
    
    try {
      const gross = Number(payData.amount);
      const ded = Number(payData.deductions);
      const net = gross - ded;
      
      const { error } = await supabase.from('staff_salary_records').insert({
        shop_user_id: user.id,
        staff_member_id: selectedStaff.id,
        period_start: payData.periodStart,
        period_end: payData.periodEnd,
        gross_earnings: gross,
        deductions: ded,
        net_salary: net,
        payment_method: payData.method,
        notes: payData.notes,
        paid_at: new Date().toISOString()
      });
      
      if (error) throw error;
      toast.success(`Salary of ₹${net} recorded for ${selectedStaff.name}`);
      setPayOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to record payment");
    }
  };

  return (
    <MainLayout title="Staff Earnings">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2"><Wallet className="text-primary"/> Staff Salary & Earnings</h1>
          <p className="text-muted-foreground mt-1">Manage payouts, track commissions, and record salaries.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Staff Payouts</CardTitle>
            <CardDescription>Select a staff member to record a salary payment.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Salary Type</TableHead>
                  <TableHead>Base/Comm.</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow> : 
                 staff.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center">No staff found.</TableCell></TableRow> :
                 staff.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-bold">{s.name}</TableCell>
                    <TableCell className="uppercase text-xs font-semibold text-muted-foreground">{s.role}</TableCell>
                    <TableCell className="uppercase text-xs font-semibold text-muted-foreground">{s.salary_type}</TableCell>
                    <TableCell>
                      {s.salary_type === 'fixed' ? `₹${s.fixed_salary}/mo` : `${s.commission_percent}%/job`}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleOpenPay(s)}>Record Pay</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pay Dialog */}
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment for {selectedStaff?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Period Start</Label>
                  <Input type="date" value={payData.periodStart} onChange={e => setPayData({...payData, periodStart: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Period End</Label>
                  <Input type="date" value={payData.periodEnd} onChange={e => setPayData({...payData, periodEnd: e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Gross Amount (₹)</Label>
                <Input type="number" value={payData.amount} onChange={e => setPayData({...payData, amount: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Deductions/Advance (₹)</Label>
                <Input type="number" value={payData.deductions} onChange={e => setPayData({...payData, deductions: e.target.value})} />
              </div>
              
              <div className="p-3 bg-muted rounded-lg flex justify-between items-center font-bold">
                <span>Net Payable:</span>
                <span className="text-xl text-primary">₹{(Number(payData.amount) - Number(payData.deductions)) || 0}</span>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={payData.method} onValueChange={v => setPayData({...payData, method: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI / Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
              <Button onClick={handlePaySalary}>Mark as Paid</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
