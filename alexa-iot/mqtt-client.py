#!/usr/bin/python

#required libraries
import os
import time
import sys                                 
import json
import ssl
import ast
import pprint
import paho.mqtt.client as mqtt

payload = json.dumps({
        "state": {
                    "reported": {
                                    "FanState": "true"
                                            }
                        }
        })

#called while client tries to establish connection with the server 
def on_connect(mqttc, obj, flags, rc):
    if rc==0:
        print "Subscriber Connection status code: "+str(rc)+" | Connection status: successful"
    elif rc==1:
        print "Subscriber Connection status code: "+str(rc)+" | Connection status: Connection refused"

#called when a topic is successfully subscribed to
def on_subscribe(mqttc, obj, mid, granted_qos):
    print "Subscribed: "+str(mid)+" "+str(granted_qos)+"data"+str(obj)

#called when a message is received by a topic
def on_message(mqttc, obj, msg):
    data = ast.literal_eval(msg.payload)
    print data
    print "Received message from topic: "+msg.topic+" | QoS: "+str(msg.qos)+" | Data Received: "+json.dumps(msg.payload)
    print "------------------------------------------------------------"
    if (msg.topic == "$aws/things/myfan/shadow/update/accepted"):
        featuretype = data['state']['reported']['FeatureType']
        commandtype = data['state']['reported']['CommandType']
        if featuretype == "video":
            handle_video(commandtype)
        elif featuretype == "camera":
            handle_camera(commandtype)
	elif featuretype == "internetradio":
	    handle_internetradio(commandtype)
        else:
            print "Invalid Feature Request"

    
    
def handle_video(action):
    if action == "start" or action == "on" or action == "play":
        os.system('./playvideo &')
    elif action == "stop" or action == "off":
        os.system('killall gst-launch-0.10')
    else:
        print "Operation on Video Player not supported"
    
def handle_camera(action):
    if action == "start" or action == "on":
        os.system('./rvcapp &')
    elif action == "stop" or action == "off":
        os.system('killall rvcapp')
    else:
        print "Operation on camera not supported"

def handle_internetradio(action):
    if action == "start" or action == "on":
        os.system('./playfm &')
    elif action == "stop" or action == "off":
        os.system('killall gst-launch-0.10')
    else:
        print "Operation on Internet Radio not supported"
 
#creating a client with client-id=mqtt-test
mqttc = mqtt.Client(client_id="mqtt-test")

mqttc.on_connect = on_connect
mqttc.on_subscribe = on_subscribe
mqttc.on_message = on_message

#Configure network encryption and authentication options. Enables SSL/TLS support.
#adding client-side certificates and enabling tlsv1.2 support as required by aws-iot service
mqttc.tls_set("root-CA.crt",
	            certfile="904a03f6e5-certificate.pem.crt",
	            keyfile="904a03f6e5-private.pem.key",
			tls_version=ssl.PROTOCOL_TLSv1_2, 
              ciphers=None)

#connecting to aws-account-specific-iot-endpoint
mqttc.connect("a27ta3sxbmmw0b.iot.us-east-1.amazonaws.com", port=8883) #AWS IoT service hostname and portno

time.sleep(5)

#the topic to publish to
mqttc.subscribe("$aws/things/myfan/shadow/update/#", qos=1) #The names of these topics start with $aws/things/thingName/shadow."

#mqttc.publish("$aws/things/myfan/shadow/update", payload)

#automatically handles reconnecting
mqttc.loop_forever()
