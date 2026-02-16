import { ChatRoomClient } from "./ChatRoomClient";

// used to show all the existing chats in the room
export async function ChatRoom({roomId} : {
    roomId: string
}) {
  return <ChatRoomClient roomId={roomId} messages={[]} />;
}
