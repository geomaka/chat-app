
import './App.css';
import io from 'socket.io-client'
import {useState} from 'react'
import Chat from './Chat';

const socket = io.connect('http://localhost:3001')

function App() {
const [userName,setUserName] = useState('')
const [room,setRoom] = useState('')
const [showChat,setShowChat] = useState(false)

const joinRoom = () =>{
  if(userName !== "" && room !== "" ){
    socket.emit('join_room',room)
    setShowChat(true)
  }
}

  return (
    <div className="App">
       {!showChat ? (
      <div className="joinChatContainer">
      <h3>join chats</h3>
      <input type="text" placeholder="john..." onChange={(event) =>{setUserName(event.target.value)}} />
      <input type="text" placeholder="room id ..." onChange = {(event) =>{ setRoom(event.target.value)}}/>
      <button onClick={joinRoom}>join a room</button>
      </div>
       ) :(

      <Chat socket={socket} username={userName} room={room} />
      )}
     
    </div>
     
  );
}

export default App;
