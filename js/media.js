export class MediaRecorderHelper {
  constructor() {
    this.stream = null;
    this.recorder = null;
    this.chunks = [];
  }

  async startRecording(type = 'audio') {
    const constraints = type === 'video' 
      ? { video: true, audio: true }
      : { audio: true };
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      const mimeType = type === 'video' ? 'video/webm' : 'audio/webm';
      this.recorder = new MediaRecorder(this.stream, { mimeType });
      this.chunks = [];
      
      this.recorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };
      
      this.recorder.start();
      return true;
    } catch (error) {
      console.error('Ошибка записи:', error);
      return false;
    }
  }

  stopRecording() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
      this.stream.getTracks().forEach(track => track.stop());
    }
    return new Blob(this.chunks, { type: this.chunks[0]?.type || 'audio/webm' });
  }

  createPlayer(blob, type = 'audio') {
    const url = URL.createObjectURL(blob);
    const player = document.createElement(type);
    player.src = url;
    player.controls = true;
    player.className = 'media-player';
    return player;
  }
}
