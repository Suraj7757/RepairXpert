import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-black tracking-tight">Privacy Policy</h1>
        <Card>
          <CardContent className="p-8 space-y-6 text-muted-foreground leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">
                1. Data Collection
              </h2>
              <p>
                We collect information you provide directly to us when you
                create an account, such as your name, email address, and
                business details. We also collect data about your customers and
                repair jobs to provide our CRM services.
              </p>
            </section>
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">
                2. Use of Information
              </h2>
              <p>
                We use the information we collect to operate, maintain, and
                provide the features of the RepairXpert CRM. This includes tracking
                repair jobs, managing inventory, and generating invoices.
              </p>
            </section>
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">
                3. Data Security
              </h2>
              <p>
                We use industry-standard security measures to protect your data.
                Your database is hosted on Supabase with restricted access
                controls. However, no method of transmission over the internet
                is 100% secure.
              </p>
            </section>
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">
                4. Third-Party Services
              </h2>
              <p>
                We use Supabase for database and authentication. Payments are
                processed via UPI or manual verification. We do not sell your
                data to third parties.
              </p>
            </section>
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">
                5. Changes to Policy
              </h2>
              <p>
                We may update this policy from time to time. We will notify you
                of any changes by posting the new policy on this page.
              </p>
            </section>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground italic">
          Last Updated: April 24, 2026
        </p>
      </div>
    </div>
  );
}
