#!/bin/bash

### ubuntu 20.04

apt update -y \
&& apt upgrade -y \
&& apt install cpu-checker -y \
&& kvm-ok

apt install qemu qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils -y \
&& usermod -aG libvirt $(whoami) \
&& usermod -aG libvirt-qemu $(whoami) \
&& reboot
