import BackgroundMusic from "@/components/utils/background";
import GameCursor from "@/components/utils/GameCursor";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BackgroundMusic src="/sound/sentinel.mp3"  volume={0.5}/>
      <GameCursor size={40} trail sound />
      {children}
    </>
  );
}