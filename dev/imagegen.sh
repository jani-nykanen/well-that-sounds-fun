#!/bin/sh
convert ./output/assets/bitmaps/enemies.png -fuzz 0% -fill 'rgb(127,127,127)' -opaque 'rgb(255,255,255)' -fill 'rgb(127,127,127)' -opaque 'rgb(0,0,0)' ./output/assets/bitmaps/enemies_black.png
convert ./output/assets/bitmaps/player.png -fuzz 0% -fill 'rgb(127,127,127)' -opaque 'rgb(255,255,255)' -fill 'rgb(127,127,127)' -opaque 'rgb(0,0,0)' ./output/assets/bitmaps/player_black.png
