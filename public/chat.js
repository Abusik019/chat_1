document.addEventListener('DOMContentLoaded', () => {
  const socket = io();
  const username = localStorage.getItem('username');

  if (!username) {
    window.location.href = '/register';
  }

  document.getElementById('username').textContent = `Logged in as: ${username}`;

  socket.on('newMessage', message => {
    const li = document.createElement('li');
    li.classList.add('message-item');

    li.textContent = `${message.username}: `;

    if (message.type === 'text') {
      li.textContent += message.message;
    } else if (message.type === 'file') {
      const a = document.createElement('a');
      a.href = message.url;
      a.textContent = 'Download file';
      a.target = '_blank';
      li.appendChild(a);
    } else if (message.type === 'video') {
      const videoWrapper = document.createElement('div');
      videoWrapper.classList.add('video-wrapper');

      const video = document.createElement('video');
      video.src = message.url;
      video.controls = false;
      video.autoplay = false;
      video.loop = true;
      video.classList.add('circle-video');

      videoWrapper.appendChild(video);
      li.appendChild(videoWrapper);

      videoWrapper.addEventListener('click', () => {
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      });
    }

    document.getElementById('messages').appendChild(li);
  });

  document.getElementById('message-form').addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    const type = 'text';

    if (message) {
      socket.emit('sendMessage', { message, username, type });
      input.value = '';
    }
  });

  document.getElementById('file-input').addEventListener('change', event => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', username);

    fetch('/upload', {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        console.log('File upload response:', data);
      })
      .catch(error => {
        console.error('File upload error:', error);
      });
  });

  let mediaRecorder;
  let recordedBlobs = [];
  let isRecording = false;
  const videoPreview = document.getElementById('video-preview');

  async function initializeMediaRecorder(stream) {
    try {
      return new MediaRecorder(stream);
    } catch (error) {
      console.error('MediaRecorder initialization error:', error);
      return null;
    }
  }

  document.getElementById('start-recording').addEventListener('click', async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        videoPreview.srcObject = stream;
        videoPreview.style.display = 'block'; 

        mediaRecorder = await initializeMediaRecorder(stream);
        if (!mediaRecorder) return;

        recordedBlobs = [];
        mediaRecorder.ondataavailable = event => {
          if (event.data && event.data.size > 0) {
            recordedBlobs.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(recordedBlobs, { type: 'video/webm' });
          const formData = new FormData();
          formData.append('file', blob);
          formData.append('username', username);

          try {
            const response = await fetch('/upload', {
              method: 'POST',
              body: formData
            });
            const data = await response.json();
            console.log('Video upload response:', data);
          } catch (error) {
            console.error('Video upload error:', error);
          }
        };

        mediaRecorder.start();
        isRecording = true;
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    }
  });

  document.getElementById('stop-recording').addEventListener('click', () => {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      const stream = videoPreview.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      videoPreview.srcObject = null;
      videoPreview.style.display = 'none';
      isRecording = false;
    }
  });
});
