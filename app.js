const musicContainer = document.getElementById('music-container');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

const audio = document.getElementById("audio");
const title = document.getElementById('title');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');


// Song Titles

const songs = 
['Online', 
'Heat (Finger)',
'Apocalypse Forever',
'Sirens',
'Anything Goes',
'So Long',
'Going After It',
'Tone Of The Unknown',
]

let volume = document.getElementById('volume-slider');
volume.addEventListener("change", function(e) {
    audio.volume = e.currentTarget.value / 100;
})


// Keep track of song
let songIndex = 0;


//Load song details into DOM
loadSong(songs[songIndex]);

//Update song details
function loadSong(song) {
    title.innerText = "now playing: " + song;
    audio.src = `media/${song}.wav`;
    
}

//Event Listener
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

//Play Song
function playSong(){
    musicContainer.classList.add("play");
    playBtn.querySelector('i.fas').classList.remove("fa-play");
    playBtn.querySelector("i.fas").classList.add('fa-pause');
    audio.play();
}

function pauseSong(){
    musicContainer.classList.remove("play");
    playBtn.querySelector('i.fas').classList.add("fa-play");
    playBtn.querySelector('i.fas').classList.remove("fa-pause");

    audio.pause();
}


function prevSong(){
    songIndex--;
    if (songIndex < 0)
    {
        songIndex = songs.length - 1;
    }
    loadSong(songs[songIndex]);

    playSong();
}

function nextSong(){
    songIndex++;
    if (songIndex > songs.length - 1)
    {
        songIndex = 0;
    }
    loadSong(songs[songIndex]);

    playSong();
}

//Set progress bar
function setProgress(e){
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;

    audio.currentTime = (clickX/width) * duration;
}

//Update Progress bar

function updateProgress(e){
    const{duration, currentTime} = e.srcElement;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
}


audio.addEventListener('timeupdate', updateProgress);


//Click on progress bar

progressContainer.addEventListener("click", setProgress)

//Song end
audio.addEventListener("ended", nextSong);