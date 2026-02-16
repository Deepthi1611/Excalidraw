import axios from "axios"
import { backend_url } from "../app/config";
import { ChatRoomClient } from "./ChatRoomClient";

async function getChats(roomId: string) {
    // fetch chats for the room from the backend using roomId
    // return the chats
    const response = await axios.get(`${backend_url}/chats/${roomId}`);
    console.log("Fetched chats:", response.data);
    return response.data;
} 

// used to show all the existing chats in the room
export async function ChatRoom({roomId} : {
    roomId: string
}) {
  const messages = await getChats(roomId);
  console.log("Initial messages in chat room component", messages);
  return <ChatRoomClient roomId={roomId} messages={messages} />;
}
