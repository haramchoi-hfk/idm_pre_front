"use client"
import React, { useEffect, useState } from "react";
import style from "./chat.module.css";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import audio from "./audio_list";

interface IMsgDataTypes {
  roomId: String | number;
  user: String;
  msg: String;
  time: String;
}
interface Group {
  name: String;
  category: String;
  users: [];
};
const AUDIO_PER_CATEGORY = 4;
const playlist = audio.map((audioItem) => audioItem.audios.map((audio) => [audio.src, audio.name])).flat();

//---------------------------------------------------------
const ChatPage = ({ socket, username, roomId }: any) => {
  const [members, setMembers] = useState([]);
  const [category, setCategory] = useState("-1");
  const [currentTrack, setTrackIndex] = React.useState(AUDIO_PER_CATEGORY + 1)
  const [occupied, setOccupied] = useState([0, 0, 0, 0]);
  //---------------------------------------------------------
  const refreshMembers = async () => {
    await socket.emit("refresh_members", roomId);
  };
  //---------------------------------------------------------
  useEffect(() => {
    socket.on("new_member", (users: []) => {
      setMembers(users);
    });
    socket.on("refresh_members", (users: []) => {
      setMembers(users);
    });

    refreshMembers();

    socket.on("refresh_all_members", (users: Group[]) => {
      console.log("refresh_all_members");
      users.map((group) => {
        if (group.name == roomId) {
          setMembers(group.users);
        }
      });
    });
    socket.on("select_category", (data: any) => {
      console.log("got_response_select_category", data);
      if(data.room == roomId){
        setCategory(data.category);
      }
      setOccupied(data.occupied);
    });

  }, [socket]);
  //---------------------------------------------------------
  const PlayerApp = () => {
    const handleClickNext = () => {
      console.log('click next')
      setTrackIndex((currentTrack) =>
        currentTrack < playlist.length - 1 ? currentTrack + 1 : 0
      );
    };

    const handleEnd = () => {
      console.log('end')
      setTrackIndex((currentTrack) =>
        currentTrack < playlist.length - 1 ? currentTrack + 1 : 0
      );
    }
    //---------------------------------------------------------
    return (
      <div className="container">
        <AudioPlayer
          // volume="1.0"
          loop={true}
          src={playlist[currentTrack][0]}
          showSkipControls
          showJumpControls={false}
          onClickNext={handleClickNext}
          onEnded={handleEnd}
        />
        <p>
          {playlist[currentTrack][1]}
        </p>
      </div>
    );
  }
  //---------------------------------------------------------
  const handleSelectTrack = (index: number) => {
    setTrackIndex(index);
  }
  //---------------------------------------------------------
  const handleSelectCategory = async (category: string) => {
    setCategory(category);
    var oc = occupied.flat();
    oc[parseInt(category)] = 1;
    setOccupied(oc);
    console.log("send_request_select_category", { name: username, room: roomId, category: category, occupied: oc });
    await socket.emit("select_category", {category:category, room: roomId, occupied: oc });
  }
  //---------------------------------------------------------
  return (
    <><div className={style.chat_div}>
      <div className={style.chat_border}>
        <div style={{ marginBottom: "1rem" }}>
          <p>
            Group: <b>{roomId}</b>
          </p>
        </div>
        <div>
          <p>Members:</p>
          {members.map((member, key) => (
            <p key={key}> {(username == member ? member + " <-me" : member)}</p>
          ))}
        </div>
      </div>
    </div>
      <div className={style.player_div}>
        <div className={style.player_border}>
          <div >
            {PlayerApp()}
          </div>
        </div>
      </div>
      <div className={style.audio_list_div}>
        <div className={style.audio_list_border}>
          <div>
            {
              category != "-1" ?( // if my group has selected a category
                audio.map((audioset, index) => (
                  parseInt(category) == index ? ( // draw the category that my group has selected
                    <div key={index}>
                      <p><b>{audioset.category}</b></p>
                      {audioset.audios.map((audioItem, audioIndex) => (
                        <div key={audioIndex}>
                          <button className={style.main_button} onClick={() => handleSelectTrack(index * AUDIO_PER_CATEGORY + audioIndex)}>
                            {audioItem.name}
                          </button>
                        </div>
                      ))}
                      <button className={style.category_button} disabled>
                        disabled
                      </button>
                    </div>
                  ):( // draw the category that my group has not selected
                    <div key={index}>
                      <p><b>{audioset.category}</b></p>
                      {audioset.audios.map((audioItem, audioIndex) => (
                        <div key={audioIndex}>
                          <button className={style.main_button} disabled>
                            disabled
                          </button>
                        </div>
                      ))}
                      <button className={style.category_button} disabled>
                      disabled
                      </button>
                    </div>
                  )
                ))

              ):( // if my group has not selected a category, check if occupied by another group
              audio.map((audioset, index) => (
                occupied[index] == 0 ? ( // if not selected by another group, leave it selectable
                  <div key={index}>
                    <p><b>{audioset.category}</b></p>
                    {audioset.audios.map((audioItem, audioIndex) => (
                      <div key={audioIndex}>
                        <button className={style.main_button} onClick={() => handleSelectTrack(index * AUDIO_PER_CATEGORY + audioIndex)}>
                          {audioItem.name}
                        </button>
                      </div>
                    ))}
                    <button className={style.category_button} onClick={() => handleSelectCategory(audioset.category[0])}>
                      Select Category
                    </button>
                  </div>
                ):( // if selected by another group, disable it
                  <div key={index}>
                    <p><b>{audioset.category}</b></p>
                    {audioset.audios.map((audioItem, audioIndex) => (
                      <div key={audioIndex}>
                        <button className={style.main_button} disabled>
                          disabled
                        </button>
                      </div>
                    ))}
                    <button className={style.category_button} disabled>
                      disabled
                    </button>
                  </div>
                )
              ))
              )
            }
            {/* {audio.map((audioset, index) => (
                <div key={index}>
                <p><b>{audioset.category}</b></p>
                {audioset.audios.map((audioItem, audioIndex) => (
                  <div key={audioIndex}>
                    <button className={style.main_button} onClick={() => handleSelectTrack(index * AUDIO_PER_CATEGORY + audioIndex)}>
                      {audioItem.name}
                    </button>
                  </div>
                ))}
                <button className={style.category_button} onClick={() => handleSelectCategory(audioset.category[0])} disabled>
                  Select Category
                </button>
              </div>
            ))} */}
          </div>
        </div>
      </div>

    </>
  );
};

export default ChatPage;