import axios from "axios";
import { notFound } from "next/navigation";
import { backend_url } from "../../config";
import { ChatRoom } from "../../../components/ChatRoom";

async function getRoom(slug: string) {
  const response = await axios.get(`${backend_url}/room/${slug}`);
  return response.data.id as string;
}

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const roomId = await getRoom(slug);
    return <ChatRoom roomId={roomId} />
  } catch {
    notFound();
  }
}