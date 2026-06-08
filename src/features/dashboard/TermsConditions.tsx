import { Card, CardContent } from "@/components/ui/card";

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-black tracking-tight">
          Terms & Conditions
        </h1>
        <Card>
          <CardContent className="p-8 space-y-6 text-muted-foreground leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing and using RepairXpert, you agree to comply with and be
                bound by these Terms and Conditions.
              </p>
            </section>
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">
                2. Subscription & Payments
              </h2>
              <p>
                Subscription plans are billed monthly, quarterly, or annually.
                Payments are non-refundable unless specified otherwise. Failure
                to pay will result in account suspension.
              </p>
            </section>
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">
                3. User Responsibilities
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your
                account keys and for all activities that occur under your
                account. You agree not to use the service for any illegal
                purposes.
              </p>
            </section>
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">
                4. Service Availability
              </h2>
              <p>
                We strive to maintain 99.9% uptime, but we do not guarantee
                uninterrupted service. Maintenance may be performed with or
                without prior notice.
              </p>
            </section>
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">
                5. Termination
              </h2>
              <p>
                We reserve the right to terminate or suspend access to our
                service immediately, without prior notice or liability, for any
                reason whatsoever, including breach of terms.
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
