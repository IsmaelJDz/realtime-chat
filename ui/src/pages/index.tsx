import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:3001";

const CONNECTION_COUNT_UPDATED_CHANNEL = "chat:connection-count-updated";
const NEW_MESSAGE_CHANNEL = "chat:new-message";

type Message = {
  id: string;
  message: string;
  createdAt: string;
  port: string;
};

function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketIo = io(SOCKET_URL, {
      reconnection: true,
      upgrade: true,
      transports: ["websocket", "polling"],
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  return socket;
}

export default function Home() {
  const socket = useSocket();
  const messageListRef = useRef<HTMLOListElement | null>(null);
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [newMessages, setNewMessages] = useState("");
  const [connectionCount, setConnectionCount] = useState(0);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!socket) {
      return;
    }

    socket.emit(NEW_MESSAGE_CHANNEL, {
      message: newMessages,
    });
    setNewMessages("");
  };

  function scrollToBottom() {
    if (!messageListRef.current) {
      return;
    }

    messageListRef.current.scrollTop =
      messageListRef.current.scrollHeight + 1000;
  }

  useEffect(() => {
    socket?.on("connect", () => {
      console.log("connected to socket");
    });

    socket?.on(NEW_MESSAGE_CHANNEL, (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);

      setTimeout(() => {
        scrollToBottom();
      }, 0);
    });

    socket?.on(
      CONNECTION_COUNT_UPDATED_CHANNEL,
      ({ count }: { count: number }) => {
        setConnectionCount(count);
      }
    );
  }, [socket]);

  return (
    <main className="flex flex-col w-full max-w-3xl p-4 m-auto">
      <h1 className="mb-4 text-4xl font-bold text-center">
        Chat ({connectionCount})
      </h1>
      <ol
        className="flex-1 overflow-x-hidden overflow-y-scroll"
        ref={messageListRef}
      >
        {messages.map((m) => {
          return (
            <li
              className="p-4 my-2 break-all bg-gray-100 rounded-lg"
              key={m.id}
            >
              <p className="text-gray-500 text-small">{m.createdAt}</p>
              <p className="text-gray-500 text-small">{m.port}</p>
              <p>{m.message}</p>
            </li>
          );
        })}
      </ol>

      <form onSubmit={handleSubmit} className="flex items-center">
        <Textarea
          className="mr-4 rounded-lg"
          placeholder="Tell is what's on your mind"
          value={newMessages}
          onChange={({ target }) => setNewMessages(target.value)}
          maxLength={255}
        />
        <Button className="h-full">Send message</Button>
      </form>
    </main>
  );
}
