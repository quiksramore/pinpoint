import { Map } from "lucide-react";
import { useRouter } from "next/dist/client/components/navigation";

export default function SendToMapButton({ postLocationData }: { postLocationData: any }) {
  const router = useRouter();

  return (
    <Map
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        const [lng, lat] = postLocationData.coordinates;
        router.push(`/map?lng=${lng}&lat=${lat}`);
      }}
    />
  );
}
