// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet example using p5.js

modified by John Keefe ... adding p5.sound.js
=== */

// pose settings
let video;
let poseNet;
let poses = [];

// audio settings
let notes = [ 60, 62, 64, 65, 67, 69];
let osc;

// button settings
var button;
var button_state = false;

function setup() {
    createCanvas(640, 480);
        
    // set up the video
    video = createCapture(VIDEO);
    video.size(width, height);

    // Create a new poseNet method with a single human detection
    poseNet = ml5.poseNet(video, type='single', modelReady);
    // This sets up an event that fills the global variable "poses"
    // with an array every time new poses are detected
    poseNet.on('pose', function(results) {
        poses = results;
    });
    
    // Hide the video element, and just show the canvas
    video.hide();
    
    // make a button to toggle the sound
    button = createButton('Click to toggle sound on/off');
    button.position(19, 100);
    button.hide()
    button.mousePressed(toggleSound);
    
    // Establish a triangle oscillator for the sound
    osc = new p5.TriOsc();
    // Start silent
    osc.start();
    osc.amp(0);

    // the rest of this code helps get around Chrome's 
    // requirement that sound activation is initiated by the user
    var myDiv = createDiv('click to start audio');
    myDiv.position(0, 0);

    // Start the audio context on a click/touch event
    userStartAudio().then(function() {
        myDiv.remove();
    });
    
    function touchStarted() {
        if (getAudioContext().state !== 'running') {
            getAudioContext().resume();
        }
    }
}

// this is what heppens once the model is loaded
function modelReady() {
    select('#status').html('Model Loaded! Turn on the audio and use your right hand to change the tone. (You may need to step back.)');
    button.show()
    osc.amp(0);
}

// this function gets called repeatedly by p5.js
function draw() {
    image(video, 0, 0, width, height);

    // We can call both functions to draw all keypoints and the skeletons
    drawKeypoints();
    drawSkeleton();
    
    // And this interprets the right-wrist position into a note!
    wristToNote();
}

// this gets called when the button is clicked
function toggleSound() {
    if (!button_state) {
        osc.amp(1.0,0.01);
        button_state = true;
    } else {
        osc.amp(0);
        button_state = false;
    }    
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
        let pose = poses[i].pose;
        for (let j = 0; j < pose.keypoints.length; j++) {
            // A keypoint is an object describing a body part (like rightArm or leftShoulder)
            let keypoint = pose.keypoints[j];
            // Only draw an ellipse is the pose probability is bigger than 0.2
            if (keypoint.score > 0.2) {
                fill(255, 0, 0);
                noStroke();
                ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
            }
        }
    }
}

// A function to draw the skeletons
function drawSkeleton() {
    // Loop through all the skeletons detected
    for (let i = 0; i < poses.length; i++) {
        let skeleton = poses[i].skeleton;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j++) {
            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            stroke(255, 0, 0);
            line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
        }
    }
}

// turns a the right-wrist position into a note
function wristToNote() {
    
    // return if no poses yet
    if (!poses || poses.length < 1) {
        return;
    } 
    
    // map the position of right wrist onto the set of notes
    let right_wrist_y = poses[0].pose.rightWrist.y
    let right_wrist_confidence = poses[0].pose.rightWrist.confidence
    
    // check the rightwrist keypoint score [10] to see if it's in view
    if (poses[0].pose.keypoints[10].score > 0.2) {
        
        let note = parseInt( map(right_wrist_y, 0, height, notes.length -1, 0), 10)
        console.log(right_wrist_y, note, notes[note], right_wrist_confidence)
        playNote(notes[note])    
    }
}

// A function to play a note
function playNote(value) {
    // set the note
    osc.freq(midiToFreq(value));    
}
