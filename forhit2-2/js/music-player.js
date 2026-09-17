import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const playBtn = document.getElementById('btn-play-pause');
const nextBtn = document.getElementById('btn-next-track');
const volumeSlider = document.getElementById('volume-slider');
const trackTitle = document.getElementById('player-track-title');

let playlist = [];
let currentIndex = 0;
let ytPlayer = null;
let htmlAudio = new Audio();
let isYouTube = false;
let isYtReady = false;

// 1. โหลด YouTube Iframe API แบบ Dynamic
if (!window.YT) {
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('youtube-hidden-player', {
    height: '1',
    width: '1',
    playerVars: { 
      'playsinline': 1,
      'controls': 0,
      'disablekb': 1
    },
    events: {
      'onReady': (e) => {
        isYtReady = true;
        initMusicPlayer();
      },
      'onStateChange': onPlayerStateChange
    }
  });
};

function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

async function initMusicPlayer() {
  try {
    const q = query(collection(db, "music"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      if (trackTitle) trackTitle.innerText = "ไม่มีเพลงในระบบ";
      return;
    }

    playlist = snapshot.docs.map(doc => doc.data());
    htmlAudio.volume = parseFloat(volumeSlider.value);

    loadTrack(0);
  } catch (error) {
    console.error("Media Player Error:", error);
    if (trackTitle) trackTitle.innerText = "โหลดไฟล์ไม่สำเร็จ";
  }
}

function loadTrack(index) {
  if (playlist.length === 0) return;
  currentIndex = index;
  
  const currentMedia = playlist[currentIndex];
  const ytId = getYouTubeId(currentMedia.url);

  if (trackTitle) trackTitle.innerText = currentMedia.title || "ไม่ทราบชื่อเพลง";

  if (ytId) {
    isYouTube = true;
    htmlAudio.pause();
    if (isYtReady && ytPlayer && ytPlayer.cueVideoById) {
      ytPlayer.cueVideoById(ytId);
      ytPlayer.setVolume(parseFloat(volumeSlider.value) * 100);
    }
  } else {
    isYouTube = false;
    if (isYtReady && ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();
    htmlAudio.src = currentMedia.url;
  }
}

// 2. ปุ่ม Play / Pause
if (playBtn) {
  playBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;

    if (isYouTube) {
      if (!isYtReady || !ytPlayer || typeof ytPlayer.getPlayerState !== 'function') {
        alert("กำลังเตรียมระบบเล่นเพลง YouTube กรุณารออีกสักครู่แล้วกดใหม่ครับ");
        return;
      }
      const state = ytPlayer.getPlayerState();
      if (state === YT.PlayerState.PLAYING) {
        ytPlayer.pauseVideo();
        playBtn.innerText = "▶";
      } else {
        ytPlayer.playVideo();
        playBtn.innerText = "⏸";
      }
    } else {
      if (htmlAudio.paused) {
        htmlAudio.play().then(() => {
          playBtn.innerText = "⏸";
        }).catch(err => {
          alert("ไม่สามารถเล่นไฟล์ได้ กรุณาตรวจสอบลิงก์เพลง");
        });
      } else {
        htmlAudio.pause();
        playBtn.innerText = "▶";
      }
    }
  });
}

// 3. ปุ่ม เพลงถัดไป
if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    let nextIndex = (currentIndex + 1) % playlist.length;
    loadTrack(nextIndex);
    
    setTimeout(() => {
      if (isYouTube && isYtReady) {
        ytPlayer.playVideo();
      } else {
        htmlAudio.play();
      }
      if (playBtn) playBtn.innerText = "⏸";
    }, 600);
  });
}

// 4. ตัวปรับระดับเสียง
if (volumeSlider) {
  volumeSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    htmlAudio.volume = vol;
    if (isYtReady && ytPlayer && typeof ytPlayer.setVolume === 'function') {
      ytPlayer.setVolume(vol * 100);
    }
  });
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    if (nextBtn) nextBtn.click();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.YT) {
    initMusicPlayer();
  }
});