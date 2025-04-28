import { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import { FaTrash } from "react-icons/fa";

const Chat = ({ socket, username, room }) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const sendMessage = async () => {
    if (currentMessage.trim() !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      socket.emit("send_message", messageData); 
      setCurrentMessage(""); 
    }
  };

  const deleteMessage = async (messageId) => {
    socket.emit("delete_message", {
      messageId: messageId,
      author: username,
    });
  };

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      setMessageList((list) => [...list, data]);
    };

    const handlePreviousMessages = (data) => {
      setMessageList(data);
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessageList((list) =>
        list.map((msg) =>
          msg._id === messageId
            ? { ...msg, message: "This message was deleted.", deleted: true }
            : msg
        )
      );
    };

    const handleDeleteError = ({ error }) => {
      alert(error);
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("previous_messages", handlePreviousMessages);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("delete_error", handleDeleteError);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("previous_messages", handlePreviousMessages);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("delete_error", handleDeleteError);
    };
  }, [socket]);

  const canDelete = (msg) => {
    if (!msg.createdAt) return false;
    const createdAt = new Date(msg.createdAt);
    const now = new Date();
    return now - createdAt <= 5 * 60 * 1000; // 5 minutes
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <p>Live Chat</p>
      </div>
      <div className="chat-body">
        <ScrollToBottom className="message-container">
          {messageList.map((messageContent) => (
            <div
              key={messageContent._id || Math.random()}
              className="message"
              id={username === messageContent.author ? "you" : "other"}
            >
              <div className="message-inner">
                <div className="message-content">
                  <p>{messageContent.message}</p>
                </div>
                <div className="message-meta">
                  <p id="time">{messageContent.time}</p>
                  <p id="author">{messageContent.author}</p>
                </div>
                {username === messageContent.author && !messageContent.deleted && canDelete(messageContent) && (
                  <button
                    className="delete-button"
                    onClick={() => deleteMessage(messageContent._id)}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>
          ))}
        </ScrollToBottom>
      </div>

      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder="Hey..."
          onChange={(event) => setCurrentMessage(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>➤</button>
      </div>
    </div>
  );
};

export default Chat;
