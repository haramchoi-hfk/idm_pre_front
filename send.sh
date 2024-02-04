#!/usr/bin/bash

scp -i ~/created_from_workstation.pem -r $1 ubuntu@51.20.250.173:/home/ubuntu/idm-pre-front

