#! /usr/bin/env python

import requests
import os
import json
import re
import time
import random
import logging as log
from memcache import Client
from creds import *
from proxy import *

cont = True
device = "default"
proxies = ""

servers = ["127.0.0.1:11211"]
mc = Client(servers, debug=1)

log.basicConfig(format='%(levelname)s %(asctime)s %(message)s', level=log.DEBUG)
logger = log.getLogger(__name__)
path = os.path.realpath(__file__).rstrip(os.path.basename(__file__))

def cleanup():
    ret = os.path.isfile('out.wav')
    if ret:
        os.remove('out.wav')


def internet_on():
    logger.debug("Checking Internet Connection")
    try:
        r = requests.get('https://api.amazon.com/auth/o2/token', proxies=proxies)
        logger.debug("Connection OK")
        return True
    except:
        logger.debug("Connection Failed")
        return False


def gettoken():
    token = mc.get("access_token")
    refresh = refresh_token
    if token:
        return token
    elif refresh:
        logger.info("Refreshing token")
        payload = {"client_id" : Client_ID, "client_secret" : Client_Secret, "refresh_token" : refresh, "grant_type" : "refresh_token", }
        url = "https://api.amazon.com/auth/o2/token"
        r = requests.post(url, data = payload, proxies=proxies)
        resp = json.loads(r.text)
        mc.set("access_token", resp['access_token'], 3570)
        return resp['access_token']
    else:
        return False


def alexa(session):
    logger.debug("alexa main routine")
    url = 'https://access-alexa-na.amazon.com/v1/avs/speechrecognizer/recognize'
    headers = {'Authorization' : 'Bearer %s' % gettoken()}
    d = {
        "messageHeader": {
            "deviceContext": [
                {
                    "name": "playbackState",
                    "namespace": "AudioPlayer",
                    "payload": {
                        "streamId": "",
                        "offsetInMilliseconds": "0",
                        "playerActivity": "IDLE"
                    }
                }
            ]
        },
        "messageBody": {
            "profile": "alexa-close-talk",
            "locale": "en-us",
            "format": "audio/L16;rate=16000; channels=1"
        }
    }

    with open(path + 'out.wav') as inf:
        files = [
                ('file', ('request', json.dumps(d), 'application/json; charset=UTF-8')),
                ('file', ('audio', inf, 'audio/L16; rate=16000; channels=1'))
                ]
        logger.info("Posting audio command to Amazon Alexa Server")
        timestart = time.time()
        r = session.post(url, headers=headers, files=files, proxies=proxies)
        timestop = time.time()
        elapsed = timestop - timestart
        logger.info("Time for Amazon server response %d", elapsed)
    if r.status_code == 200:
        logger.info("HTTP:200 Status is OK")
        for v in r.headers['content-type'].split(";"):
            if re.match('.*boundary.*', v):
                boundary = v.split("=")[1]
        data = r.content.split(boundary)
        for d in data:
            if (len(d) >= 1024):
                audio = d.split('\r\n\r\n')[1].rstrip('--')
        with open(path + "response.mp3", 'wb') as f:
            f.write(audio)

        os.system('mpg123 -q {}response.mp3'.format(path))
        cont = True
    else:
        logger.info('Status is NOT OK')
        cont = False


def start():
    session = requests.Session()
    while cont:
        token = gettoken()
        os.system('aplay -q {}resources/start.wav'.format(path))
        os.system('arecord -q -Ddefault -d4 -c1 -r16000 -fS16_LE {}out.wav'.format(path))
        os.system('aplay -q {}resources/stop.wav'.format(path))
        alexa(session)


if __name__ == "__main__":
    start()

