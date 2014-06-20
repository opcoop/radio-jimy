define(function(require, exports, module) {
        var AudioContext, RequestAnimationFrame;
        // check if the default naming is enabled, if not use the chrome one.
        if (! window.AudioContext) {
                if (! window.webkitAudioContext) {
                        alert('no audiocontext found');
                }
                AudioContext = window.webkitAudioContext;
        } else {
                AudioContext = window.AudioContext;
        }

        if (! window.RequestAnimationFrame) {
                if (! window.webkitRequestAnimationFrame) {
                        alert('no audiocontext found');
                }
                RequestAnimationFrame = window.webkitRequestAnimationFrame;
        } else {
                RequestAnimationFrame = window.RequestAnimationFramexs;
        }


        var audio = document.getElementById('audio');
        var progress = document.getElementById('progress');
        var playpause = document.getElementById('play-pause');
        var volume = document.getElementById('volume');
	var canvas = document.getElementById('progress');
        var ctx = canvas.getContext('2d');
        ctx.lineWidth = 4;

        var R = canvas.width / 2;
        var STROKE_AND_FILL = false;
        const CANVAS_HEIGHT = canvas.height;
        const CANVAS_WIDTH = canvas.width;

        audio.controls = false;

        audio.addEventListener('timeupdate', function() {
  	        updateProgress();
        }, false);

        playpause.addEventListener('click', togglePlayPause);

        audio.addEventListener('playing', setPlaying);

        audio.addEventListener('pause', setPaused);
        audio.addEventListener('ended', setPaused);
        audio.addEventListener('abort', setPaused);
        audio.addEventListener('emptied', setPaused);
        audio.addEventListener('suspend', setPaused);

        audio.addEventListener('durationchange', mediaError);
        audio.addEventListener('error', mediaError);

        volume.addEventListener('change', setVolume);

        var context = new AudioContext();
        var analyser = context.createAnalyser();

        var source = context.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(context.destination);

        function mediaError() {
                console.log ('error', playpause.error);
        }

        function setPaused() {
                console.log ('paused');
                playpause.title = "Play";
                playpause.innerHTML = '<i class="fa fa-play fa-10x"></i>';
                audio.pause();

        }
        function setPlaying() {
                console.log ('play');
                playpause.title = "Pause";
                playpause.innerHTML = '<i class="fa fa-pause fa-10x"></i>';
                audio.play();
                rafCallback();
        }
        function togglePlayPause() {
                if (audio.paused || audio.ended) {
                        setPlaying();
                } else {
                        setPaused();
                }
        }

        function setVolume() {
                audio.volume = volume.value;
        }

        function updateProgress() {
	        var percent = Math.floor((100 / audio.duration) * audio.currentTime);
	        progress.value = percent;
	        var context = canvas.getContext('2d');
	        var centerX = canvas.width / 2;
	        var centerY = canvas.height / 2;
	        var radius = 150;
	        var circ = Math.PI * 2;
	        var quart = Math.PI / 2;
	        var cpercent = percent / 100; /* current percent */
	        context.beginPath();
	        context.arc(centerX, centerY, radius, 0, ((circ) * cpercent), false);
	        context.lineWidth = 10;
	        context.strokeStyle = '#26C5CB';
	        context.stroke();
	        if (audio.ended) resetPlayer();
        }

        function rafCallback(time) {
                if (audio.paused || audio.ended) {
                        return;
                }

                RequestAnimationFrame(rafCallback, canvas);

                var freqByteData = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(freqByteData); //analyser.getByteTimeDomainData(freqByteData);

                var SPACER_WIDTH = 10;
                var BAR_WIDTH = 10;
                var OFFSET = 200;
                var CUTOFF = 23;
                var numBars = Math.round(CANVAS_WIDTH / SPACER_WIDTH);
                var centerX = canvas.width / 2;
	        var centerY = canvas.height / 2;

                ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

                ctx.fillStyle = '#26C5CB';
                ctx.lineCap = 'round';

                for (var i = 0; i < numBars; ++i) {
                        var magnitude = freqByteData[i + OFFSET]/2;
                        ctx.fillRect(0, 150, BAR_WIDTH, magnitude);
                        ctx.fillRect(0, -150, -BAR_WIDTH, -magnitude);
                        ctx.rotate(Math.PI/numBars);
                        ctx.fillStyle = '#26C';
                }
        }
        //

        function resetPlayer() {
	        audio.currentTime = 0; context.clearRect(0,0,canvas.width,canvas.height);
                playpause.title = "Play";
	        playpause.innerHTML = '<i class="fa fa-play fa-10x"></i>';
        }
});
