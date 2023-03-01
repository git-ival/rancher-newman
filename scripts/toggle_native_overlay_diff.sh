#!/bin/bash

NATIVE_DIFF_OVERLAY=${1}
### Removed this functionality since this script was only used for overlay2 storage driver testing, with Rancher NodeTemplates defining the docker storage driver.
### This code can be used if the ability to change the storage driver is needed AND the docker storage driver is not being set elsewhere (such as in a NodeTemplate).
# OVERLAYFS_STORAGE_DRIVER=${2:-overlay2}
# echo "STOPPING DOCKER"
# systemctl stop docker
# echo "SETTING OVERLAY DRIVER"
# systemctl stop docker && cat <<EOF >/etc/docker/daemon.json
# {
#   "storage-driver": "${OVERLAYFS_STORAGE_DRIVER}"
# }
# EOF
# echo "STARTING DOCKER"
# systemctl start docker

# if docker info | grep -q ${OVERLAYFS_STORAGE_DRIVER}; then
#   echo "OVERLAY DRIVER SET CORRECTLY"
# fi

if [ $NATIVE_DIFF_OVERLAY = true ]; then
  ### Turn ON native overlay diff
  echo "TURNING NATIVE DIFF OVERALY ON"
  systemctl stop docker && modprobe -r overlay && modprobe overlay metacopy=off redirect_dir=off && systemctl start docker
fi

if [ $NATIVE_DIFF_OVERLAY = false ]; then
  ### Turn OFF native overlay diff
  echo "TURNING NATIVE DIFF OVERALY OFF"
  systemctl stop docker && modprobe -r overlay && modprobe overlay redirect_dir=on && systemctl start docker
fi
