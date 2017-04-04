var setSong = function(songNumber){
    if (currentSoundFile) {
        currentSoundFile.stop();
    }
    
    currentlyPlayingSongNumber = parseInt(songNumber);
    currentSongFromAlbum = currentAlbum.songs[songNumber - 1];
    currentSoundFile = new buzz.sound(currentSongFromAlbum.audioUrl, {
        formats: [ 'mp3' ],
        preload: true
    });
    
    setVolume(currentVolume);
};

var seek = function(time) {
    if (currentSoundFile) {
        currentSoundFile.setTime(time);
    }
}

var setVolume = function(volume) {
    currentVolume = volume;
    if (currentSoundFile) {
        currentSoundFile.setVolume(volume);
    }
};

var getSongNumberCell = function(number) {
    return $('.song-item-number[data-song-number="' +  number + '"]');
};

var createSongRow = function(songNumber, songName, songLength) {
    var template = 
        '<tr class="album-view-song-item">'
      + '  <td class="song-item-number" data-song-number="' + songNumber + '">' + songNumber + '</td>'
      + '  <td class="song-item-title">' + songName + '</td>'
      + '  <td class="song-item-duration">' + songLength + '</td>'
      + '</tr>'
      ;
    
      var $row = $(template);
    
      var clickHandler = function() {
          
        var songNumber = parseInt($(this).attr('data-song-number'));
          
          if (currentlyPlayingSongNumber !== null) {
              var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);
              
              currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber)
              currentlyPlayingCell.html(currentlyPlayingSongNumber);
          }
          if (currentlyPlayingSongNumber !== songNumber) {
              setSong(songNumber);
              currentSoundFile.play();
              updateSeekBarWhileSongPlays();
              currentSongFromAlbum = currentAlbum.songs[songNumber - 1];
              console.log(currentSoundFile.getDuration());
              var $volumeFill = $('.volume .fill');
              var $volumeThumb = $('.volume .thumb');
              $volumeFill.width(currentVolume);
              $volumeThumb.css({left: currentVolume});
              
              $(this).html(pauseButtonTemplate);
              updatePlayerBarSong();
              $('.currently-playing .total-time').text(currentSoundFile.getDuration()); 
              //currentSongFromAlbum.formattedDuration);
          } else if (currentlyPlayingSongNumber === songNumber) {
              if (currentSoundFile.isPaused()) {
                  $(this).html(pauseButtonTemplate);
                  $('.main-controls .play-pause').html(playerBarPauseButton);
                  currentSoundFile.play();
              } else {
                  $(this).html(playButtonTemplate);
                  $('.main-controls .play-pause').html(playerBarPlayButton);
                  currentSoundFile.pause();
              }
          }
      };

    var onHover = function(event) { //Hovers event (eventListener)
        var songNumberCell = $(this).find('.song-item-number'); //when mouse hovers over, say, song#2, green, it finds green's song-item-number DOM
        var songNumber = parseInt(songNumberCell.attr('data-song-number')); //Green's song-item-number has a neighboring attribute, data-song-number. This gets it and stores it in var songNumber

        if (songNumber !== currentlyPlayingSongNumber) { //either another song is playing or no song is playing at all(songNumber === other songNumber or songnumber === null)
            songNumberCell.html(playButtonTemplate); //shows playButton when mouse hovers over that cell
        }
    };

    var offHover = function(event) {
        var songNumberCell = $(this).find('.song-item-number'); //finds, on DOM the mouse was hovering, '.song-item-number' class, stores it in songNumberCell variable
        var songNumber = parseInt(songNumberCell.attr('data-song-number')); //retrieves data-song-number of the cell the mouse is hovering

        if (songNumber !== currentlyPlayingSongNumber) { //if mouse is hoving different song
            songNumberCell.html(songNumber); //when mouse leaves, it shows songNumber again
        }
    };
    $row.find('.song-item-number').click(clickHandler);
    $row.hover(onHover, offHover);
    return $row;
};

var setCurrentAlbum = function(album) {
    currentAlbum = album;
    var $albumTitle = $('.album-view-title');
    var $albumArtist = $('.album-view-artist');
    var $albumReleaseInfo = $('.album-view-release-info');
    var $albumImage = $('.album-cover-art');
    var $albumSongList = $('.album-view-song-list');
    
    $albumTitle.text(album.title);
    $albumArtist.text(album.artist);
    $albumReleaseInfo.text(album.year + ' ' + album.label);
    $albumImage.attr('src', album.albumArtUrl);
    
    $albumSongList.empty();
    
    for (var i =0; i < album.songs.length; i++) {
        var $newRow = createSongRow(i + 1, album.songs[i].title, album.songs[i].duration);
       $albumSongList.append($newRow);
    }
};

var updateSeekBarWhileSongPlays = function() {
   if (currentSoundFile) {
       currentSoundFile.bind('timeupdate', function(event) {
          $('.current-time').text(this.getTime());
          var seekBarFillRatio = this.getTime() / this.getDuration();
          var $seekBar = $('.seek-control .seek-bar');
           console.log(currentSoundFile.getDuration());
           updateSeekPercentage($seekBar, seekBarFillRatio);
       });
    } 
    //console.log(currentSoundFile.getDuration());
};

var updateSeekPercentage = function($seekBar, seekBarFillRatio) {
    var offsetXPercent = seekBarFillRatio * 100;
    offsetXPercent = Math.max(0, offsetXPercent);
    offsetXPercent = Math.min(100, offsetXPercent);
    
    var percentageString = offsetXPercent + '%';
    $seekBar.find('.fill').width(percentageString);
    $seekBar.find('.thumb').css({left: percentageString});
};

var setupSeekBars = function() {
    var $seekBars = $('.player-bar .seek-bar');
    var $sb =  $($seekBars[0]).parent(); //$('durationSeekbar');
    updateSeekPercentage($sb, 0);
    $seekBars.click(function(event) {
        var offsetX = event.pageX - $(this).offset().left;
        var barWidth = (this).clientWidth;
        var seekBarFillRatio = offsetX / barWidth;
        
        if ($(this).parent().attr('class') == 'seek-control') {
            seek(seekBarFillRatio * currentSoundFile.getDuration());
        } else {
            setVolume(seekBarFillRatio * 100)
        }
        
        updateSeekPercentage($(this), seekBarFillRatio);
    });
    
    $seekBars.find('.thumb').mousedown(function(event) {
        
       var $seekBar = $(this).parent();

        $(document).bind('mousemove.thumb', function(event){
            var offsetX = event.pageX - $seekBar.offset().left;
            var barWidth = $seekBar.width();
            var seekBarFillRatio = offsetX / barWidth;
            
            if ($seekBar.parent().attr('class') == 'seek-control') {
                seek(seekBarFillRatio * currentSoundFile.getDuration());
            } else {
                setVolume(seekBarFillRatio);
            }
            
            updateSeekPercentage($seekBar, seekBarFillRatio);
        });
        
        $(document).bind('mouseup.thumb', function() {
           $(document).unbind('mousemove.thumb');
           $(document).unbind('mouseup.thumb');
        });
    });
};

var trackIndex = function(album, song) {
    return album.songs.indexOf(song);
};

var previousSong = function() {
    
    var getLastSongNumber = function(index) {
        return index == (currentAlbum.songs.length - 1) ? 1 : index + 2;
    };
    
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    currentSongIndex--;
    
    if (currentSongIndex < 0) {
        currentSongIndex = currentAlbum.songs.length - 1;
    }
    
    setSong(currentSongIndex + 1);
    currentSongFromAlbum = currentAlbum.songs[currentSongIndex];
    currentSoundFile.play();
    updatePlayerBarSong();
    updateSeekBarWhileSongPlays();

    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-name').text(currentAlbum.artist);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.title);
    $('.seek-control .total-time').text(currentSongFromAlbum.formattedDuration);
    $('.main-controls .play-pause').html(playerBarPauseButton);
    
    var lastSongNumber = getLastSongNumber(currentSongIndex);
    var $previousSongNumberCell = $('.song-item-number[data-song-number="' + currentlyPlayingSongNumber + '"]');
    var $lastSongNumberCell = $('.song-item-number[data-song-number="' + lastSongNumber + '"]');
    
    $previousSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
    
};

var nextSong = function() {
    
    var getLastSongNumber = function(index) {
        return index == 0 ? currentAlbum.songs.length : index;
    };
    
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    currentSongIndex++;
    
    if (currentSongIndex >= currentAlbum.songs.length) {
        currentSongIndex = 0;
    }
    
    setSong(currentSongIndex + 1);
    currentSongFromAlbum = currentAlbum.songs[currentSongIndex];
    currentSoundFile.play();
    updatePlayerBarSong();
    updateSeekBarWhileSongPlays();

    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-name').text(currentAlbum.artist);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.title);
    $('.currently-playing .total-time').text(currentSongFromAlbum.formattedDuration);
    $('.main-controls .play-pause').html(playerBarPauseButton);
    
    var lastSongNumber = getLastSongNumber(currentSongIndex);
    var $nextSongNumberCell = $('.song-item-number[data-song-number="' + currentlyPlayingSongNumber + '"]');
    var $lastSongNumberCell = $('.song-item-number[data-song-number="' + lastSongNumber + '"]');
    
    $nextSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
}

var playerBarPlayPauseButton = function() {
    
    // if currentSoundFile is null, no song is loaded
    if (currentSoundFile === null) {
        return;
    }
    
    // if the song is paused
    var songNumberCell = getSongNumberCell(currentlyPlayingSongNumber);
    var $songNumberCell = $(songNumberCell);
    if (currentSoundFile.isPaused()) {
        $songNumberCell.html(pauseButtonTemplate);
        $('.main-controls .play-pause').html(playerBarPauseButton);
        currentSoundFile.play();
    } else {
        //if the song is playing
        $songNumberCell.html(currentlyPlayingSongNumber);
        $('.main-controls .play-pause').html(playerBarPlayButton);
        currentSoundFile.pause();
    }
};
    
var updatePlayerBarSong = function() {
    
    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-name').text(currentAlbum.title);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.artist);
    $('.main-controls .play-pause').html(playerBarPauseButton);
};

var playButtonTemplate = '<a class="album-song-button"><span class="ion-play"></span></a>';
var pauseButtonTemplate = '<a class="album-song-button"><span class="ion-pause"></span></a>';
var playerBarPlayButton = '<span class="ion-play"></span>';
var playerBarPauseButton = '<span class="ion-pause"></span>';

// Store state of playing songs
var currentAlbum = null;
var currentlyPlayingSongNumber = null;
var currentSongFromAlbum = null;
var currentSoundFile = null;
var currentVolume = 80;

var $previousButton = $('.main-controls .previous');
var $nextButton = $('.main-controls .next');
var $playerBarPlayPauseButton = $('.main-controls .play-pause');


$(document).ready(function() {
    setCurrentAlbum(albumPicasso);
    setupSeekBars();
    $previousButton.click(previousSong);
    $nextButton.click(nextSong);
    $playerBarPlayPauseButton.click(playerBarPlayPauseButton);
});
