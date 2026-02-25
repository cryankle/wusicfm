const musicContainer = document.getElementById('music-container');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

const audio = document.getElementById("audio");
const title = document.getElementById('title');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');

// Add Media Session API for better mobile notifications - MOVED TO TOP
// Add Media Session API for better mobile notifications
if ('mediaSession' in navigator) {
    console.log('✅ Media Session API is supported on this device');
    
    // Update media session with song metadata
    function updateMediaSession(songName) {
        console.log('Updating media session with song:', songName);
        
        try {
            // iOS needs artwork to be an array of objects with specific properties
            const artwork = [
                {
                    src: 'https://via.placeholder.com/512/1a1a1a/ff6b6b?text=' + encodeURIComponent(songName),
                    sizes: '512x512',
                    type: 'image/png'
                },
                {
                    src: 'https://via.placeholder.com/256/1a1a1a/ff6b6b?text=' + encodeURIComponent(songName),
                    sizes: '256x256',
                    type: 'image/png'
                },
                {
                    src: 'https://via.placeholder.com/128/1a1a1a/ff6b6b?text=' + encodeURIComponent(songName),
                    sizes: '128x128',
                    type: 'image/png'
                }
            ];
            
            // Create metadata
            const metadata = new MediaMetadata({
                title: songName,
                artist: 'Cry Ankle',
                album: 'Apocalypse Forever',
                artwork: artwork
            });
            
            // Set the metadata
            navigator.mediaSession.metadata = metadata;
            
            // Force a small delay and then verify
            setTimeout(() => {
                if (navigator.mediaSession.metadata) {
                    console.log('✅ Media session verified:', {
                        title: navigator.mediaSession.metadata.title,
                        artist: navigator.mediaSession.metadata.artist,
                        album: navigator.mediaSession.metadata.album,
                        artworkCount: navigator.mediaSession.metadata.artwork?.length || 0
                    });
                }
            }, 100);
            
        } catch (error) {
            console.error('Error updating media session:', error);
        }
    }

    // Set up media controls
    try {
        navigator.mediaSession.setActionHandler('play', () => {
            console.log('Media session: play');
            playSong();
        });
        
        navigator.mediaSession.setActionHandler('pause', () => {
            console.log('Media session: pause');
            pauseSong();
        });
        
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            console.log('Media session: previous');
            prevSong();
        });
        
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            console.log('Media session: next');
            nextSong();
        });
        
        console.log('✅ Media session handlers set up successfully');
    } catch (error) {
        console.error('Error setting up media session handlers:', error);
    }
} else {
    console.log('❌ Media Session API is NOT supported on this device');
}


// TEMPORARY: Show console logs on iPhone screen
(function() {
    // Create a floating debug panel
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'fixed';
    debugDiv.style.bottom = '10px';
    debugDiv.style.right = '10px';
    debugDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
    debugDiv.style.color = 'lime';
    debugDiv.style.padding = '10px';
    debugDiv.style.borderRadius = '5px';
    debugDiv.style.zIndex = '9999';
    debugDiv.style.fontSize = '12px';
    debugDiv.style.maxWidth = '80%';
    debugDiv.style.maxHeight = '200px';
    debugDiv.style.overflow = 'auto';
    debugDiv.style.display = 'none'; // Hidden by default
    debugDiv.id = 'debug-console';
    document.body.appendChild(debugDiv);
    
    // Override console.log
    const originalLog = console.log;
    console.log = function(...args) {
        originalLog.apply(console, args);
        const debugEl = document.getElementById('debug-console');
        if (debugEl) {
            debugEl.style.display = 'block';
            debugEl.innerHTML += args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg) : arg
            ).join(' ') + '<br>';
            // Auto-scroll to bottom
            debugEl.scrollTop = debugEl.scrollHeight;
        }
    };
    
    // Add tap gesture to hide/show (5 taps)
    let tapCount = 0;
    let tapTimer;
    document.addEventListener('touchend', function() {
        tapCount++;
        clearTimeout(tapTimer);
        tapTimer = setTimeout(() => {
            tapCount = 0;
        }, 500);
        
        if (tapCount === 5) {
            const debugEl = document.getElementById('debug-console');
            if (debugEl) {
                if (debugEl.style.display === 'none') {
                    debugEl.style.display = 'block';
                    debugEl.innerHTML += '📱 Debug mode activated<br>';
                } else {
                    debugEl.style.display = 'none';
                }
            }
            tapCount = 0;
        }
    });
})();


// Volume slider
let volume = document.getElementById('volume-slider');
if (volume) {
    volume.addEventListener("change", function(e) {
        audio.volume = e.currentTarget.value / 100;
    });
}



// ✅ FIXED: Using the new publishable key format
const supabaseClient = window.supabase.createClient(
  'https://aebaggytwjsmhdbnpoos.supabase.co',
  'sb_publishable_gQCknZeqIOn22sSNnprSfg_7WL0EHkk' // Your new publishable key
);

// Song metadata with filenames
const songs = [
  { name: "Online", filename: "1 - Online.mp3" },
  { name: "Heat (Finger)", filename: "2 - Heat (Finger).mp3" },
  { name: "Apocalypse Forever", filename: "3 - Apocalypse Forever.mp3" },
  { name: "Sirens", filename: "4 - Sirens.mp3" },
  { name: "Anything Goes", filename: "5 - Anything Goes.mp3" },
  { name: "So Long", filename: "6 - So Long.mp3" },
  { name: "Going After It", filename: "7 - Going After It.mp3" },
  { name: "Tone Of The Unknown", filename: "8 - Tone Of The Unknown.mp3" }
];

let songIndex = 0;
let isLoading = false;

// Get signed URL from Supabase
async function getSignedUrl(filename) {
    try {
        console.log('Getting signed URL for:', filename);
        
        const { data, error } = await supabaseClient
            .storage
            .from('public-audio')
            .createSignedUrl(filename, 3600);

        if (error) {
            console.error('Signed URL error:', error);
            return null;
        }
        
        console.log('Got signed URL:', data.signedUrl);
        return data.signedUrl;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// Load song
async function loadSong(index) {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const song = songs[index];
        console.log('Loading song:', song.name);
        title.innerText = "Loading: " + song.name + "...";
        
        // Update media session IMMEDIATELY with the song name
        if ('mediaSession' in navigator) {
            updateMediaSession(song.name);
        }
        
        const signedUrl = await getSignedUrl(song.filename);
        
        if (signedUrl) {
            audio.src = signedUrl;
            title.innerText = "Now playing: " + song.name;
            
            // Update media session again to be safe
            if ('mediaSession' in navigator) {
                updateMediaSession(song.name);
            }
        } else {
            title.innerText = "Error: Could not load " + song.name;
        }
    } catch (error) {
        console.error('Error:', error);
        title.innerText = "Error loading song";
    } finally {
        isLoading = false;
    }
}

// Update media session position state
audio.addEventListener('timeupdate', () => {
    if ('mediaSession' in navigator && audio.duration) {
        navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime
        });
    }
    
    // Your existing progress update
    updateProgress({ srcElement: audio });
});

// Load first song
loadSong(0);

// Play/Pause button
playBtn.addEventListener("click", () => {
    const isPlaying = musicContainer.classList.contains('play');
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

prevBtn.addEventListener("click", prevSong);
nextBtn.addEventListener("click", nextSong);

async function playSong() {
    console.log('playSong() called');
    musicContainer.classList.add("play");
    playBtn.querySelector('i.fas').classList.remove("fa-play");
    playBtn.querySelector("i.fas").classList.add('fa-pause');
    
    if (!audio.src) {
        await loadSong(songIndex);
    }
    
    try {
        // Set playback state to playing BEFORE playing
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
            console.log('Media session playback state: playing');
        }
        
        await audio.play();
        console.log('Audio.play() succeeded');
        
    } catch (error) {
        console.error('Playback error:', error);
    }
}

function pauseSong() {
    console.log('pauseSong() called');
    musicContainer.classList.remove("play");
    playBtn.querySelector('i.fas').classList.add("fa-play");
    playBtn.querySelector("i.fas").classList.remove("fa-pause");
    audio.pause();
    
    // Update media session play state
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
        console.log('Media session playback state: paused');
    }
}

async function prevSong() {
    songIndex--;
    if (songIndex < 0) songIndex = songs.length - 1;
    await loadSong(songIndex);
    playSong();
}

async function nextSong() {
    songIndex++;
    if (songIndex >= songs.length) songIndex = 0;
    await loadSong(songIndex);
    playSong();
}

// Progress bar
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    
    if (duration && isFinite(duration)) {
        audio.currentTime = (clickX / width) * duration;
    }
}

function updateProgress(e) {
    if (audio.duration && isFinite(audio.duration)) {
        const { duration, currentTime } = e.srcElement;
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
    }
}

audio.addEventListener('timeupdate', updateProgress);
progressContainer.addEventListener("click", setProgress);
audio.addEventListener("ended", nextSong);


// TEMPORARY TEST FUNCTION - Remove after testing
window.testMediaSession = function() {
    if ('mediaSession' in navigator) {
        updateMediaSession('Test Song');
        navigator.mediaSession.playbackState = 'playing';
        console.log('Test media session set. Check your iPhone now!');
    } else {
        console.log('Media Session not supported');
    }
};
console.log('Run window.testMediaSession() in console to test Media Session');