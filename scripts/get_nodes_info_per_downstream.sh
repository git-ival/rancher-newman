#!/usr/bin/env bash

args=("$@")
url=("${args[@]:0:1}")      # first argument should be the Rancher cluster's url
token=("${args[@]:1:1}")    # second argument should be the Rancher cluster's token
username=("${args[@]:2:1}") # third argument should be the Rancher cluster's admin username
password=("${args[@]:3:1}") # fourth argument should be the Rancher cluster's admin password
clusters=("${args[@]:4}")   # remaining arguments should be some # of cluster IDs separated by spaces

echo "${url[0]}"
echo "${token[0]}"
echo "${username[0]}"
echo "${password[0]}"

for cluster in "${clusters[@]}"; do
  node get_nodes_info.js --url="${url[0]}" --token="${token[0]}" --username="${username[0]}" --password="${password[0]}" --cluster="${cluster}"
done

### example: ./get_nodes_info_per_downstream.sh <https://my.rancher.url> <my rancher token> <cluster1 ID> <cluster2 ID> ... <clusterN ID>
