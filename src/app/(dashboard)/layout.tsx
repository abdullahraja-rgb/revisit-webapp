import Dashboard from "@/components/view/(dashboard)/Dashboard";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-dvh overflow-hidden">
      <Dashboard>{children}</Dashboard>
    </div>
  );
};

export default DashboardLayout;
