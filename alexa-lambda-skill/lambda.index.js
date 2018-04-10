
var AWS = require('aws-sdk');
var iotdata = new AWS.IotData({endpoint: 'a27ta3sxbmmw0b.iot.us-east-1.amazonaws.com'});

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.37c07651-f1e5-4fa7-8e17-b2e762ac9edc") {
             context.fail("Invalid Application ID");
        }
        

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("CommandIntent" === intentName) {
        sendCommand(intent, session, callback);
    } else if ("FeatureMenuIntent" === intentName) {
        dictateFeatureMenu(intent, session, callback);
    }  else if ("VehicleInfoIntent" === intentName) {
        dictateVehicleInfo(intent, session, callback);
    }  else if ("AMAZON.StopIntent" === intentName) {
        endSession(callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getHelpResponse(callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

// --------------- Functions that control the skill's behavior -----------------------
function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "control your feature with command on or off"
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please say a command";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getHelpResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Help";
    var speechOutput = "You can say a command to control any feature" +
        "like switch on or switch off or start and stop. Now say a command";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please say a command";
    var shouldEndSession = false;

    callback(sessionAttributes, 
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function dictateVehicleInfo(intent, session, callback) {
    var sessionAttributes = {};
    var cardTitle = "Vehicle Info";
    var menu = intent.slots.VehicleMenu;
    if (menu.value == "fuel"){
        var speechOutput = "Currently you are running low on fuel, you have 1 point 3 Litres left, Next Filling station is about 3 Kilometers far from your current location";
    } else if (menu.value == "location") {
        var speechOutput = "You are currently on Mahatma Gandhi Road, Heading South";
    } else if (menu.value == "ivi") {
        var speechOutput = "In-car entertainment (ICE), or in-vehicle infotainment (IVI), is a collection of hardware and software in automobiles that provides audio or video entertainment. In car entertainment originated with car audio systems that consisted of radios and cassette or CD players, and now includes automotive navigation systems, video players, USB and Bluetooth connectivity, Carputers, in-car internet, and WiFi. Once controlled by simple dashboards knobs and dials, ICE systems can include steering wheel audio controls and handsfree voice control.";
    } else if (menu.value == "telltale") {
        var speechOutput = "A tell-tale (or idiot light, especially in North America[1]) is an indicator of the status or malfunction of a system within a motor vehicle";
    } else {
        var speechOutput = "I currently do not know about this item, It is programmers fault not mine LOL";
    }
        
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please select a feature and say the command";
    var shouldEndSession = false;

    callback(sessionAttributes, 
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function dictateFeatureMenu(intent, session, callback) {
    var sessionAttributes = {};
    var cardTitle = "Feature Help";
    var speechOutput = "Features supported are Parking Camera, Video Player and FM, You can also ask me about fuel and type pressure status and basic vehicle info";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please select a feature and say the command";
    var shouldEndSession = false;

    callback(sessionAttributes, 
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}
/**
 * Sends a command
 */
function sendCommand(intent, session, callback) {
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var command = intent.slots.Command;
    var feature = intent.slots.Feature;
    console.log("Received Command", command.value);
    console.log("Received Feature", feature.value);
    
    if (feature.value == "video" || feature.value == "camera" || feature.value == "fm") {
        if (command.value == "play" || command.value == "start" || command.value == "stop" || command.value == "on" || command.value == "off") {
            console.log("Feature checked, Command checked: Calling featurecontrol");
            featurecontrol(feature.value, command.value, function(speechOutput){
                callback(sessionAttributes,
                    buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
            });
        }
        else {
            console.log("Invalid command found");
            commanderror(function(speechOutput){
                callback(sessionAttributes,
                    buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
            });
        } 
    }
    else {
        console.log("Invalid feature found");
        featureerror(function(speechOutput){
                callback(sessionAttributes,
                    buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
            });

        repromptText = "Unknown command. Just say a command like: start or stop";
        var speechOutput = repromptText;
        callback(sessionAttributes,
            buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
    }
}


function commanderror(callback) {
    callback("This command is not valid");
}

function featureerror(callback) {
    callback("This feature is not currently supported");
}


function featurecontrol(featureValue, commandValue, callback) {
    console.log("Calling IOTData ...");
    var payloadObj={ 
                   "state": {
                        "reported": {
                                         "FeatureType": featureValue,
                                         "CommandType": commandValue 
                                    }
                            }
                   };
     

    var params = {
        topic: '$aws/things/myfan/shadow/update', // required
        payload: JSON.stringify(payloadObj),
        qos: 0
    };

    iotdata.publish(params, function(err, data) {
        if (err) {   // an error occurred
            console.log(err, err.stack);
            callback("Error when sending command to device");
        }
        else {  // successful response
            console.log(data);
            callback(featureValue + " " + commandValue); //Executed " + command);
        }    
    });

}

function endSession(callback) {
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = true;
    var cardTitle = null;
    var speechOutput = "Goodbye";
    
    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet -  " +  title,
            content: "SessionSpeechlet -  " +  output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
