import React, {useCallback, useEffect, useState} from 'react';
import Quill from 'quill';
import {io} from 'socket.io-client'
import {useParams} from 'react-router-dom';
import 'quill/dist/quill.snow.css';



export default function TextEditor() {

    const [socket, setSocket] = useState();
    const [quill, setQuill] = useState();
    const {id: documentId} = useParams();

    const  SAVE_INTERVAL_MS = 2000;

    const wrapperRef = useCallback(wrapper => {
      if (wrapper == null) return;
      wrapper.innerHTML= "";
      const editor = document.createElement("div");    
      wrapper.append(editor);
      const q = new Quill(editor, {theme: "snow"});
      q.setText('loading...');
      q.disable();
      setQuill(q);
      },[]);

    useEffect(() => {
      const s = io("http://localhost:3001");
      //s.connect();
      s.on("connect", () => {
        // console.log("connected");
      });
      
      setSocket(s);
      return s.disconnect;

    }, []);

    
    useEffect(() => {
      if (quill == null || socket == null ) return;
      
      socket.once('load-document', documentId => {
        quill.setContents(documentId);
        quill.enable();
        // console.log(documentId);
      })
      socket.emit('get-document', documentId);
    }, [quill, socket, documentId])

    useEffect(() => {

      if (quill == null || socket == null) return;

      const handler = (delta, oldDelta , source) => {
        if (source !== 'user') return;
        socket.emit('send-changes', delta);
        //console.log(delta);
      };
      quill.on('text-change', handler)
      return () => {
        quill.off('text-change' , handler);
      }
    }, [socket, quill])

    useEffect(() => {

      if (quill == null || socket == null) return;

      const handler = (delta) => {
        //console.log(delta);
        quill.updateContents(delta)
      };
      socket.on('receive-changes', handler)
      return () => {
        socket.off('receive-changes' , handler);
      }
    }, [socket, quill])

    useEffect(() => {

      if (socket == null || quill == null) return;
      const interval = setInterval(()=> {
        socket.emit("save-document", quill.getContents())
      }, SAVE_INTERVAL_MS);
      return () => clearInterval(interval);
    }, [socket, quill])

  return <div className="container" ref={wrapperRef}></div>
}
