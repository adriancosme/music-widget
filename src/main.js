// Parse query parameters
const params = new URLSearchParams(window.location.search);
const queryUser = params.get('user');
const queryKey = params.get('key');

// Configuration State
let username = queryUser || import.meta.env.VITE_LASTFM_USER || localStorage.getItem('lastfm_username') || '';
let apiKey = queryKey || import.meta.env.VITE_LASTFM_API_KEY || localStorage.getItem('lastfm_apikey') || '';
let pollInterval = parseInt(import.meta.env.VITE_POLL_INTERVAL_MS) || 5000;

// UI Elements
const configCard = document.getElementById('config-card');
const obsWidget = document.getElementById('obs-widget');
const inputUsername = document.getElementById('input-username');
const inputApiKey = document.getElementById('input-apikey');
const btnSaveConfig = document.getElementById('btn-save-config');


// Widget Elements
const widgetTitle = document.getElementById('widget-title');
const widgetArtist = document.getElementById('widget-artist');
const widgetArt = document.getElementById('widget-art');
const widgetStatusText = document.getElementById('widget-status-text');
const eqContainer = document.getElementById('eq-container');
const widgetProgress = document.getElementById('widget-progress');

// Runtime State
let lastTrackSignature = '';
let isPlaying = false;
let pollTimer = null;
let progressInterval = null;
let trackDurationMs = 0;
let localElapsedMs = 0;

// Show / Hide configuration card
function checkConfig() {
  if (!username || !apiKey || username === 'your_lastfm_username_here' || apiKey === 'your_lastfm_api_key_here') {
    configCard.classList.remove('hidden');
    obsWidget.classList.add('opacity-30'); // dim widget while configuring
    stopPolling();
  } else {
    configCard.classList.add('hidden');
    obsWidget.classList.remove('opacity-30');
    

    
    startPolling();
  }
}

// Save configuration from UI
btnSaveConfig.addEventListener('click', () => {
  const userVal = inputUsername.value.trim();
  const keyVal = inputApiKey.value.trim();
  
  if (!userVal || !keyVal) {
    alert('Por favor ingresa tanto tu usuario como tu API Key.');
    return;
  }
  
  username = userVal;
  apiKey = keyVal;
  
  localStorage.setItem('lastfm_username', username);
  localStorage.setItem('lastfm_apikey', apiKey);
  
  checkConfig();
});



// Start checking Last.fm API
function startPolling() {
  stopPolling();
  fetchRecentTrack(); // Immediate check
  pollTimer = setInterval(fetchRecentTrack, pollInterval);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  stopProgressTracker();
}

// Fetch currently playing track from Last.fm
async function fetchRecentTrack() {
  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(username)}&api_key=${encodeURIComponent(apiKey)}&format=json&limit=1`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    
    const data = await res.json();
    if (!data.recenttracks || !data.recenttracks.track || data.recenttracks.track.length === 0) {
      updateUIAsPaused();
      return;
    }
    
    const track = data.recenttracks.track[0];
    const isNowPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';
    const trackName = track.name || 'Desconocido';
    const artistName = track.artist ? track.artist['#text'] : 'Desconocido';
    const albumName = track.album ? track.album['#text'] : '';
    
    // Create a unique signature to check if track changed
    const trackSignature = `${trackName} - ${artistName}`;
    
    if (trackSignature !== lastTrackSignature) {
      lastTrackSignature = trackSignature;
      
      // Update Title & Artist
      updateTrackInfo(trackName, artistName);
      
      // Update Cover Art
      let coverUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBn0CuE2hZ5hXTzr17LyM5ShhjY5tCrF4OKR24-KywetaoSqurZnuCqpd9_4wAyeZX0Ulzy7N1BgbxTOpPn8Kb-3oWB1TWf5UKyUd14-ctTmWTVHSkS4DkjQyPtw9p9EBFNMbQrhHvhB1eKlBuRZ_EXKXKD0fp_qGb09YbMwGABqlos6BEfx6uO-9mSrvNqt7t3I4kCSf3wIT_1LEb0Sw2VupbAeEare018RS8Ft0HKQ7pIDZg0A_G5GyBDM-XiI7o5NJZHQueOjS0';
      if (track.image && track.image.length > 0) {
        // Get the largest image available
        const xlImage = track.image.find(img => img.size === 'extralarge') || track.image[track.image.length - 1];
        if (xlImage && xlImage['#text']) {
          coverUrl = xlImage['#text'];
        }
      }
      widgetArt.src = coverUrl;
      widgetArt.alt = `Portada del álbum ${albumName ? `"${albumName}" ` : ''}- ${trackName} de ${artistName}`;
      
      // Fetch track duration to animate progress bar
      fetchTrackDuration(artistName, trackName);
    }
    
    // Update Playback State
    if (isNowPlaying) {
      updateUIAsPlaying();
    } else {
      updateUIAsPaused();
    }
    
  } catch (err) {
    console.error('Error fetching Last.fm track:', err);
    widgetStatusText.innerText = 'Error API';
    widgetStatusText.className = 'font-time-code text-time-code text-error uppercase tracking-widest';
    eqContainer.classList.add('opacity-30');
  }
}

// Fetch exact track info (specifically duration)
async function fetchTrackDuration(artist, track) {
  stopProgressTracker();
  trackDurationMs = 180000; // default 3 minutes fallback
  localElapsedMs = 0;
  
  // Reset progress bar UI and aria-valuenow for new track
  widgetProgress.style.width = '0%';
  const progressBarContainer = document.getElementById('progress-bar-container');
  if (progressBarContainer) {
    progressBarContainer.setAttribute('aria-valuenow', '0');
  }
  
  const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${encodeURIComponent(apiKey)}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`;
  
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.track && data.track.duration) {
        const duration = parseInt(data.track.duration);
        if (duration > 0) {
          trackDurationMs = duration;
        }
      }
    }
  } catch (err) {
    // Silent error, fallback duration will be used
  }
  
  if (isPlaying) {
    startProgressTracker();
  }
}

// Update Title and Artist UI elements
function updateTrackInfo(title, artist) {
  // Apply Marquee animation if title is long
  if (title.length > 25) {
    widgetTitle.parentElement.className = "animate-marquee font-track-title text-track-title text-on-surface";
    widgetTitle.innerHTML = `<span class="pr-8">${title}</span><span class="pr-8">${title}</span>`;
  } else {
    widgetTitle.parentElement.className = "font-track-title text-track-title text-on-surface";
    widgetTitle.innerText = title;
  }
  
  widgetArtist.innerText = artist;
}

// Update UI Playing status
function updateUIAsPlaying() {
  if (isPlaying) return; // Already in playing state
  isPlaying = true;
  
  widgetStatusText.innerText = 'Now Playing';
  widgetStatusText.className = 'font-time-code text-time-code text-secondary uppercase tracking-widest';
  eqContainer.classList.remove('opacity-30');
  eqContainer.querySelectorAll('.eq-bar').forEach(bar => bar.style.animationPlayState = 'running');
  
  startProgressTracker();
}

// Update UI Paused/Disconnected status
function updateUIAsPaused() {
  if (!isPlaying && widgetStatusText.innerText === 'Pausado') return; // Already paused
  isPlaying = false;
  
  widgetStatusText.innerText = 'Pausado';
  widgetStatusText.className = 'font-time-code text-time-code text-on-surface-variant uppercase tracking-widest';
  eqContainer.classList.add('opacity-30');
  eqContainer.querySelectorAll('.eq-bar').forEach(bar => bar.style.animationPlayState = 'paused');
  
  stopProgressTracker();
}

// Animate Progress Bar locally
function startProgressTracker() {
  stopProgressTracker();
  
  const progressBarContainer = document.getElementById('progress-bar-container');
  const tickMs = 1000;
  progressInterval = setInterval(() => {
    if (trackDurationMs > 0) {
      localElapsedMs += tickMs;
      const percentage = Math.min((localElapsedMs / trackDurationMs) * 100, 100);
      widgetProgress.style.width = `${percentage}%`;
      if (progressBarContainer) {
        progressBarContainer.setAttribute('aria-valuenow', Math.round(percentage));
      }
      
      // If we reached 100%, hold it there until the next poll updates the track
      if (percentage >= 100) {
        clearInterval(progressInterval);
      }
    }
  }, tickMs);
}

function stopProgressTracker() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

// Initial Configuration Check
checkConfig();
