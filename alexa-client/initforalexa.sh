#!/bin/bash

# Change the role
#echo host > /sys/kernel/debug/ci_hdrc.0/role
#systemctl start dropbear

# Mount in RW mode
#mount -oremount,rw /dev/ubi0_0 /

# Start the memcache server
/usr/bin/memcached -m 64 -p 11211 -u memcache -l 127.0.0.1 &
