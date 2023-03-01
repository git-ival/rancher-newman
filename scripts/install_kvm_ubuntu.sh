#!/bin/bash

### ubuntu 20.04

apt update -y \
&& apt upgrade -y

apt install cpu-checker qemu qemu-kvm libvirt-daemon-system libvirt-daemonlibvirt-clients bridge-utils -y \
&& kvm-ok \
&& usermod -aG libvirt $(whoami) \
&& usermod -aG libvirt-qemu $(whoami) \
&& reboot
