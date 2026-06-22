import BackgroundMusic from "@/components/utils/background";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BackgroundMusic src="/sound/sentinel.mp3"  volume={0.5}/>
      {children}
    </>
  );
}