"use client";
import styles from "./page.module.css";
import io from "socket.io-client"; // Import 'io' as the default import
import { useState } from "react";
import React, { useEffect } from "react";
import ChatPage from "@/components/page";

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const [userName, setUserName] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);
  const [roomId, setroomId] = useState("");
  const [warningMsg, setWarningMsg] = useState("");
  
  var socket = io('https://haramchr.com', {secure: true});
  
  useEffect(() => {
    socket.on("is_duplicated_id", (data: any) => {
      if (data.is_duplicated) {
        setWarningMsg(data.id + " is already used. Please use another name.");
        console.log(data.is_duplicated, warningMsg);
      }else{
        setWarningMsg("");
        console.log(data.is_duplicated, warningMsg);
      }
    });
  }, [socket]);

  const checkId = (id: string) => {
    setUserName(id);
    socket.emit("check_id", id);
  };

  const handleJoin = () => {
    if (userName !== "" && roomId !== "") {
      console.log(userName, "userName", roomId, "roomId");
      socket.emit("join_room", {name: userName, room: roomId});
      setShowSpinner(true);
// You can remove this setTimeout and add your own logic
      setTimeout(() => {
        setShowChat(true);
        setShowSpinner(false);
      }, 250);
    } else {
      alert("Please fill in Username and Room Id");
    }
  };

  return (
    <div>
      <div
        className={styles.main_div}
        style={{ display: showChat ? "none" : "" }}
      >
        <div style={{ color: "red" }}>{warningMsg}</div>
        <input
          className={styles.main_input}
          type="text"
          placeholder="Username"
          onChange={(e) => checkId(e.target.value)}
          disabled={showSpinner}
        />

        <input
          className={styles.main_input}
          type="text"
          placeholder="Group"
          onChange={(e) => setroomId(e.target.value)}
          disabled={showSpinner}
        />
        <button className={styles.main_button} onClick={() => handleJoin()}>
          {!showSpinner ? (
            "Join"
          ) : (
            <div className={styles.loading_spinner}></div>
          )}
        </button>
      </div>
      <div style={{ display: !showChat ? "none" : "" }}>
        <ChatPage socket={socket} roomId={roomId} username={userName} />
      </div>
    </div>
  );
}